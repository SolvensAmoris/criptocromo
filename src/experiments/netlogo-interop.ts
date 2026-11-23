import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultConfig } from '../at001/config';
import * as O from '../at002-calibration/engines/engine-v0.1.0-O';
import * as D from '../at002-calibration/engines/engine-v0.2.0-D';
import { calculateRawActivations } from '../at002-calibration/diagnostics';
import type { NetworkState, SimulationConfig, Stimulus } from '../../core/types';
import configJson from '../../experiments/AT-002-CALIBRATION/configuration.json';

type Variant = 'O' | 'D';
type Engine = { createNetwork(config: SimulationConfig): NetworkState; stepNetwork(state: NetworkState, stimulus: Stimulus, config: SimulationConfig): NetworkState };
const engines: Record<Variant, Engine> = { O, D };
const config = configJson as {
  engineVariants: Record<Variant, { module: string; sourceBlobSha1: string; dependencyBlobSha1: Record<string, string> }>;
  seeds: number[];
  protocol: { targetFrequency: number; pulseSteps: number; recoverySteps: number };
  cal01: { intensity: number; switches: { memory: boolean; resonance: boolean; plasticity: boolean } };
};
const tolerance = 1e-10;
const outDir = fileURLToPath(new URL('../../experiments/netlogo/interop-data/', import.meta.url));
const sha256 = (value: string | Buffer): string => createHash('sha256').update(value).digest('hex');
const gitBlobSha1 = (value: Buffer): string => createHash('sha1').update(`blob ${value.length}\0`).update(value).digest('hex');
function verifyReferenceIdentity(): void {
  for (const variant of ['O', 'D'] as const) {
    const identity = config.engineVariants[variant];
    const moduleBytes = readFileSync(path.resolve(process.cwd(), identity.module));
    if (gitBlobSha1(moduleBytes) !== identity.sourceBlobSha1) throw new Error(`Pinned source identity mismatch for ${variant}`);
    for (const [relativePath, expected] of Object.entries(identity.dependencyBlobSha1)) {
      const bytes = readFileSync(path.resolve(process.cwd(), relativePath));
      if (gitBlobSha1(bytes) !== expected) throw new Error(`Pinned dependency identity mismatch for ${variant}: ${relativePath}`);
    }
  }
}
const numberText = (value: number): string => Number.isInteger(value) ? String(value) : value.toFixed(17);
const nlList = (value: unknown): string => {
  if (typeof value === 'number') return numberText(value);
  if (Array.isArray(value)) return `[${value.map(nlList).join(' ')}]`;
  throw new Error(`Unsupported NetLogo input value: ${String(value)}`);
};
const csv = (...fields: Array<string | number>): string => fields.map(String).join(',');
const stimuli = (): Stimulus[] => Array.from(
  { length: config.protocol.pulseSteps + config.protocol.recoverySteps },
  (_, index) => ({
    frequency: config.protocol.targetFrequency,
    intensity: index < config.protocol.pulseSteps ? config.cal01.intensity : 0
  })
);

function appendStateRows(lines: string[], seed: number, variant: Variant): void {
  let state: NetworkState;
  const simConfig: SimulationConfig = {
    ...defaultConfig,
    seed,
    switches: { ...config.cal01.switches }
  };
  state = engines[variant].createNetwork(simConfig);
  for (const stimulus of stimuli()) {
    const tick = state.tick + 1;
    const raw = calculateRawActivations(state, stimulus, simConfig);
    let next: NetworkState;
    try {
      next = engines[variant].stepNetwork(state, stimulus, simConfig);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (variant !== 'D' || !message.includes('overflow guard')) throw error;
      for (let node = 0; node < raw.length; node += 1) {
        lines.push(csv('N', seed, variant, tick, node, '', raw[node], '', '', 'guard_aborted'));
      }
      break;
    }
    for (let node = 0; node < raw.length; node += 1) {
      lines.push(csv('N', seed, variant, tick, node, '', raw[node], next.nodes[node].activation, next.nodes[node].memory, 'completed'));
    }
    for (let i = 0; i < next.weights.length; i += 1) {
      for (let j = 0; j < next.weights[i].length; j += 1) {
        lines.push(csv('W', seed, variant, tick, i, j, next.weights[i][j], '', '', 'completed'));
      }
    }
    state = next;
  }
}

function exportInputs(): void {
  verifyReferenceIdentity();
  mkdirSync(outDir, { recursive: true });
  const initialLines: string[] = [];
  const expectedLines = ['kind,seed,variant,tick,node_or_i,j_or_empty,raw_or_weight,observed_or_empty,memory_or_empty,status'];
  for (const seed of config.seeds) {
    const state = O.createNetwork({ ...defaultConfig, seed, switches: { ...config.cal01.switches } });
    initialLines.push(nlList([
      seed,
      state.nodes.map(node => node.preferredFrequency),
      state.nodes.map(node => node.activation),
      state.nodes.map(node => node.memory),
      state.weights
    ]));
    appendStateRows(expectedLines, seed, 'O');
    appendStateRows(expectedLines, seed, 'D');
  }
  const initialText = initialLines.join('\n') + '\n';
  const expectedText = expectedLines.join('\n') + '\n';
  writeFileSync(path.join(outDir, 'initial_states.nls'), initialText, { flag: 'w' });
  writeFileSync(path.join(outDir, 'typescript_expected.csv'), expectedText, { flag: 'w' });
  const configRaw = readFileSync(fileURLToPath(new URL('../../experiments/AT-002-CALIBRATION/configuration.json', import.meta.url)), 'utf8');
  const protocolRaw = readFileSync(fileURLToPath(new URL('../../docs/NETLOGO-CROSS-PLATFORM-EQUIVALENCE-v0.1.md', import.meta.url)), 'utf8');
  const modelRaw = readFileSync(fileURLToPath(new URL('../../experiments/netlogo/CriptocromoEquivalence.nlogo', import.meta.url)), 'utf8');
  const experimentRaw = readFileSync(fileURLToPath(new URL('../../experiments/netlogo/behaviorspace.xml', import.meta.url)), 'utf8');
  const manifest = {
    experimentId: 'AT-003-NETLOGO-CAL01-EQUIVALENCE',
    runId: `NETLOGO-CAL01-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`,
    status: 'INPUTS_EXPORTED_PENDING_NETLOGO_AND_COMPARISON',
    sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    seeds: config.seeds,
    nodeCount: 24,
    variants: ['O', 'D'],
    pulseSteps: config.protocol.pulseSteps,
    recoverySteps: config.protocol.recoverySteps,
    targetFrequency: config.protocol.targetFrequency,
    intensity: config.cal01.intensity,
    switches: config.cal01.switches,
    tolerance,
    netlogoVersion: '7.0.4',
    hashes: {
      configSha256: sha256(configRaw),
      protocolSha256: sha256(protocolRaw),
      netlogoModelSha256: sha256(modelRaw),
      behaviorSpaceSha256: sha256(experimentRaw),
      initialStatesSha256: sha256(initialText),
      typescriptExpectedSha256: sha256(expectedText)
    },
    note: 'Expected traces are generated from the pinned Criptocromo O/D engines using the explicit canonical initial states. NetLogo must consume initial_states.nls without using its RNG.'
  };
  writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'w' });
  const checksumNames = ['initial_states.nls', 'typescript_expected.csv', 'manifest.json'];
  writeFileSync(path.join(outDir, 'checksums.sha256'), checksumNames
    .map(name => `${sha256(readFileSync(path.join(outDir, name)))}  ${name}`).join('\n') + '\n', { flag: 'w' });
  process.stdout.write(JSON.stringify({ mode: 'EXPORT', seedCount: config.seeds.length, initialStateCount: initialLines.length, expectedRecordCount: expectedLines.length - 1, outputDirectory: outDir, hashes: manifest.hashes }, null, 2) + '\n');
}

type Row = { key: string; values: string[]; line: number };
function readRows(file: string): Map<string, Row> {
  const lines = readFileSync(file, 'utf8').trimEnd().split('\n');
  const result = new Map<string, Row>();
  for (let index = 1; index < lines.length; index += 1) {
    const fields = lines[index].split(',');
    const kind = fields[0];
    const key = kind === 'N'
      ? fields.slice(0, 5).join('|')
      : fields.slice(0, 6).join('|');
    if (result.has(key)) throw new Error(`Duplicate trace key in ${file}: ${key}`);
    result.set(key, { key, values: fields.slice(kind === 'N' ? 6 : 6), line: index + 1 });
  }
  return result;
}

function compare(): void {
  const expected = readRows(path.join(outDir, 'typescript_expected.csv'));
  const actual = readRows(path.join(outDir, 'netlogo_trace.csv'));
  const missing: string[] = [];
  const extra: string[] = [];
  const mismatches: Array<{ key: string; field: string; expected: string; actual: string; absError?: number }> = [];
  let maxAbsError = 0;
  const labels = ['raw_or_weight', 'observed_or_empty', 'memory_or_empty', 'status'];
  for (const [key, exp] of expected) {
    const got = actual.get(key);
    if (!got) { missing.push(key); continue; }
    const kind = key.startsWith('N|') ? 'N' : 'W';
    const names = kind === 'N' ? labels : ['weight', '', '', 'status'];
    for (let index = 0; index < Math.max(exp.values.length, got.values.length); index += 1) {
      const ev = exp.values[index] ?? '';
      const av = got.values[index] ?? '';
      const label = names[index] || `field_${index}`;
      if (ev === '' || av === '') {
        if (ev !== av) mismatches.push({ key, field: label, expected: ev, actual: av });
      } else if (label === 'status') {
        if (ev !== av) mismatches.push({ key, field: label, expected: ev, actual: av });
      } else {
        const en = Number(ev);
        const an = Number(av);
        const error = Math.abs(en - an);
        maxAbsError = Math.max(maxAbsError, error);
        if (!Number.isFinite(en) || !Number.isFinite(an) || error > tolerance) {
          mismatches.push({ key, field: label, expected: ev, actual: av, absError: error });
        }
      }
    }
  }
  for (const key of actual.keys()) if (!expected.has(key)) extra.push(key);
  const result = {
    experimentId: 'AT-003-NETLOGO-CAL01-EQUIVALENCE',
    status: missing.length || extra.length || mismatches.length ? 'NOT_EQUIVALENT' : 'EQUIVALENCE_OBSERVED_WITHIN_TOLERANCE',
    tolerance,
    expectedRecordCount: expected.size,
    actualRecordCount: actual.size,
    matchedKeyCount: expected.size - missing.length,
    missingCount: missing.length,
    extraCount: extra.length,
    mismatchCount: mismatches.length,
    maxAbsoluteError: maxAbsError,
    firstMismatch: mismatches[0] ?? null,
    missingKeysSample: missing.slice(0, 20),
    extraKeysSample: extra.slice(0, 20),
    mismatchSample: mismatches.slice(0, 20)
  };
  const out = path.join(outDir, 'comparison.json');
  writeFileSync(out, JSON.stringify(result, null, 2) + '\n', { flag: 'w' });
  const checksum = `${sha256(readFileSync(out))}  comparison.json\n`;
  writeFileSync(path.join(outDir, 'comparison.sha256'), checksum, { flag: 'w' });
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (result.status !== 'EQUIVALENCE_OBSERVED_WITHIN_TOLERANCE') process.exitCode = 1;
}

const mode = process.argv[2];
if (mode === 'export') exportInputs();
else if (mode === 'compare') compare();
else throw new Error('Usage: tsx netlogo-interop.ts <export|compare>');
