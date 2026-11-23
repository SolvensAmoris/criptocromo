import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../src/experiments/at001/config';
import * as O from '../src/experiments/at002-calibration/engines/engine-v0.1.0-O';
import * as D from '../src/experiments/at002-calibration/engines/engine-v0.2.0-D';
import * as S from '../src/experiments/at002-calibration/engines/engine-v0.2.0-S';
import { runCal01 } from '../src/experiments/at002-calibration/cal01';
import { calculateRawActivations, runCalibrationTrace, transformActivation } from '../src/experiments/at002-calibration/diagnostics';
import { assertArtifactIdentity, artifactPartition, buildCalibrationPlan, type At002Configuration } from '../src/experiments/at002-calibration/runner';
import configJson from '../experiments/AT-002-CALIBRATION/configuration.json';

const config = configJson as At002Configuration;
const stimulus = { frequency: 0.5, intensity: 0.1 };

describe('AT-002 versioned engines', () => {
  it('keeps O as adapter to historical engine and declares versions', () => {
    expect(O.createNetwork({ ...defaultConfig, seed: 101 })).toEqual(D.createNetwork({ ...defaultConfig, seed: 101 }));
    expect(O.ENGINE_VERSION).toBe('0.1.0');
    expect(D.ENGINE_VERSION).toBe('0.2.0-D');
    expect(S.ENGINE_VERSION).toBe('0.2.0-S');
  });
  it('makes O and D identical while activation stays below clipping boundary', () => {
    const cfg = { ...defaultConfig, seed: 101, switches: { memory: false, resonance: false, plasticity: false } };
    expect(D.stepNetwork(D.createNetwork(cfg), stimulus, cfg)).toEqual(O.stepNetwork(O.createNetwork(cfg), stimulus, cfg));
  });
  it('allows D to retain activation above one where O clips', () => {
    const cfg = { ...defaultConfig, seed: 101, alpha: 1, beta: 4, gamma: 0, eta: 0, switches: { memory: false, resonance: false, plasticity: false } };
    const input = { frequency: 0.5, intensity: 1 };
    const o = O.stepNetwork(O.createNetwork(cfg), input, cfg);
    const d = D.stepNetwork(D.createNetwork(cfg), input, cfg);
    expect(o.nodes.every(node => node.activation <= 1)).toBe(true);
    expect(d.nodes.some(node => node.activation > 1)).toBe(true);
  });
  it('treats S as distinct nonlinear model, not clipping-loss estimator', () => {
    const cfg = { ...defaultConfig, seed: 101, switches: { memory: false, resonance: false, plasticity: false } };
    expect(S.stepNetwork(S.createNetwork(cfg), stimulus, cfg)).not.toEqual(O.stepNetwork(O.createNetwork(cfg), stimulus, cfg));
    expect(S.smoothSigmoid(0)).toBe(0.5);
  });
  it('fails fast when D exceeds overflow guard', () => {
    const cfg = { ...defaultConfig, seed: 101, alpha: 1, beta: 3000000, gamma: 0, eta: 0, switches: { memory: false, resonance: false, plasticity: false } };
    expect(() => D.stepNetwork(D.createNetwork(cfg), { frequency: 0.5, intensity: 1 }, cfg)).toThrow(/overflow guard/);
  });
});

describe('AT-002 plan-only runner', () => {
  it('expands only seeds, stages, conditions and gain levels declared in config', () => {
    const plan = buildCalibrationPlan(config);
    expect(plan.length).toBe(config.seeds.length * (config.cal01.variants.length + config.cal02.levels.length + config.cal03.conditions.length * config.cal03.profiles.length + config.cal04.conditions.length));
    expect([...new Set(plan.filter(x => x.stage === 'CAL-02').map(x => x.intensity))].sort()).toEqual([...config.cal02.levels].sort());
    expect(plan.every(job => config.seeds.includes(job.seed))).toBe(true);
    expect(plan.every(job => Object.keys(job.engineDependencyBlobSha1).length > 0)).toBe(true);
  });
  it('rejects duplicate seeds and weakened artifact isolation', () => {
    expect(() => buildCalibrationPlan({ ...config, seeds: [1, 1] })).toThrow(/unique/);
    expect(() => buildCalibrationPlan({ ...config, artifactPolicy: { ...config.artifactPolicy, oneEngineVariantPerArtifactSet: false } })).toThrow(/mandatory/);
  });
  it('rejects drift from preregistered engine variants and invalid intensity', () => {
    expect(() => buildCalibrationPlan({ ...config, cal01: { ...config.cal01, variants: ['O', 'S'] } })).toThrow(/O and D/);
    expect(() => buildCalibrationPlan({ ...config, cal03: { ...config.cal03, engineVariant: 'S' } })).toThrow(/CAL-03 and CAL-04/);
    expect(() => buildCalibrationPlan({ ...config, cal04: { ...config.cal04, intensity: 1.1 } })).toThrow(/intensities/);
    expect(() => buildCalibrationPlan({ ...config, cal01: { ...config.cal01, instrumentation: { 'bad.ts': 'bad' } } })).toThrow(/instrumentation source hashes/);
  });
  it('partitions outputs by engine, stage and run ID', () => {
    const job = buildCalibrationPlan(config)[0];
    expect(artifactPartition(job, 'run-001', config.artifactPolicy.root)).toBe(`${config.artifactPolicy.root}/${job.engineVariant}/${job.stage}/run-001`);
    expect(() => artifactPartition(job, '../escape', config.artifactPolicy.root)).toThrow();
  });
  it('rejects artifacts with mixed engine identity or dependencies', () => {
    const job = buildCalibrationPlan(config).find(x => x.stage === 'CAL-01' && x.engineVariant === 'O')!;
    expect(() => assertArtifactIdentity(job, {
      engineVariant: 'D', stage: 'CAL-01', engineVersion: job.engineVersion,
      engineSourceBlobSha1: job.engineSourceBlobSha1,
      engineDependencyBlobSha1: job.engineDependencyBlobSha1
    })).toThrow(/mixed engine/);
    expect(() => assertArtifactIdentity(job, {
      engineVariant: 'O', stage: 'CAL-01', engineVersion: job.engineVersion,
      engineSourceBlobSha1: job.engineSourceBlobSha1,
      engineDependencyBlobSha1: { ...job.engineDependencyBlobSha1, 'src/core/engine.ts': '0000000000000000000000000000000000000000' }
    })).toThrow(/mixed engine/);
  });
});

describe('AT-002 trace diagnostics', () => {
  it('captures raw activation values before any activation transform', () => {
    const cfg = { ...defaultConfig, seed: 101, alpha: 0, beta: 4, gamma: 0, eta: 0, switches: { memory: false, resonance: false, plasticity: false } };
    const state = O.createNetwork(cfg);
    const raw = calculateRawActivations(state, { frequency: 0.5, intensity: 1 }, cfg);
    const nextO = O.stepNetwork(state, { frequency: 0.5, intensity: 1 }, cfg);
    const nextD = D.stepNetwork(D.createNetwork(cfg), { frequency: 0.5, intensity: 1 }, cfg);
    expect(raw.some(value => value > 1)).toBe(true);
    expect(nextO.nodes.every(node => node.activation <= 1)).toBe(true);
    expect(nextD.nodes.map(node => node.activation)).toEqual(raw);
  });
  it('keeps standalone transforms distinct and rejects non-finite values', () => {
    expect(transformActivation(1.5, 'original-clip')).toBe(1);
    expect(transformActivation(1.5, 'diagnostic-identity')).toBe(1.5);
    expect(transformActivation(1.5, 'smooth-sigmoid')).toBeCloseTo(0.817574, 5);
    expect(() => transformActivation(Number.NaN, 'diagnostic-identity')).toThrow();
  });
  it('records memory evolution without plasticity', () => {
    const cfg = { ...defaultConfig, seed: 101, switches: { memory: true, resonance: false, plasticity: false } };
    const trace = runCalibrationTrace(cfg, Array.from({ length: 8 }, () => ({ frequency: 0.5, intensity: 0.5 })));
    expect(trace.some(point => point.meanMemory > 0)).toBe(true);
    expect(trace.every(point => point.totalAbsoluteWeightDelta === 0)).toBe(true);
  });
  it('records plasticity without memory', () => {
    const cfg = { ...defaultConfig, seed: 101, switches: { memory: false, resonance: false, plasticity: true } };
    const trace = runCalibrationTrace(cfg, Array.from({ length: 8 }, () => ({ frequency: 0.5, intensity: 0.5 })));
    expect(trace.every(point => point.meanMemory === 0)).toBe(true);
    expect(trace.some(point => point.totalAbsoluteWeightDelta > 0)).toBe(true);
  });
});

describe('AT-002 CAL-01 execution and evidence writer', () => {
  it('runs paired O/D seeds, writes separated traces, and refuses overwrite', () => {
    const temp = mkdtempSync(path.join(os.tmpdir(), 'at002-cal01-'));
    try {
      const configRaw = readFileSync(path.join(process.cwd(), 'experiments/AT-002-CALIBRATION/configuration.json'), 'utf8');
      const result = runCal01(config, 'test-cal01-run-001', process.cwd(), temp, configRaw);
      expect(result.statusByVariant).toEqual({ O: 'COMPLETE', D: 'ABORTED_GUARD' });
      expect(result.completedStepCountByVariant.O).toBe(config.seeds.length * (config.protocol.pulseSteps + config.protocol.recoverySteps));
      expect(result.guardAbortCountByVariant.D).toBeGreaterThan(0);
      const oTrace = readFileSync(path.join(result.outputs.O, 'traces.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line));
      const dTrace = readFileSync(path.join(result.outputs.D, 'traces.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line));
      expect(oTrace).toHaveLength(result.recordCountByVariant.O);
      expect(dTrace).toHaveLength(result.recordCountByVariant.D);
      expect(dTrace.some(record => record.stepStatus === 'guard_aborted' && record.observedActivations === null)).toBe(true);
      expect(dTrace.some(record => record.rawActivations.some(value => Math.abs(value) > 1000000))).toBe(true);
      expect(oTrace.every(record => record.engineVariant === 'O')).toBe(true);
      expect(dTrace.every(record => record.engineVariant === 'D')).toBe(true);
      expect(readFileSync(path.join(result.outputs.O, 'manifest.json'), 'utf8')).toContain('engineDependencyBlobSha1');
      expect(() => runCal01(config, 'test-cal01-run-001', process.cwd(), temp, configRaw)).toThrow(/overwrite is forbidden/);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });
});
