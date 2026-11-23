import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NetworkState, SimulationConfig, Stimulus } from '../../core/types';
import { defaultConfig } from '../at001/config';
import * as O from './engines/engine-v0.1.0-O';
import * as D from './engines/engine-v0.2.0-D';
import { calculateRawActivations } from './diagnostics';
import { buildCalibrationPlan, type At002Configuration } from './runner';

type Variant = 'O' | 'D';
type EngineApi = {
  createNetwork(config: SimulationConfig): NetworkState;
  stepNetwork(state: NetworkState, stimulus: Stimulus, config: SimulationConfig): NetworkState;
  meanActivation(state: NetworkState): number;
};
const ENGINES: Record<Variant, EngineApi> = { O, D };
const gitBlobSha1 = (bytes: Buffer): string =>
  createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const sha256 = (value: Buffer | string): string => createHash('sha256').update(value).digest('hex');

function verifyEngineIdentity(config: At002Configuration, repoRoot: string): void {
  for (const variant of ['O', 'D'] as const) {
    const identity = config.engineVariants[variant];
    const moduleBytes = readFileSync(path.join(repoRoot, identity.module));
    if (gitBlobSha1(moduleBytes) !== identity.sourceBlobSha1) {
      throw new Error(`Source identity mismatch for engine ${variant}: module hash differs from configuration`);
    }
    for (const [relativePath, expectedHash] of Object.entries(identity.dependencyBlobSha1)) {
      const bytes = readFileSync(path.join(repoRoot, relativePath));
      if (gitBlobSha1(bytes) !== expectedHash) {
        throw new Error(`Source identity mismatch for engine ${variant}: dependency ${relativePath} differs from configuration`);
      }
    }
  }
  for (const [relativePath, expectedHash] of Object.entries(config.cal01.instrumentation)) {
    const bytes = readFileSync(path.join(repoRoot, relativePath));
    if (gitBlobSha1(bytes) !== expectedHash) {
      throw new Error(`CAL-01 instrumentation identity mismatch: ${relativePath}`);
    }
  }
  if (config.engineVariants.D.sharedKernelBlobSha1 !==
      config.engineVariants.D.dependencyBlobSha1['src/experiments/at002-calibration/engines/variant-engine.ts']) {
    throw new Error('D shared kernel identity is inconsistent with dependency identity');
  }
}

function stimulusAt(tick: number, config: At002Configuration): Stimulus {
  return tick < config.protocol.pulseSteps
    ? { frequency: config.protocol.targetFrequency, intensity: config.cal01.intensity }
    : { frequency: config.protocol.targetFrequency, intensity: 0 };
}

interface TickRecord {
  experimentId: string;
  protocolVersion: string;
  stage: 'CAL-01';
  engineVariant: Variant;
  engineVersion: string;
  seed: number;
  tick: number;
  phase: 'pulse' | 'recovery';
  stimulus: Stimulus;
  rawActivations: number[];
  observedActivations: number[] | null;
  clippedValueCount: number;
  totalAbsoluteClippingExcess: number;
  meanActivation: number | null;
  stepStatus: 'completed' | 'guard_aborted';
  error?: string;
}

interface SeedMetrics {
  seed: number;
  status: 'COMPLETE' | 'ABORTED_GUARD';
  plannedTickCount: number;
  completedTickCount: number;
  guardTriggered: boolean;
  guardError?: string;
  maxRawActivation: number;
  minRawActivation: number;
  maxAbsoluteRawActivation: number;
  maxObservedActivation: number | null;
  clippedValueCount: number;
  totalValueCount: number;
  clippedFraction: number;
  totalAbsoluteClippingExcess: number;
  ticksWithAnyClipping: number;
  peakMeanActivation: number | null;
  residualMeanActivation: number | null;
  meanActiveNodeFraction: number | null;
}

interface VariantOutput {
  variant: Variant;
  status: 'COMPLETE' | 'ABORTED_GUARD';
  records: TickRecord[];
  metrics: SeedMetrics[];
}

function simulateVariant(config: At002Configuration, variant: Variant): VariantOutput {
  const engine = ENGINES[variant];
  const records: TickRecord[] = [];
  const metrics: SeedMetrics[] = [];
  const totalTicks = config.protocol.pulseSteps + config.protocol.recoverySteps;

  for (const seed of config.seeds) {
    const simulationConfig: SimulationConfig = {
      ...defaultConfig,
      seed,
      switches: { ...config.cal01.switches }
    };
    let state = engine.createNetwork(simulationConfig);
    const seedRecords: TickRecord[] = [];
    let guardError: string | undefined;

    for (let tick = 0; tick < totalTicks; tick += 1) {
      const stimulus = stimulusAt(tick, config);
      const raw = calculateRawActivations(state, stimulus, simulationConfig);
      const clippingExcess = raw.map(value => value < 0 ? -value : value > 1 ? value - 1 : 0);
      const clippedValueCount = clippingExcess.filter(value => value > 0).length;

      let next: NetworkState;
      try {
        next = engine.stepNetwork(state, stimulus, simulationConfig);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (variant !== 'D' || !message.includes('overflow guard')) throw error;
        guardError = message;
        seedRecords.push({
          experimentId: config.experimentId,
          protocolVersion: config.protocolVersion,
          stage: 'CAL-01',
          engineVariant: variant,
          engineVersion: config.engineVariants[variant].version,
          seed,
          tick: tick + 1,
          phase: tick < config.protocol.pulseSteps ? 'pulse' : 'recovery',
          stimulus,
          rawActivations: raw,
          observedActivations: null,
          clippedValueCount,
          totalAbsoluteClippingExcess: clippingExcess.reduce((sum, value) => sum + value, 0),
          meanActivation: null,
          stepStatus: 'guard_aborted',
          error: message
        });
        break;
      }

      const observed = next.nodes.map(node => node.activation);
      const expected = raw.map(value => variant === 'O' ? Math.min(1, Math.max(0, value)) : value);
      if (observed.some((value, index) => Math.abs(value - expected[index]) > 1e-12)) {
        throw new Error(`CAL-01 instrumentation parity failure: ${variant}, seed ${seed}, tick ${tick + 1}`);
      }
      seedRecords.push({
        experimentId: config.experimentId,
        protocolVersion: config.protocolVersion,
        stage: 'CAL-01',
        engineVariant: variant,
        engineVersion: config.engineVariants[variant].version,
        seed,
        tick: tick + 1,
        phase: tick < config.protocol.pulseSteps ? 'pulse' : 'recovery',
        stimulus,
        rawActivations: raw,
        observedActivations: observed,
        clippedValueCount,
        totalAbsoluteClippingExcess: clippingExcess.reduce((sum, value) => sum + value, 0),
        meanActivation: engine.meanActivation(next),
        stepStatus: 'completed'
      });
      state = next;
    }

    const allRaw = seedRecords.flatMap(record => record.rawActivations);
    const allObserved = seedRecords.flatMap(record => record.observedActivations ?? []);
    const completedRecords = seedRecords.filter(record => record.stepStatus === 'completed');
    const clippedValueCount = seedRecords.reduce((sum, record) => sum + record.clippedValueCount, 0);
    const totalValueCount = allRaw.length;
    const activeFractions = completedRecords.map(record =>
      (record.observedActivations ?? []).filter(value => value > 0).length /
      (record.observedActivations?.length || 1)
    );
    const completedMeans = completedRecords.map(record => record.meanActivation as number);

    metrics.push({
      seed,
      status: guardError ? 'ABORTED_GUARD' : 'COMPLETE',
      plannedTickCount: totalTicks,
      completedTickCount: completedRecords.length,
      guardTriggered: Boolean(guardError),
      ...(guardError ? { guardError } : {}),
      maxRawActivation: Math.max(...allRaw),
      minRawActivation: Math.min(...allRaw),
      maxAbsoluteRawActivation: Math.max(...allRaw.map(Math.abs)),
      maxObservedActivation: allObserved.length ? Math.max(...allObserved) : null,
      clippedValueCount,
      totalValueCount,
      clippedFraction: totalValueCount ? clippedValueCount / totalValueCount : 0,
      totalAbsoluteClippingExcess: seedRecords.reduce((sum, record) => sum + record.totalAbsoluteClippingExcess, 0),
      ticksWithAnyClipping: seedRecords.filter(record => record.clippedValueCount > 0).length,
      peakMeanActivation: completedMeans.length ? Math.max(...completedMeans) : null,
      residualMeanActivation: completedMeans.length ? completedMeans[completedMeans.length - 1] : null,
      meanActiveNodeFraction: activeFractions.length
        ? activeFractions.reduce((sum, value) => sum + value, 0) / activeFractions.length : null
    });
    records.push(...seedRecords);
  }

  return {
    variant,
    status: metrics.some(metric => metric.guardTriggered) ? 'ABORTED_GUARD' : 'COMPLETE',
    records,
    metrics
  };
}

function writeVariantOutput(
  output: VariantOutput,
  config: At002Configuration,
  runId: string,
  configSha256: string,
  sourceCommitSha: string,
  temporaryDirectory: string
): string {
  const identity = config.engineVariants[output.variant];
  mkdirSync(temporaryDirectory, { recursive: false });
  const manifest = {
    experimentId: config.experimentId,
    protocolVersion: config.protocolVersion,
    stage: 'CAL-01',
    runId,
    status: output.status,
    engineVariant: output.variant,
    engineVersion: identity.version,
    engineModule: identity.module,
    engineSourceBlobSha1: identity.sourceBlobSha1,
    engineDependencyBlobSha1: identity.dependencyBlobSha1,
    instrumentationBlobSha1: config.cal01.instrumentation,
    configSha256,
    sourceCommitSha,
    seedSet: config.seeds,
    pulseSteps: config.protocol.pulseSteps,
    recoverySteps: config.protocol.recoverySteps,
    targetFrequency: config.protocol.targetFrequency,
    intensity: config.cal01.intensity,
    switches: config.cal01.switches,
    simulationDefaults: { ...defaultConfig, seed: undefined },
    runtime: { node: process.version, platform: process.platform, arch: process.arch },
    plannedStepCount: config.seeds.length * (config.protocol.pulseSteps + config.protocol.recoverySteps),
    completedStepCount: output.metrics.reduce((sum, metric) => sum + metric.completedTickCount, 0),
    guardAbortCount: output.metrics.filter(metric => metric.guardTriggered).length,
    recordCount: output.records.length,
    createdAt: new Date().toISOString()
  };

  writeFileSync(path.join(temporaryDirectory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  writeFileSync(path.join(temporaryDirectory, 'traces.jsonl'), output.records.map(record => JSON.stringify(record)).join('\n') + '\n', { flag: 'wx' });
  writeFileSync(path.join(temporaryDirectory, 'metrics.json'), JSON.stringify({
    engineVariant: output.variant,
    engineVersion: identity.version,
    status: output.status,
    seedMetrics: output.metrics
  }, null, 2) + '\n', { flag: 'wx' });
  const checksumNames = ['manifest.json', 'traces.jsonl', 'metrics.json'];
  const checksumText = checksumNames.map(name =>
    `${sha256(readFileSync(path.join(temporaryDirectory, name)))}  ${name}`
  ).join('\n') + '\n';
  writeFileSync(path.join(temporaryDirectory, 'checksums.sha256'), checksumText, { flag: 'wx' });

  const finalDirectory = path.join(path.dirname(temporaryDirectory), runId);
  renameSync(temporaryDirectory, finalDirectory);
  return finalDirectory;
}

export function runCal01(
  config: At002Configuration,
  runId: string,
  repoRoot: string,
  outputRoot: string,
  configRaw: string
): {
  runId: string;
  configSha256: string;
  sourceCommitSha: string;
  outputs: Record<Variant, string>;
  statusByVariant: Record<Variant, 'COMPLETE' | 'ABORTED_GUARD'>;
  recordCountByVariant: Record<Variant, number>;
  completedStepCountByVariant: Record<Variant, number>;
  guardAbortCountByVariant: Record<Variant, number>;
} {
  if (!/^[a-zA-Z0-9._-]+$/.test(runId)) throw new Error('runId contains unsafe path characters');
  buildCalibrationPlan(config);
  if (config.cal01.variants.length !== 2 || config.cal01.variants[0] !== 'O' || config.cal01.variants[1] !== 'D') {
    throw new Error('CAL-01 execution is restricted to paired O then D');
  }
  verifyEngineIdentity(config, repoRoot);

  const configSha256 = sha256(configRaw);
  const sourceCommitSha = process.env.GITHUB_SHA ?? execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  if (!/^[a-f0-9]{40}$/.test(sourceCommitSha)) throw new Error('Unable to establish a valid source commit SHA');
  const outputs = (['O', 'D'] as const).map(variant => simulateVariant(config, variant));
  const finalDirectories = outputs.map(output => path.join(outputRoot, output.variant, 'CAL-01', runId));
  const temporaryDirectories = outputs.map(output => path.join(outputRoot, output.variant, 'CAL-01', `.tmp-${runId}`));

  if (finalDirectories.some(existsSync) || temporaryDirectories.some(existsSync)) {
    throw new Error('CAL-01 run directory already exists; overwrite is forbidden');
  }
  for (const directory of finalDirectories) mkdirSync(path.dirname(directory), { recursive: true });

  const publishedDirectories: string[] = [];
  try {
    const published: Record<Variant, string> = { O: '', D: '' };
    outputs.forEach((output, index) => {
      const directory = writeVariantOutput(output, config, runId, configSha256, sourceCommitSha, temporaryDirectories[index]);
      published[output.variant] = directory;
      publishedDirectories.push(directory);
    });
    const byVariant = (variant: Variant) => outputs.find(output => output.variant === variant)!;
    return {
      runId,
      configSha256,
      sourceCommitSha,
      outputs: published,
      statusByVariant: { O: byVariant('O').status, D: byVariant('D').status },
      recordCountByVariant: { O: byVariant('O').records.length, D: byVariant('D').records.length },
      completedStepCountByVariant: {
        O: byVariant('O').metrics.reduce((sum, metric) => sum + metric.completedTickCount, 0),
        D: byVariant('D').metrics.reduce((sum, metric) => sum + metric.completedTickCount, 0)
      },
      guardAbortCountByVariant: {
        O: byVariant('O').metrics.filter(metric => metric.guardTriggered).length,
        D: byVariant('D').metrics.filter(metric => metric.guardTriggered).length
      }
    };
  } catch (error) {
    for (const directory of temporaryDirectories) if (existsSync(directory)) rmSync(directory, { recursive: true, force: true });
    for (const directory of publishedDirectories) if (existsSync(directory)) rmSync(directory, { recursive: true, force: true });
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const repoRoot = path.resolve(fileURLToPath(new URL('../../../', import.meta.url)));
  const configPath = path.join(repoRoot, 'experiments/AT-002-CALIBRATION/configuration.json');
  const configRaw = readFileSync(configPath, 'utf8');
  const config = JSON.parse(configRaw) as At002Configuration;
  const runId = process.env.AT002_RUN_ID;
  if (process.env.AT002_CAL01_AUTHORIZED !== 'YES') {
    throw new Error('CAL-01 campaign is not authorized. Set AT002_CAL01_AUTHORIZED=YES only after protocol review.');
  }
  if (!runId) throw new Error('Set AT002_RUN_ID explicitly; implicit run IDs are not permitted');
  const outputRoot = path.join(repoRoot, config.artifactPolicy.root);
  const result = runCal01(config, runId, repoRoot, outputRoot, configRaw);
  process.stdout.write(JSON.stringify({ mode: 'CAL-01_EXECUTED', ...result }, null, 2) + '\n');
}
