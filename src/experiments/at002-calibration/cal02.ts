import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NetworkState, SimulationConfig, Stimulus } from '../../core/types';
import { defaultConfig } from '../at001/config';
import * as O from './engines/engine-v0.1.0-O';
import { calculateRawActivations } from './diagnostics';
import { buildCalibrationPlan, type At002Configuration } from './runner';

const gitBlobSha1 = (bytes: Buffer): string =>
  createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const sha256 = (value: Buffer | string): string => createHash('sha256').update(value).digest('hex');

function verifyIdentity(config: At002Configuration, repoRoot: string): void {
  const identity = config.engineVariants.O;
  const paths = { [identity.module]: identity.sourceBlobSha1, ...identity.dependencyBlobSha1 };
  for (const [relativePath, expected] of Object.entries(paths)) {
    const actual = gitBlobSha1(readFileSync(path.join(repoRoot, relativePath)));
    if (actual !== expected) throw new Error(`CAL-02 O identity mismatch: ${relativePath}`);
  }
}

interface Cal02Trace {
  experimentId: string;
  protocolVersion: string;
  stage: 'CAL-02';
  engineVariant: 'O';
  engineVersion: string;
  seed: number;
  intensity: number;
  tick: number;
  phase: 'pulse' | 'recovery';
  stimulus: Stimulus;
  rawActivations: number[];
  observedActivations: number[];
  clippedValueCount: number;
  clippingExcess: number;
  meanActivation: number;
  activeNodeFraction: number;
}

interface SeedMetric {
  seed: number;
  intensity: number;
  status: 'COMPLETE';
  plannedTickCount: number;
  completedTickCount: number;
  peakMeanActivation: number;
  residualMeanActivation: number;
  recoveryDropFraction: number | null;
  meanActiveNodeFraction: number;
  clippedValueCount: number;
  totalValueCount: number;
  clippedFraction: number;
  totalAbsoluteClippingExcess: number;
  ticksWithAnyClipping: number;
  peakNodeActivation: number;
  floorValueCount: number;
  ceilingValueCount: number;
}

export function runCal02(
  config: At002Configuration,
  runId: string,
  repoRoot: string,
  outputRoot: string,
  configRaw: string
): { runId: string; configSha256: string; sourceCommitSha: string; output: string; recordCount: number; seedCount: number; intensityLevels: number[] } {
  if (!/^[a-zA-Z0-9._-]+$/.test(runId)) throw new Error('runId contains unsafe path characters');
  const plan = buildCalibrationPlan(config).filter(job => job.stage === 'CAL-02');
  if (config.cal02.engineVariant !== 'O' || !config.cal02.fixedParameters) throw new Error('CAL-02 is restricted to fixed-parameter O');
  if (!config.cal02.levels.length || new Set(config.cal02.levels).size !== config.cal02.levels.length) throw new Error('CAL-02 intensity levels must be non-empty and unique');
  if (plan.length !== config.seeds.length * config.cal02.levels.length) throw new Error('CAL-02 plan cardinality mismatch');
  verifyIdentity(config, repoRoot);

  const records: Cal02Trace[] = [];
  const metrics: SeedMetric[] = [];
  const totalTicks = config.protocol.pulseSteps + config.protocol.recoverySteps;
  for (const intensity of config.cal02.levels) {
    for (const seed of config.seeds) {
      const simulationConfig: SimulationConfig = { ...defaultConfig, seed, switches: { ...config.cal02.switches } };
      let state: NetworkState = O.createNetwork(simulationConfig);
      const seedRecords: Cal02Trace[] = [];
      for (let index = 0; index < totalTicks; index += 1) {
        const pulse = index < config.protocol.pulseSteps;
        const stimulus: Stimulus = {
          frequency: config.protocol.targetFrequency,
          intensity: pulse ? intensity : 0
        };
        const raw = calculateRawActivations(state, stimulus, simulationConfig);
        const next = O.stepNetwork(state, stimulus, simulationConfig);
        const observed = next.nodes.map(node => node.activation);
        const expected = raw.map(value => Math.min(1, Math.max(0, value)));
        if (observed.some((value, i) => Math.abs(value - expected[i]) > 1e-12)) {
          throw new Error(`CAL-02 instrumentation parity failure: intensity ${intensity}, seed ${seed}, tick ${index + 1}`);
        }
        const excess = raw.map(value => value < 0 ? -value : value > 1 ? value - 1 : 0);
        const meanActivation = O.meanActivation(next);
        const activeNodeFraction = observed.filter(value => value > 0).length / observed.length;
        seedRecords.push({
          experimentId: config.experimentId,
          protocolVersion: config.protocolVersion,
          stage: 'CAL-02',
          engineVariant: 'O',
          engineVersion: config.engineVariants.O.version,
          seed,
          intensity,
          tick: index + 1,
          phase: pulse ? 'pulse' : 'recovery',
          stimulus,
          rawActivations: raw,
          observedActivations: observed,
          clippedValueCount: excess.filter(value => value > 0).length,
          clippingExcess: excess.reduce((sum, value) => sum + value, 0),
          meanActivation,
          activeNodeFraction
        });
        state = next;
      }
      const pulseRecords = seedRecords.filter(record => record.phase === 'pulse');
      const recoveryRecords = seedRecords.filter(record => record.phase === 'recovery');
      const peakMeanActivation = Math.max(...pulseRecords.map(record => record.meanActivation));
      const residualMeanActivation = recoveryRecords[recoveryRecords.length - 1].meanActivation;
      const clippedValueCount = seedRecords.reduce((sum, record) => sum + record.clippedValueCount, 0);
      const totalValueCount = seedRecords.reduce((sum, record) => sum + record.rawActivations.length, 0);
      metrics.push({
        seed, intensity, status: 'COMPLETE', plannedTickCount: totalTicks, completedTickCount: seedRecords.length,
        peakMeanActivation, residualMeanActivation,
        recoveryDropFraction: peakMeanActivation > 0 ? (peakMeanActivation - residualMeanActivation) / peakMeanActivation : null,
        meanActiveNodeFraction: seedRecords.reduce((sum, record) => sum + record.activeNodeFraction, 0) / seedRecords.length,
        clippedValueCount, totalValueCount, clippedFraction: clippedValueCount / totalValueCount,
        totalAbsoluteClippingExcess: seedRecords.reduce((sum, record) => sum + record.clippingExcess, 0),
        ticksWithAnyClipping: seedRecords.filter(record => record.clippedValueCount > 0).length,
        peakNodeActivation: Math.max(...seedRecords.flatMap(record => record.observedActivations)),
        floorValueCount: seedRecords.reduce((sum, record) => sum + record.observedActivations.filter(value => value === 0).length, 0),
        ceilingValueCount: seedRecords.reduce((sum, record) => sum + record.observedActivations.filter(value => value === 1).length, 0)
      });
      records.push(...seedRecords);
    }
  }

  const configSha256 = sha256(configRaw);
  const sourceCommitSha = process.env.GITHUB_SHA ?? execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  if (!/^[a-f0-9]{40}$/.test(sourceCommitSha)) throw new Error('Unable to establish a valid source commit SHA');
  const finalDirectory = path.join(outputRoot, 'O', 'CAL-02', runId);
  const temporaryDirectory = path.join(outputRoot, 'O', 'CAL-02', `.tmp-${runId}`);
  if (existsSync(finalDirectory) || existsSync(temporaryDirectory)) throw new Error('CAL-02 run directory already exists; overwrite is forbidden');
  mkdirSync(path.dirname(finalDirectory), { recursive: true });
  mkdirSync(temporaryDirectory, { recursive: false });
  try {
    const manifest = {
      experimentId: config.experimentId, protocolVersion: config.protocolVersion, stage: 'CAL-02', runId,
      status: 'COMPLETE', engineVariant: 'O', engineVersion: config.engineVariants.O.version,
      engineModule: config.engineVariants.O.module, engineSourceBlobSha1: config.engineVariants.O.sourceBlobSha1,
      engineDependencyBlobSha1: config.engineVariants.O.dependencyBlobSha1, configSha256, sourceCommitSha,
      seedSet: config.seeds, intensityLevels: config.cal02.levels, factor: config.cal02.factor,
      fixedParameters: config.cal02.fixedParameters, switches: config.cal02.switches,
      pulseSteps: config.protocol.pulseSteps, recoverySteps: config.protocol.recoverySteps,
      targetFrequency: config.protocol.targetFrequency, recordCount: records.length,
      plannedStepCount: config.seeds.length * config.cal02.levels.length * totalTicks,
      completedStepCount: records.length, runtime: { node: process.version, platform: process.platform, arch: process.arch },
      createdAt: new Date().toISOString()
    };
    writeFileSync(path.join(temporaryDirectory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
    writeFileSync(path.join(temporaryDirectory, 'traces.jsonl'), records.map(record => JSON.stringify(record)).join('\n') + '\n', { flag: 'wx' });
    writeFileSync(path.join(temporaryDirectory, 'metrics.json'), JSON.stringify({
      engineVariant: 'O', engineVersion: config.engineVariants.O.version, intensityLevels: config.cal02.levels, seedMetrics: metrics
    }, null, 2) + '\n', { flag: 'wx' });
    const names = ['manifest.json', 'traces.jsonl', 'metrics.json'];
    writeFileSync(path.join(temporaryDirectory, 'checksums.sha256'), names.map(name =>
      `${sha256(readFileSync(path.join(temporaryDirectory, name)))}  ${name}`
    ).join('\n') + '\n', { flag: 'wx' });
    renameSync(temporaryDirectory, finalDirectory);
  } catch (error) {
    if (existsSync(temporaryDirectory)) rmSync(temporaryDirectory, { recursive: true, force: true });
    throw error;
  }
  return { runId, configSha256, sourceCommitSha, output: finalDirectory, recordCount: records.length, seedCount: metrics.length, intensityLevels: [...config.cal02.levels] };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const repoRoot = path.resolve(fileURLToPath(new URL('../../../', import.meta.url)));
  const configPath = path.join(repoRoot, 'experiments/AT-002-CALIBRATION/configuration.json');
  const configRaw = readFileSync(configPath, 'utf8');
  const config = JSON.parse(configRaw) as At002Configuration;
  const runId = process.env.AT002_RUN_ID;
  if (process.env.AT002_CAL02_AUTHORIZED !== 'YES') throw new Error('CAL-02 campaign is not authorized. Set AT002_CAL02_AUTHORIZED=YES only after protocol review.');
  if (!runId) throw new Error('Set AT002_RUN_ID explicitly; implicit run IDs are not permitted');
  const result = runCal02(config, runId, repoRoot, path.join(repoRoot, config.artifactPolicy.root), configRaw);
  process.stdout.write(JSON.stringify({ mode: 'CAL-02_EXECUTED', ...result }, null, 2) + '\n');
}
