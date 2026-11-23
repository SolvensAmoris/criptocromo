import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import packageJson from '../../../package.json';
import type { SimulationConfig } from '../../core/types';
import { defaultConfig } from './config';
import { runAt001 } from './model';

export type Mechanisms = { A: boolean; B: boolean; C: boolean };
export type MetricKey =
  | 'targetPeakActivation'
  | 'targetResidualActivation'
  | 'persistenceRatio'
  | 'selectivityDifference'
  | 'recoveryVolatility'
  | 'activeNodeFraction';

export interface FactorialCondition extends Mechanisms {
  label: string;
}

export interface FactorialMetrics {
  targetPeakActivation: number;
  targetResidualActivation: number;
  persistenceRatio: number;
  selectivityDifference: number;
  recoveryVolatility: number;
  activeNodeFraction: number;
}

export interface RunRecord {
  experimentId: 'AT-001';
  runId: string;
  condition: FactorialCondition;
  seed: number;
  engineVersion: string;
  timestamp: string;
  config: SimulationConfig;
  protocol: {
    targetFrequency: number;
    offTargetFrequency: number;
    pulseSteps: number;
    recoverySteps: number;
  };
  metrics: FactorialMetrics;
}

export interface EffectEstimate {
  estimate: number;
  sampleSd: number;
  n: number;
}

export interface MetricAnalysis {
  cellMeans: Record<string, number>;
  mainEffects: Record<'A' | 'B' | 'C', EffectEstimate>;
  interactions: Record<'AB' | 'AC' | 'BC' | 'ABC', EffectEstimate>;
  additiveCheckAt111: {
    baseline000: number;
    expectedAdditive111: number;
    observed111: number;
    synergy: number;
    interpretation: 'possible-positive-interaction' | 'possible-negative-interaction' | 'within-threshold';
    threshold: number;
  };
}

export const CONDITIONS: FactorialCondition[] = [
  { label: '000', A: false, B: false, C: false },
  { label: '001', A: false, B: false, C: true },
  { label: '010', A: false, B: true, C: false },
  { label: '011', A: false, B: true, C: true },
  { label: '100', A: true, B: false, C: false },
  { label: '101', A: true, B: false, C: true },
  { label: '110', A: true, B: true, C: false },
  { label: '111', A: true, B: true, C: true }
];

export const SEEDS = [101, 202, 303, 404, 505, 606, 707, 808, 909, 1010] as const;
export const FACTORIAL_PROTOCOL = {
  targetFrequency: 0.5,
  offTargetFrequency: 0.9,
  pulseSteps: 18,
  recoverySteps: 24
} as const;
export const SYNERGY_THRESHOLD = 0.05;
const METRIC_KEYS: MetricKey[] = [
  'targetPeakActivation',
  'targetResidualActivation',
  'persistenceRatio',
  'selectivityDifference',
  'recoveryVolatility',
  'activeNodeFraction'
];

function average(values: number[]): number {
  if (values.length === 0) throw new Error('Cannot average an empty sample');
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleSd(values: number[]): number {
  if (values.length < 2) return 0;
  const center = average(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - center) ** 2, 0) / (values.length - 1));
}

function measureRun(config: SimulationConfig, frequency: number) {
  return runAt001(config, frequency, FACTORIAL_PROTOCOL.pulseSteps, FACTORIAL_PROTOCOL.recoverySteps);
}

function volatility(values: number[]): number {
  const tail = values.slice(-8);
  if (tail.length < 2) return 0;
  return average(tail.slice(1).map((value, index) => Math.abs(value - tail[index])));
}

export function runFactorial(
  seeds: readonly number[] = SEEDS,
  baseConfig: SimulationConfig = defaultConfig
): RunRecord[] {
  if (seeds.length === 0 || seeds.some(seed => !Number.isInteger(seed))) {
    throw new Error('At least one integer seed is required');
  }

  const timestamp = new Date().toISOString();
  const records: RunRecord[] = [];
  const engineVersion = packageJson.version;

  for (const seed of seeds) {
    for (const condition of CONDITIONS) {
      // A=persistence/memory, B=frequency selectivity/resonance,
      // C=local adaptation/plasticity.
      const config: SimulationConfig = {
        ...baseConfig,
        seed,
        switches: {
          memory: condition.A,
          resonance: condition.B,
          plasticity: condition.C
        }
      };
      const target = measureRun(config, FACTORIAL_PROTOCOL.targetFrequency);
      const offTarget = measureRun(config, FACTORIAL_PROTOCOL.offTargetFrequency);
      const peak = Math.max(...target.history.slice(0, FACTORIAL_PROTOCOL.pulseSteps));
      const residual = target.finalMeanActivation;
      const offTargetPeak = Math.max(...offTarget.history.slice(0, FACTORIAL_PROTOCOL.pulseSteps));

      const metrics: FactorialMetrics = {
        targetPeakActivation: peak,
        targetResidualActivation: residual,
        persistenceRatio: peak > 0 ? residual / peak : 0,
        selectivityDifference: peak - offTargetPeak,
        recoveryVolatility: volatility(target.history.slice(FACTORIAL_PROTOCOL.pulseSteps)),
        activeNodeFraction: target.finalState.nodes.filter(node => node.activation > 0.05).length /
          Math.max(target.finalState.nodes.length, 1)
      };

      if (Object.values(metrics).some(value => !Number.isFinite(value))) {
        throw new Error(`Non-finite metric in condition ${condition.label}, seed ${seed}`);
      }

      records.push({
        experimentId: 'AT-001',
        runId: `AT-001-${condition.label}-${seed}-${timestamp}`,
        condition,
        seed,
        engineVersion,
        timestamp,
        config,
        protocol: { ...FACTORIAL_PROTOCOL },
        metrics
      });
    }
  }

  return records;
}

function validateCompleteDesign(records: RunRecord[]): number[] {
  const seeds = [...new Set(records.map(record => record.seed))].sort((a, b) => a - b);
  if (records.length !== seeds.length * CONDITIONS.length) {
    throw new Error('Incomplete factorial matrix: expected exactly 8 conditions per seed');
  }
  for (const seed of seeds) {
    const labels = records.filter(record => record.seed === seed).map(record => record.condition.label);
    if (new Set(labels).size !== 8 || CONDITIONS.some(condition => !labels.includes(condition.label))) {
      throw new Error(`Incomplete or duplicated conditions for seed ${seed}`);
    }
  }
  return seeds;
}

function estimate(values: number[]): EffectEstimate {
  return { estimate: average(values), sampleSd: sampleSd(values), n: values.length };
}

export function analyzeFactorial(records: RunRecord[]): Record<MetricKey, MetricAnalysis> {
  const seeds = validateCompleteDesign(records);
  const result = {} as Record<MetricKey, MetricAnalysis>;

  for (const metric of METRIC_KEYS) {
    const valuesBySeed = new Map<number, Map<string, number>>();
    for (const seed of seeds) {
      valuesBySeed.set(seed, new Map(
        records.filter(record => record.seed === seed)
          .map(record => [record.condition.label, record.metrics[metric]])
      ));
    }

    const cellMeans = Object.fromEntries(CONDITIONS.map(condition => [
      condition.label,
      average(seeds.map(seed => valuesBySeed.get(seed)!.get(condition.label)!))
    ])) as Record<string, number>;

    const pairedContrast = (terms: Array<[string, number]>) =>
      estimate(seeds.map(seed => 2 * terms.reduce(
        (sum, [label, sign]) => sum + sign * valuesBySeed.get(seed)!.get(label)!, 0
      ) / 8));

    const mainEffects = {
      A: pairedContrast([['000', -1], ['001', -1], ['010', -1], ['011', -1], ['100', 1], ['101', 1], ['110', 1], ['111', 1]]),
      B: pairedContrast([['000', -1], ['001', -1], ['010', 1], ['011', 1], ['100', -1], ['101', -1], ['110', 1], ['111', 1]]),
      C: pairedContrast([['000', -1], ['001', 1], ['010', -1], ['011', 1], ['100', -1], ['101', 1], ['110', -1], ['111', 1]])
    };
    const interactions = {
      AB: pairedContrast([['000', 1], ['001', 1], ['010', -1], ['011', -1], ['100', -1], ['101', -1], ['110', 1], ['111', 1]]),
      AC: pairedContrast([['000', 1], ['001', -1], ['010', 1], ['011', -1], ['100', -1], ['101', 1], ['110', -1], ['111', 1]]),
      BC: pairedContrast([['000', 1], ['001', -1], ['010', -1], ['011', 1], ['100', 1], ['101', -1], ['110', -1], ['111', 1]]),
      ABC: pairedContrast([['000', -1], ['001', 1], ['010', 1], ['011', -1], ['100', 1], ['101', -1], ['110', -1], ['111', 1]])
    };

    const baseline000 = cellMeans['000'];
    const expectedAdditive111 = baseline000 +
      (cellMeans['100'] - baseline000) +
      (cellMeans['010'] - baseline000) +
      (cellMeans['001'] - baseline000);
    const observed111 = cellMeans['111'];
    const synergy = observed111 - expectedAdditive111;

    result[metric] = {
      cellMeans,
      mainEffects,
      interactions,
      additiveCheckAt111: {
        baseline000,
        expectedAdditive111,
        observed111,
        synergy,
        interpretation: synergy > SYNERGY_THRESHOLD
          ? 'possible-positive-interaction'
          : synergy < -SYNERGY_THRESHOLD
            ? 'possible-negative-interaction'
            : 'within-threshold',
        threshold: SYNERGY_THRESHOLD
      }
    };
  }
  return result;
}

function csvCell(value: string | number | boolean): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function exportResults(
  records: RunRecord[],
  analysis: Record<MetricKey, MetricAnalysis>,
  resultsDirectory = path.resolve('experiments/AT-001/results')
) {
  mkdirSync(resultsDirectory, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const stem = `factorial-${stamp}`;
  const jsonlPath = path.join(resultsDirectory, `${stem}.jsonl`);
  const csvPath = path.join(resultsDirectory, `${stem}.csv`);
  const analysisPath = path.join(resultsDirectory, `${stem}-analysis.json`);

  const jsonl = records.map(record => JSON.stringify(record)).join('\n') + '\n';
  const headers = [
    'runId', 'seed', 'condition', 'A', 'B', 'C', 'engineVersion',
    ...METRIC_KEYS, 'timestamp'
  ];
  const csvRows = records.map(record => [
    record.runId, record.seed, record.condition.label,
    Number(record.condition.A), Number(record.condition.B), Number(record.condition.C),
    record.engineVersion, ...METRIC_KEYS.map(key => record.metrics[key]), record.timestamp
  ].map(csvCell).join(','));
  const csv = [headers.join(','), ...csvRows].join('\n') + '\n';
  const analysisJson = JSON.stringify(analysis, null, 2) + '\n';

  // Exclusive creation prevents accidental overwrite, even on timestamp collisions.
  for (const [filePath, content] of [
    [jsonlPath, jsonl], [csvPath, csv], [analysisPath, analysisJson]
  ] as const) {
    writeFileSync(filePath, content, { flag: 'wx' });
  }
  return { jsonlPath, csvPath, analysisPath };
}

async function main() {
  const records = runFactorial();
  const analysis = analyzeFactorial(records);
  const paths = exportResults(records, analysis);
  console.log(`AT-001: ${records.length} ejecuciones reales completadas.`);
  console.log(`Motor: ${records[0]?.engineVersion ?? packageJson.version}`);
  console.log('Exportaciones:', paths);
  for (const [metric, report] of Object.entries(analysis)) {
    console.log(metric, {
      synergyAt111: report.additiveCheckAt111.synergy,
      interpretation: report.additiveCheckAt111.interpretation,
      mainEffects: Object.fromEntries(Object.entries(report.mainEffects).map(([key, value]) => [key, value.estimate]))
    });
  }
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === pathToFileURL(currentFile).href) {
  main();
}
