import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../src/experiments/at001/config';
import * as O from '../src/experiments/at002-calibration/engines/engine-v0.1.0-O';
import * as D from '../src/experiments/at002-calibration/engines/engine-v0.2.0-D';
import * as S from '../src/experiments/at002-calibration/engines/engine-v0.2.0-S';
import { assertArtifactIdentity, artifactPartition, buildCalibrationPlan, type At002Configuration } from '../src/experiments/at002-calibration/runner';
import { runCalibrationTrace, transformActivation } from '../src/experiments/at002-calibration/diagnostics';
import configJson from '../experiments/AT-002-CALIBRATION/configuration.json';
const config = configJson as At002Configuration;
const stimulus = { frequency: 0.5, intensity: 0.1 };

describe('AT-002 versioned engines', () => {
 it('keeps O as adapter to historical engine and declares versions', () => {
  expect(O.createNetwork({...defaultConfig,seed:101})).toEqual(D.createNetwork({...defaultConfig,seed:101}));
  expect(O.ENGINE_VERSION).toBe('0.1.0');expect(D.ENGINE_VERSION).toBe('0.2.0-D');expect(S.ENGINE_VERSION).toBe('0.2.0-S');
 });
 it('makes O and D identical while activation stays below clipping boundary', () => {
  const cfg={...defaultConfig,seed:101,switches:{memory:false,resonance:false,plasticity:false}};
  expect(D.stepNetwork(D.createNetwork(cfg),stimulus,cfg)).toEqual(O.stepNetwork(O.createNetwork(cfg),stimulus,cfg));
 });
 it('allows D to retain activation above one where O clips', () => {
  const cfg={...defaultConfig,seed:101,alpha:1,beta:4,gamma:0,eta:0,switches:{memory:false,resonance:false,plasticity:false}};
  const input={frequency:0.5,intensity:1};
  const o=O.stepNetwork(O.createNetwork(cfg),input,cfg),d=D.stepNetwork(D.createNetwork(cfg),input,cfg);
  expect(o.nodes.every(node=>node.activation<=1)).toBe(true);expect(d.nodes.some(node=>node.activation>1)).toBe(true);
 });
 it('treats S as distinct nonlinear model, not clipping-loss estimator', () => {
  const cfg={...defaultConfig,seed:101,switches:{memory:false,resonance:false,plasticity:false}};
  expect(S.stepNetwork(S.createNetwork(cfg),stimulus,cfg)).not.toEqual(O.stepNetwork(O.createNetwork(cfg),stimulus,cfg));
  expect(S.smoothSigmoid(0)).toBe(0.5);
 });
 it('fails fast when D exceeds overflow guard', () => {
  const cfg={...defaultConfig,seed:101,alpha:1,beta:3000000,gamma:0,eta:0,switches:{memory:false,resonance:false,plasticity:false}};
  expect(()=>D.stepNetwork(D.createNetwork(cfg),{frequency:0.5,intensity:1},cfg)).toThrow(/overflow guard/);
 });
});
describe('AT-002 plan-only runner',()=>{
 it('expands only seeds, stages, conditions and gain levels declared in config',()=>{
  const plan=buildCalibrationPlan(config);
  expect(plan.length).toBe(config.seeds.length*(config.cal01.variants.length+config.cal02.levels.length+config.cal03.conditions.length*config.cal03.profiles.length+config.cal04.conditions.length));
  expect([...new Set(plan.filter(x=>x.stage==='CAL-02').map(x=>x.intensity))].sort()).toEqual([...config.cal02.levels].sort());
  expect(plan.every(job=>config.seeds.includes(job.seed))).toBe(true);
 });
 it('rejects duplicate seeds and weakened artifact isolation',()=>{
  expect(()=>buildCalibrationPlan({...config,seeds:[1,1]})).toThrow(/unique/);
  expect(()=>buildCalibrationPlan({...config,artifactPolicy:{...config.artifactPolicy,oneEngineVariantPerArtifactSet:false}})).toThrow(/mandatory/);
 });
 it('partitions outputs by engine, stage and run ID',()=>{
  const job=buildCalibrationPlan(config)[0];
  expect(artifactPartition(job,'run-001',config.artifactPolicy.root)).toBe(`${config.artifactPolicy.root}/${job.engineVariant}/${job.stage}/run-001`);
  expect(()=>artifactPartition(job,'../escape',config.artifactPolicy.root)).toThrow();
 });
 it('rejects mixed engine artifacts',()=>{
  const job=buildCalibrationPlan(config).find(x=>x.stage==='CAL-01'&&x.engineVariant==='O')!;
  expect(()=>assertArtifactIdentity(job,{engineVariant:'D',stage:'CAL-01',engineVersion:job.engineVersion,engineSourceBlobSha1:job.engineSourceBlobSha1})).toThrow(/mixed engine/);
  expect(job.engineVersion).toBe(config.engineVariants.O.version);
  expect(job.engineSourceBlobSha1).toBe(config.engineVariants.O.sourceBlobSha1);
 });
});
describe('AT-002 trace diagnostics',()=>{
 it('keeps standalone transforms distinct and rejects non-finite values',()=>{
  expect(transformActivation(1.5,'original-clip')).toBe(1);expect(transformActivation(1.5,'diagnostic-identity')).toBe(1.5);
  expect(transformActivation(1.5,'smooth-sigmoid')).toBeCloseTo(0.817574,5);
  expect(()=>transformActivation(Number.NaN,'diagnostic-identity')).toThrow();
 });
 it('records memory evolution without plasticity',()=>{
  const cfg={...defaultConfig,seed:101,switches:{memory:true,resonance:false,plasticity:false}};
  const trace=runCalibrationTrace(cfg,Array.from({length:8},()=>({frequency:0.5,intensity:0.5})));
  expect(trace.some(point=>point.meanMemory>0)).toBe(true);expect(trace.every(point=>point.totalAbsoluteWeightDelta===0)).toBe(true);
 });
 it('records plasticity without memory',()=>{
  const cfg={...defaultConfig,seed:101,switches:{memory:false,resonance:false,plasticity:true}};
  const trace=runCalibrationTrace(cfg,Array.from({length:8},()=>({frequency:0.5,intensity:0.5})));
  expect(trace.every(point=>point.meanMemory===0)).toBe(true);expect(trace.some(point=>point.totalAbsoluteWeightDelta>0)).toBe(true);
 });
});
