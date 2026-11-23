import type { PrincipleSwitches } from '../../core/types';

export type EngineVariantId = 'O' | 'D' | 'S';
export type CalibrationStage = 'CAL-01' | 'CAL-02' | 'CAL-03' | 'CAL-04';

export interface EngineIdentity {
  module: string;
  version: string;
  sourceBlobSha1: string;
  dependencyBlobSha1: Record<string, string>;
  sharedKernelBlobSha1?: string;
}
export interface CalibrationCondition extends PrincipleSwitches { id: string; }
export interface At002Configuration {
  experimentId: string;
  protocolVersion: string;
  status: string;
  seeds: number[];
  engineVariants: Record<EngineVariantId, EngineIdentity>;
  protocol: { targetFrequency: number; offTargetFrequency: number; pulseSteps: number; recoverySteps: number };
  cal01: { variants: EngineVariantId[]; intensity: number; switches: PrincipleSwitches; instrumentation: Record<string, string> };
  cal02: { factor: string; levels: number[]; fixedParameters: boolean; engineVariant: EngineVariantId; switches: PrincipleSwitches };
  cal03: { engineVariant: EngineVariantId; intensity: number; sequenceSteps: number; profiles: string[]; conditions: CalibrationCondition[] };
  cal04: { engineVariant: EngineVariantId; intensity: number; conditions: CalibrationCondition[] };
  artifactPolicy: { root: string; partitionBy: string[]; oneEngineVariantPerArtifactSet: boolean; includeEngineVersionAndSourceHash: boolean; noOverwrite: boolean };
}
export interface CalibrationJob {
  experimentId: string;
  protocolVersion: string;
  stage: CalibrationStage;
  engineVariant: EngineVariantId;
  engineVersion: string;
  engineSourceBlobSha1: string;
  engineDependencyBlobSha1: Record<string, string>;
  seed: number;
  conditionId: string;
  switches: PrincipleSwitches;
  intensity: number;
  targetFrequency: number;
  offTargetFrequency: number;
  pulseSteps: number;
  recoverySteps: number;
  stimulusProfile: string;
}
const isHash = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const inUnitInterval = (value: number): boolean => Number.isFinite(value) && value >= 0 && value <= 1;
function assertConfig(c: At002Configuration): void {
  if (!c.seeds.length || c.seeds.some(x => !Number.isInteger(x))) throw new Error('Configuration must declare integer seeds');
  if (new Set(c.seeds).size !== c.seeds.length) throw new Error('Seeds must be unique');
  if (!c.artifactPolicy.oneEngineVariantPerArtifactSet || !c.artifactPolicy.noOverwrite || !c.artifactPolicy.includeEngineVersionAndSourceHash) throw new Error('Artifact isolation, identity and no-overwrite policies are mandatory');
  for (const id of ['O', 'D', 'S'] as const) {
    const engine = c.engineVariants[id];
    if (!engine?.version || !isHash(engine.sourceBlobSha1)) throw new Error('Every engine requires a version and pinned Git blob SHA-1');
    if (!engine.dependencyBlobSha1 || !Object.keys(engine.dependencyBlobSha1).length || Object.values(engine.dependencyBlobSha1).some(hash => !isHash(hash))) throw new Error('Every engine requires pinned dependency blob SHA-1 identities');
  }
  if (c.cal01.variants.length !== 2 || c.cal01.variants[0] !== 'O' || c.cal01.variants[1] !== 'D') throw new Error('CAL-01 must compare O and D only, in that order');
  if (!inUnitInterval(c.cal01.intensity)) throw new Error('CAL-01 intensity must be finite and within [0,1]');
  if (!c.cal01.instrumentation || Object.keys(c.cal01.instrumentation).length !== 3 || Object.values(c.cal01.instrumentation).some(hash => !isHash(hash))) throw new Error('CAL-01 instrumentation source hashes must be pinned');
  if (!c.cal02.levels.length || c.cal02.levels.some(x => !inUnitInterval(x))) throw new Error('CAL-02 levels must be finite and within [0,1]');
  if (c.cal02.engineVariant !== 'O') throw new Error('CAL-02 is preregistered for O only');
  if (c.cal03.engineVariant !== 'O' || c.cal04.engineVariant !== 'O') throw new Error('CAL-03 and CAL-04 are preregistered for O only');
  if (!inUnitInterval(c.cal03.intensity) || !inUnitInterval(c.cal04.intensity)) throw new Error('CAL-03/CAL-04 intensities must be finite and within [0,1]');
  if (!Number.isInteger(c.cal03.sequenceSteps) || c.cal03.sequenceSteps < 1) throw new Error('CAL-03 sequenceSteps must be a positive integer');
  if (!c.cal03.profiles.length || !c.cal03.conditions.length || !c.cal04.conditions.length) throw new Error('CAL-03/CAL-04 design must be explicit in configuration');
  if (!Number.isInteger(c.protocol.pulseSteps) || c.protocol.pulseSteps < 1 || !Number.isInteger(c.protocol.recoverySteps) || c.protocol.recoverySteps < 1) throw new Error('Pulse and recovery steps must be positive integers');
}
export function buildCalibrationPlan(c: At002Configuration): CalibrationJob[] {
  assertConfig(c);
  const jobs: CalibrationJob[] = [];
  const base = {
    experimentId: c.experimentId, protocolVersion: c.protocolVersion,
    targetFrequency: c.protocol.targetFrequency, offTargetFrequency: c.protocol.offTargetFrequency,
    pulseSteps: c.protocol.pulseSteps, recoverySteps: c.protocol.recoverySteps
  };
  const identity = (engineVariant: EngineVariantId) => ({
    engineVariant,
    engineVersion: c.engineVariants[engineVariant].version,
    engineSourceBlobSha1: c.engineVariants[engineVariant].sourceBlobSha1,
    engineDependencyBlobSha1: { ...c.engineVariants[engineVariant].dependencyBlobSha1 }
  });
  for (const seed of c.seeds) {
    for (const engineVariant of c.cal01.variants) jobs.push({ ...base, ...identity(engineVariant), stage: 'CAL-01', seed, conditionId: 'ALL_ON', switches: { ...c.cal01.switches }, intensity: c.cal01.intensity, stimulusProfile: 'target-pulse-then-recovery' });
    for (const intensity of c.cal02.levels) jobs.push({ ...base, ...identity(c.cal02.engineVariant), stage: 'CAL-02', seed, conditionId: 'ALL_ON', switches: { ...c.cal02.switches }, intensity, stimulusProfile: 'target-pulse-then-recovery' });
    for (const condition of c.cal03.conditions) for (const profile of c.cal03.profiles) jobs.push({ ...base, ...identity(c.cal03.engineVariant), stage: 'CAL-03', seed, conditionId: condition.id, switches: { memory: condition.memory, resonance: condition.resonance, plasticity: condition.plasticity }, intensity: c.cal03.intensity, pulseSteps: c.cal03.sequenceSteps, recoverySteps: 0, stimulusProfile: profile });
    for (const condition of c.cal04.conditions) jobs.push({ ...base, ...identity(c.cal04.engineVariant), stage: 'CAL-04', seed, conditionId: condition.id, switches: { memory: condition.memory, resonance: condition.resonance, plasticity: condition.plasticity }, intensity: c.cal04.intensity, stimulusProfile: 'target-pulse-then-recovery' });
  }
  return jobs;
}
export function artifactPartition(job: Pick<CalibrationJob, 'engineVariant' | 'stage'>, runId: string, root: string): string {
  if (!/^[a-zA-Z0-9._-]+$/.test(runId)) throw new Error('runId contains unsafe path characters');
  return `${root}/${job.engineVariant}/${job.stage}/${runId}`;
}
export function assertArtifactIdentity(
  expected: Pick<CalibrationJob, 'engineVariant' | 'stage' | 'engineVersion' | 'engineSourceBlobSha1' | 'engineDependencyBlobSha1'>,
  manifest: { engineVariant: EngineVariantId; stage: CalibrationStage; engineVersion: string; engineSourceBlobSha1: string; engineDependencyBlobSha1: Record<string, string> }
): void {
  const sameDependencies = JSON.stringify(Object.entries(expected.engineDependencyBlobSha1).sort()) === JSON.stringify(Object.entries(manifest.engineDependencyBlobSha1).sort());
  if (expected.engineVariant !== manifest.engineVariant || expected.stage !== manifest.stage || expected.engineVersion !== manifest.engineVersion || expected.engineSourceBlobSha1 !== manifest.engineSourceBlobSha1 || !sameDependencies) throw new Error('Artifact identity mismatch: mixed engine variants, versions, source hashes or stages are forbidden');
}
