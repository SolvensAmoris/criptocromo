import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NetworkState, SimulationConfig, Stimulus } from '../core/types';
import { defaultConfig } from './at001/config';
import * as O from './at002-calibration/engines/engine-v0.1.0-O';
import * as D from './at002-calibration/engines/engine-v0.2.0-D';
import { calculateRawActivations } from './at002-calibration/diagnostics';
import configJson from '../../experiments/AT-002-CALIBRATION/configuration.json';
type Variant = 'O' | 'D';
type Variable = 'BASELINE' | 'ACT' | 'MEM' | 'WGT';
type Engine = { createNetwork(config: SimulationConfig): NetworkState; stepNetwork(state: NetworkState, stimulus: Stimulus, config: SimulationConfig): NetworkState };
const engines: Record<Variant, Engine> = { O, D };
const config = configJson as { engineVariants: Record<Variant, { module: string; sourceBlobSha1: string; dependencyBlobSha1: Record<string, string> }>; seeds: number[]; protocol: { targetFrequency: number; pulseSteps: number; recoverySteps: number }; cal01: { intensity: number; switches: { memory: boolean; resonance: boolean; plasticity: boolean } } };
const LEVELS = [1e-6, 1e-8, 1e-10] as const;
const ROOT = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const OUT = path.join(ROOT, 'artifacts/BEHAVIORAL-SENSITIVITY');
const RUN_ID = process.env.SENSITIVITY_RUN_ID ?? '';
const sha256 = (data: Buffer | string): string => createHash('sha256').update(data).digest('hex');
const gitBlobSha1 = (bytes: Buffer): string => createHash('sha1').update('blob ' + bytes.length + '\\0').update(bytes).digest('hex');
function verifySources(): void {
  for (const variant of ['O', 'D'] as const) {
    const identity = config.engineVariants[variant];
    if (gitBlobSha1(readFileSync(path.join(ROOT, identity.module))) !== identity.sourceBlobSha1) throw new Error('Pinned source mismatch: ' + variant);
    for (const [file, expected] of Object.entries(identity.dependencyBlobSha1)) if (gitBlobSha1(readFileSync(path.join(ROOT, file))) !== expected) throw new Error('Pinned dependency mismatch: ' + variant + ': ' + file);
  }
}
function stimuli(): Stimulus[] {
  return Array.from({ length: config.protocol.pulseSteps + config.protocol.recoverySteps }, (_, index) => ({ frequency: config.protocol.targetFrequency, intensity: index < config.protocol.pulseSteps ? config.cal01.intensity : 0 }));
}
function perturb(initial: NetworkState, variable: Exclude<Variable, 'BASELINE'>, delta: number, seedIndex: number): void {
  if (variable === 'ACT') initial.nodes.forEach((node, i) => { if (i % 2 === 0) node.activation += delta; });
  else if (variable === 'MEM') initial.nodes.forEach((node, i) => { if (i % 2 === 0) node.memory += delta; });
  else initial.weights.forEach((row, i) => row.forEach((value, j) => { if (i !== j) initial.weights[i][j] = value + ((i + j + seedIndex) % 2 === 0 ? delta : -delta); }));
  const values = [...initial.nodes.flatMap(node => [node.activation, node.memory]), ...initial.weights.flat()];
  if (values.some(value => !Number.isFinite(value) || value < 0 || value > 1)) throw new Error('Perturbation outside initial-state domain: ' + variable + ' ' + delta);
}
const maxAbs = (values: number[]): number => values.length ? Math.max(...values.map(Math.abs)) : 0;
function compareState(a: NetworkState, b: NetworkState) {
  return {
    maxActivationObserved: maxAbs(a.nodes.map((node, i) => node.activation - b.nodes[i].activation)),
    maxMemory: maxAbs(a.nodes.map((node, i) => node.memory - b.nodes[i].memory)),
    maxWeight: maxAbs(a.weights.flatMap((row, i) => row.map((value, j) => value - b.weights[i][j])))
  };
}
type TickState = { tick: number; raw: number[]; state: NetworkState | null; clippedNodes: number[]; status: 'completed' | 'guard_aborted' };
function simulate(seed: number, variant: Variant, variable: Variable, delta: number, seedIndex: number) {
  const simConfig: SimulationConfig = { ...defaultConfig, seed, switches: { ...config.cal01.switches } };
  const initial = engines[variant].createNetwork(simConfig);
  if (variable !== 'BASELINE') perturb(initial, variable, delta, seedIndex);
  let state = initial;
  const ticks: TickState[] = [];
  let abortTick: number | null = null;
  let abortReason: string | null = null;
  for (const stimulus of stimuli()) {
    const tick = state.tick + 1;
    const raw = calculateRawActivations(state, stimulus, simConfig);
    const clippedNodes = raw.map((value, i) => value < 0 || value > 1 ? i : -1).filter(i => i >= 0);
    try {
      const next = engines[variant].stepNetwork(state, stimulus, simConfig);
      ticks.push({ tick, raw, state: next, clippedNodes, status: 'completed' });
      state = next;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (variant !== 'D' || !message.includes('overflow guard')) throw error;
      abortTick = tick; abortReason = message;
      ticks.push({ tick, raw, state: null, clippedNodes, status: 'guard_aborted' });
      break;
    }
  }
  const completed = ticks.filter(item => item.status === 'completed');
  const y16 = completed.length >= 16 ? completed.slice(0, 16).reduce((sum, item) => sum + item.state!.nodes.reduce((s, node) => s + node.activation, 0) / item.state!.nodes.length, 0) / 16 : null;
  const last = completed.at(-1);
  return { seed, variant, variable, delta, status: abortTick === null && completed.length === 42 ? 'COMPLETE' : 'ABORTED_GUARD', abortTick, abortReason, firstClippingTick: ticks.find(item => item.clippedNodes.length > 0)?.tick ?? null, firstClippingNodes: ticks.find(item => item.clippedNodes.length > 0)?.clippedNodes ?? [], totalRawOutOfRange: ticks.reduce((sum, item) => sum + item.clippedNodes.length, 0), y16, lastCompletedTick: last?.tick ?? 0, lastCompletedMeanActivation: last ? last.state!.nodes.reduce((sum, node) => sum + node.activation, 0) / last.state!.nodes.length : null, ticks };
}
function run() {
  if (process.env.SENSITIVITY_AUTHORIZED !== 'YES') throw new Error('Explicit SENSITIVITY_AUTHORIZED=YES required');
  if (!/^[A-Za-z0-9._-]{8,80}$/.test(RUN_ID)) throw new Error('Set a unique SENSITIVITY_RUN_ID');
  if (existsSync(path.join(OUT, RUN_ID))) throw new Error('Run directory exists; overwrite forbidden');
  verifySources();
  const configRaw = readFileSync(path.join(ROOT, 'experiments/AT-002-CALIBRATION/configuration.json'));
  const baseline = new Map<string, ReturnType<typeof simulate>>();
  const summaries: Record<string, unknown>[] = [];
  const tickComparisons: Record<string, unknown>[] = [];
  const specs: Array<{ variable: Variable; delta: number }> = [{ variable: 'BASELINE', delta: 0 }];
  for (const variable of ['ACT', 'MEM', 'WGT'] as const) for (const delta of LEVELS) specs.push({ variable, delta });
  for (const variant of ['O', 'D'] as const) {
    for (let seedIndex = 0; seedIndex < config.seeds.length; seedIndex++) {
      const seed = config.seeds[seedIndex];
      const base = simulate(seed, variant, 'BASELINE', 0, seedIndex);
      baseline.set(variant + ':' + seed, base);
      summaries.push({ seed, variant, variable: 'BASELINE', delta: 0, status: base.status, abortTick: base.abortTick, abortReason: base.abortReason, firstClippingTick: base.firstClippingTick, firstClippingNodes: base.firstClippingNodes, totalRawOutOfRange: base.totalRawOutOfRange, y16: base.y16, lastCompletedTick: base.lastCompletedTick });
      for (const spec of specs.slice(1)) {
        const result = simulate(seed, variant, spec.variable, spec.delta, seedIndex);
        const baseResult = baseline.get(variant + ':' + seed)!;
        const commonTicks = Math.min(baseResult.ticks.filter(item => item.status === 'completed').length, result.ticks.filter(item => item.status === 'completed').length);
        let maxRaw = 0, maxActivation = 0, maxMemory = 0, maxWeight = 0;
        let firstExactStateDifference: number | null = null;
        for (let index = 0; index < commonTicks; index++) {
          const a = baseResult.ticks[index], b = result.ticks[index];
          maxRaw = Math.max(maxRaw, maxAbs(a.raw.map((value, i) => value - b.raw[i])));
          const diffs = compareState(a.state!, b.state!);
          maxActivation = Math.max(maxActivation, diffs.maxActivationObserved); maxMemory = Math.max(maxMemory, diffs.maxMemory); maxWeight = Math.max(maxWeight, diffs.maxWeight);
          if (firstExactStateDifference === null && (diffs.maxActivationObserved !== 0 || diffs.maxMemory !== 0 || diffs.maxWeight !== 0)) firstExactStateDifference = index + 1;
          tickComparisons.push({ seed, variant, variable: spec.variable, delta: spec.delta, tick: index + 1, maxRawActivationDifference: maxRaw, ...diffs });
        }
        const structuralChanged = baseResult.status !== result.status || baseResult.abortTick !== result.abortTick || baseResult.firstClippingTick !== result.firstClippingTick || JSON.stringify(baseResult.firstClippingNodes) !== JSON.stringify(result.firstClippingNodes);
        const y16Difference = baseResult.y16 !== null && result.y16 !== null ? Math.abs(result.y16 - baseResult.y16) : null;
        const maxStateDifference = Math.max(maxActivation, maxMemory, maxWeight);
        summaries.push({ seed, variant, variable: spec.variable, delta: spec.delta, status: result.status, abortTick: result.abortTick, abortReason: result.abortReason, firstClippingTick: result.firstClippingTick, firstClippingNodes: result.firstClippingNodes, totalRawOutOfRange: result.totalRawOutOfRange, y16: result.y16, y16AbsoluteDifference: y16Difference, y16ChangeOver001: y16Difference !== null && y16Difference > 0.01, structuralChanged, commonCompletedTicks: commonTicks, maxRawActivationDifference: maxRaw, maxObservedActivationDifference: maxActivation, maxMemoryDifference: maxMemory, maxWeightDifference: maxWeight, firstExactStateDifference, exceedsCandidate1e6: maxStateDifference > 1e-6, exceedsCandidate1e8: maxStateDifference > 1e-8, exceedsCandidate1e10: maxStateDifference > 1e-10 });
      }
    }
  }
  const expected = config.seeds.length * 2 * specs.length;
  if (summaries.length !== expected) throw new Error('Trajectory count mismatch: ' + summaries.length + '/' + expected);
  const sourceCommit = process.env.GITHUB_SHA ?? execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  const manifest = { experimentId: 'BEHAVIORAL-SENSITIVITY-001', protocolVersion: '0.1.0', runId: RUN_ID, status: 'EXECUTED', sourceCommit, configSha256: sha256(configRaw), seedSet: config.seeds, variants: ['O', 'D'], variables: ['ACT', 'MEM', 'WGT'], levels: LEVELS, trajectoryCount: summaries.length, expectedTrajectoryCount: expected, pulseTicks: config.protocol.pulseSteps, recoveryTicks: config.protocol.recoverySteps, yWindowTicks: [1, 16], runtime: { node: process.version, platform: process.platform, arch: process.arch }, createdAt: new Date().toISOString() };
  const directory = path.join(OUT, RUN_ID);
  mkdirSync(directory, { recursive: true });
  const files: Record<string, string> = { 'manifest.json': JSON.stringify(manifest, null, 2) + '\\n', 'summaries.json': JSON.stringify(summaries, null, 2) + '\\n', 'tick-comparisons.jsonl': tickComparisons.map(row => JSON.stringify(row)).join('\\n') + '\\n' };
  for (const [name, content] of Object.entries(files)) writeFileSync(path.join(directory, name), content, { flag: 'wx' });
  writeFileSync(path.join(directory, 'checksums.sha256'), Object.entries(files).map(([name, content]) => sha256(content) + '  ' + name).join('\\n') + '\\n', { flag: 'wx' });
  process.stdout.write(JSON.stringify({ manifest, summaryCount: summaries.length, structuralChanges: summaries.filter(row => row.structuralChanged === true).length, y16ChangesOver001: summaries.filter(row => row.y16ChangeOver001 === true).length, artifactDirectory: 'artifacts/BEHAVIORAL-SENSITIVITY/' + RUN_ID }, null, 2) + '\\n');
}
run();