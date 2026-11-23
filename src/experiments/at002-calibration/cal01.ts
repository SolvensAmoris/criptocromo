import { createHash } from 'node:crypto';
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
  observedActivations: number[];
  clippedValueCount: number;
  totalAbsoluteClippingExcess: number;
  meanActivation: number;
}

interface SeedMetrics {
  seed: number;
  tickCount: number;
  maxRawActivation: number;
  minRawActivation: number;
  maxAbsoluteRawActivation: number;
  maxObservedActivation: number;
  clippedValueCount: number;
  totalValueCount: number;
  clippedFraction: number;
  totalAbsoluteClippingExcess: number;
  ticksWithAnyClipping: number;
  peakMeanActivation: number;
  residualMeanActivation: number;
  meanActiveNodeFraction: number;
}

interface VariantOutput {
  variant: Variant;
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

    for (let tick = 0; tick < totalTicks; tick += 1) {
      const stimulus = stimulusAt(tick, config);
      const raw = calculateRawActivations(state, stimulus, simulationConfig);
      const next = engine.stepNetwork(state, stimulus, simulationConfig);
      const observed = next.nodes.map(node => node.activation);
      const expected = raw.map(value => variant === 'O' ? Math.min(1, Math.max(0, value)) : value);

      if (observed.some((value, index) => Math.abs(value - expected[index]) > 1e-12)) {
        throw new Error(`CAL-01 instrumentation parity failure: ${variant}, seed ${seed}, tick ${tick + 1}`);
      }

      const clippingExcess = raw.map(value => value < 0 ? -value : value > 1 ? value - 1 : 0);
      const clippedValueCount = clippingExcess.filter(value => value > 0).length;
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
        meanActivation: engine.meanActivation(next)
      });
      state = next;
    }

    const allRaw = seedRecords.flatMap(record => record.rawActivations);
    const allObserved = seedRecords.flatMap(record => record.observedActivations);
    const clippedValueCount = seedRecords.reduce((sum, record) => sum + record.clippedValueCount, 0);
    const totalValueCount = allRaw.length;
    const activeFractions = seedRecords.map(record =>
      record.observedActivations.filter(value => value > 0).length / record.observedActivations.length
    );

    metrics.push({
      seed,
      tickCount: seedRecords.length,
      maxRawActivation: Math.max(...allRaw),
      minRawActivation: Math.min(...allRaw),
      maxAbsoluteRawActivation: Math.max(...allRaw.map(Math.abs)),
      maxObservedActivation: Math.max(...allObserved),
      clippedValueCount,
      totalValueCount,
      clippedFraction: totalValueCount ? clippedValueCount / totalValueCount : 0,
      totalAbsoluteClippingExcess: seedRecords.reduce((sum, record) => sum + record.totalAbsoluteClippingExcess, 0),
      ticksWithAnyClipping: seedRecords.filter(record => record.clippedValueCount > 0).length,
      peakMeanActivation: Math.max(...seedRecords.map(record => record.meanActivation)),
      residualMeanActivation: seedRecords[seedRecords.length - 1].meanActivation,
      meanActiveNodeFraction: activeFractions.reduce((sum, value) => sum + value, 0) / activeFractions.length
    });
    records.push(...seedRecords);
  }
  return { variant, records, metrics };
}

function writeVariantOutput(
  output: VariantOutput,
  config: At002Configuration,
  runId: string,
  configSha256: string,
  temporaryDirectory: string
): string {
  const identity = config.engineVariants[output.variant];
  mkdirSync(temporaryDirectory, { recursive: false });
  const manifest = {
    experimentId: config.experimentId,
    protocolVersion: config.protocolVersion,
    stage: 'CAL-01',
    runId,
    engineVariant: output.variant,
    engineVersion: identity.version,
    engineModule: identity.module,
    engineSourceBlobSha1: identity.sourceBlobSha1,
    engineDependencyBlobSha1: identity.dependencyBlobSha1,
    instrumentationBlobSha1: config.cal01.instrumentation,
    configSha256,
    seedSet: config.seeds,
    pulseSteps: config.protocol.pulseSteps,
    recoverySteps: config.protocol.recoverySteps,
    targetFrequency: config.protocol.targetFrequency,
    intensity: config.cal01.intensity,
    switches: config.cal01.switches,
    simulationDefaults: { ...defaultConfig, seed: undefined },
    runtime: { node: process.version, platform: process.platform, arch: process.arch },
    recordCount: output.records.length,
    createdAt: new Date().toISOString()
  };

  writeFileSync(path.join(temporaryDirectory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  writeFileSync(path.join(temporaryDirectory, 'traces.jsonl'), output.records.map(record => JSON.stringify(record)).join('\n') + '\n', { flag: 'wx' });
  writeFileSync(path.join(temporaryDirectory, 'metrics.json'), JSON.stringify({
    engineVariant: output.variant,
    engineVersion: identity.version,
    seedMetrics: output.metrics
  }, null, 2) + '\n', { flag: 'wx' });

  // temporaryDirectory already lives under <root>/<variant>/CAL-01.
  const resolvedFinal = path.join(path.dirname(temporaryDirectory), runId);
  renameSync(temporaryDirectory, resolvedFinal);
  return resolvedFinal;
}

export function runCal01(
  config: At002Configuration,
  runId: string,
  repoRoot: string,
  outputRoot: string,
  configRaw: string
): { runId: string; configSha256: string; outputs: Record<Variant, string>; recordCountPerVariant: number } {
  if (!/^[a-zA-Z0-9._-]+$/.test(runId)) throw new Error('runId contains unsafe path characters');
  buildCalibrationPlan(config);
  if (config.cal01.variants.length !== 2 || config.cal01.variants[0] !== 'O' || config.cal01.variants[1] !== 'D') {
    throw new Error('CAL-01 execution is restricted to paired O then D');
  }
  verifyEngineIdentity(config, repoRoot);

  const configSha256 = sha256(configRaw);
  const outputs = (['O', 'D'] as const).map(variant => simulateVariant(config, variant));
  const finalDirectories = outputs.map(output => path.join(outputRoot, output.variant, 'CAL-01', runId));
  const temporaryDirectories = outputs.map(output => path.join(outputRoot, output.variant, 'CAL-01', `.tmp-${runId}`));

  if (finalDirectories.some(existsSync) || temporaryDirectories.some(existsSync)) {
    throw new Error('CAL-01 run directory already exists; overwrite is forbidden');
  }
  for (const directory of finalDirectories) mkdirSync(path.dirname(directory), { recursive: true });

  try {
    const published: Record<Variant, string> = { O: '', D: '' };
    outputs.forEach((output, index) => {
      published[output.variant] = writeVariantOutput(
        output, config, runId, configSha256, temporaryDirectories[index]
      );
    });
    return { runId, configSha256, outputs: published, recordCountPerVariant: outputs[0].records.length };
  } catch (error) {
    for (const directory of temporaryDirectories) if (existsSync(directory)) rmSync(directory, { recursive: true, force: true });
    for (const directory of finalDirectories) if (existsSync(directory)) rmSync(directory, { recursive: true, force: true });
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
