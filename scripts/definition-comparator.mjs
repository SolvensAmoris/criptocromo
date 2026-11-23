#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditSeedTopologies } from './topology-audit.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRACT_PATH = path.join(ROOT, 'docs/DEFINITION-COMPARATOR-CONTRACT-v0.2.json');
const contract = JSON.parse(readFileSync(CONTRACT_PATH, 'utf8'));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'buffer', stdio: ['ignore', 'pipe', 'pipe'] });
const blobSha1 = (bytes) => createHash('sha1').update(Buffer.concat([Buffer.from('blob ' + bytes.length + '\0'), bytes])).digest('hex');
const args = process.argv.slice(2);
const artifactIndex = args.indexOf('--artifact');
const outIndex = args.indexOf('--out');
if (artifactIndex < 0 || !args[artifactIndex + 1]) {
  process.stderr.write('Usage: node scripts/definition-comparator.mjs --artifact <BSENS-45198131816-artifact.zip> [--out <report.json>]\n');
  process.exit(2);
}
const artifactPath = path.resolve(process.cwd(), args[artifactIndex + 1]);
const unzip = (member) => execFileSync('unzip', ['-p', artifactPath, member], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
const checks = [];
const add = (id, status, detail) => checks.push({ id, status, detail });

function sourceAudit() {
  for (const [file, expectedBlob] of Object.entries(contract.sourceFiles)) {
    const pr12 = git(['show', contract.historicalReferences.PR12 + ':' + file]);
    const pr13 = git(['show', contract.historicalReferences.PR13 + ':' + file]);
    const current = git(['show', 'HEAD:' + file]);
    const p12 = blobSha1(pr12), p13 = blobSha1(pr13), now = blobSha1(current);
    const identical = p12 === p13 && p12 === expectedBlob && now === expectedBlob;
    add('source:' + file, identical ? 'MATCH' : 'MISMATCH', {
      expectedGitBlobSha1: expectedBlob, pr12GitBlobSha1: p12, pr13GitBlobSha1: p13,
      currentHeadGitBlobSha1: now,
      pr12Sha256: sha256(pr12), pr13Sha256: sha256(pr13), currentHeadSha256: sha256(current)
    });
  }
  for (const [file, expectedBlob] of Object.entries(contract.PR13OnlySourceFiles)) {
    const pr13 = git(['show', contract.historicalReferences.PR13 + ':' + file]);
    const current = git(['show', 'HEAD:' + file]);
    const ok = blobSha1(pr13) === expectedBlob && blobSha1(current) === expectedBlob;
    add('pr13-only-source:' + file, ok ? 'MATCH' : 'MISMATCH', {
      expectedGitBlobSha1: expectedBlob, pr13GitBlobSha1: blobSha1(pr13),
      currentHeadGitBlobSha1: blobSha1(current), sha256: sha256(pr13)
    });
  }
}

function sourceSemantics() {
  const core = git(['show', 'HEAD:src/core/engine.ts']).toString('utf8');
  const variant = git(['show', 'HEAD:src/experiments/at002-calibration/engines/variant-engine.ts']).toString('utf8');
  const dEngine = git(['show', 'HEAD:src/experiments/at002-calibration/engines/engine-v0.2.0-D.ts']).toString('utf8');
  const netlogo = git(['show', 'HEAD:experiments/netlogo/CriptocromoEquivalence.nlogo']).toString('utf8');
  const sensitivity = git(['show', 'HEAD:src/experiments/behavioral-sensitivity.ts']).toString('utf8');
  const config = git(['show', 'HEAD:src/experiments/at001/config.ts']).toString('utf8');
  const tests = [
    ['ACT_RAW_previous_state', core.includes('state.weights[i][j] * neighbor.activation') && variant.includes('state.weights[i][j] * neighbor.activation')],
    ['MEM_previous_activation', core.includes('(1 - config.lambda) * node.activation') && variant.includes('(1 - config.lambda) * node.activation')],
    ['WGT_next_activation', core.includes('nextNodes[i].activation * nextNodes[j].activation') && variant.includes('nextNodes[i].activation * nextNodes[j].activation')],
    ['O_clipping', core.includes('clamp(') && netlogo.includes('min (list 1 (max (list 0 raw)))')],
    ['D_identity', dEngine.includes('return raw;') && netlogo.includes('[raw]')],
    ['synchronous_tick_commit', core.includes('return { nodes: nextNodes, weights: nextWeights, tick: state.tick + 1 }') && netlogo.includes('set activations next-activations') && netlogo.includes('set weights next-weights')],
    ['42_tick_schedule', sensitivity.includes('pulseSteps + config.protocol.recoverySteps') && netlogo.includes('repeat 42')],
    ['shared_numeric_parameters', ['nodeCount: 24','lambda: 0.86','alpha: 0.72','beta: 0.42','gamma: 0.18','eta: 0.24','plasticityRate: 0.035','decayRate: 0.008','resonanceWidth: 18'].every((v) => config.includes(v)) && ['0.72 *','0.42 *','18 *','0.18 *','0.24 *','0.86 *','0.14 *','0.035 *','0.008 *'].every((v) => netlogo.includes(v))],
    ['perturbation_levels', sensitivity.includes('1e-6, 1e-8, 1e-10') && sensitivity.includes("if (variable === 'ACT')") && sensitivity.includes("else if (variable === 'MEM')")]
  ];
  for (const [id, ok] of tests) add('semantic:' + id, ok ? 'MATCH' : 'MISMATCH', { staticSourcePatternCheck: true });
  const tsGuard = dEngine.includes('!Number.isFinite(raw) || Math.abs(raw) > OVERFLOW_GUARD_ABS');
  const nlGuard = netlogo.includes('(abs (item k raw-list)) > 1000000');
  add('semantic:D_guard_domain', tsGuard && nlGuard ? 'PARTIAL_MATCH' : 'MISMATCH', {
    typescriptExplicitFiniteCheck: tsGuard,
    netlogoAbsoluteThresholdCheck: nlGuard,
    explanation: 'The implementations agree on the configured finite overflow threshold but do not express identical behavior over all non-finite values.'
  });

  const graphSourcePinned = variant.includes('state = (state * 1664525 + 1013904223) >>> 0') &&
    variant.includes('nodes.map((_, i) => nodes.map((__, j) => i === j ? 0 : random() * 0.12))') &&
    variant.includes('state.weights[i][j] * neighbor.activation') &&
    variant.includes('nextNodes[i].activation * nextNodes[j].activation');
  const topologyRows = auditSeedTopologies(
    contract.artifact.expectedSeeds,
    contract.topology.nodeCount,
    contract.topology.perturbationLevels
  );
  const topologyOk = graphSourcePinned && topologyRows.length === contract.artifact.expectedSeeds.length &&
    topologyRows.every((row) =>
      row.baseline.edgeCount === contract.topology.expectedEdgeCount &&
      row.baseline.isDag === false &&
      row.baseline.cycleWitness?.length === 2 &&
      row.baseline.topologicalDepth === null &&
      row.perturbed.length === contract.topology.perturbationLevels.length &&
      row.perturbed.every((item) => item.graph.edgeCount === contract.topology.expectedEdgeCount && !item.graph.isDag)
    );
  add('topology:deterministic_cycle_audit', topologyOk ? 'MATCH' : 'MISMATCH', {
    evidenceBasis: 'SOURCE_RECONSTRUCTION_FROM_PINNED_LCG_AND_ARTIFACT_SEED_SET',
    artifactAdjacencyEmbedded: contract.topology.artifactAdjacencyEmbedded,
    generatorSourcePinned: graphSourcePinned,
    edgeSemantics: contract.topology.edgeSemantics,
    seeds: topologyRows,
    expectedEdgesPerSeed: contract.topology.expectedEdgeCount,
    perturbationLevels: contract.topology.perturbationLevels,
    conclusion: 'A 2-cycle witness is verified for each reconstructed seed; topological depth is not applicable to cyclic graphs.'
  });

  const synchronousTick = variant.includes('const nextNodes = state.nodes.map') &&
    variant.includes('state.weights[i][j] * neighbor.activation') &&
    variant.includes('const nextWeights = state.weights.map') &&
    variant.includes('return { nodes: nextNodes, weights: nextWeights, tick: state.tick + 1 }') &&
    sensitivity.includes('for (const stimulus of stimuli())') &&
    sensitivity.includes('abortTick = tick;');
  const noSixteenTickCap = !/max[_A-Z]?ticks?\s*[:=]\s*16/i.test(sensitivity + variant);
  add('engine:tick_semantics', synchronousTick && noSixteenTickCap ? 'MATCH' : 'MISMATCH', {
    oneTick: 'one synchronous full-state transition across all nodes',
    readsPreviousState: variant.includes('state.weights[i][j] * neighbor.activation'),
    commitsNextStateOnce: variant.includes('return { nodes: nextNodes, weights: nextWeights, tick: state.tick + 1 }'),
    plannedStimuli: contract.tickSemantics.plannedStimuli,
    pulseTicks: contract.tickSemantics.pulseTicks,
    recoveryTicks: contract.tickSemantics.recoveryTicks,
    noHardcodedSixteenTickCap: noSixteenTickCap,
    guardIsTerminationMechanism: dEngine.includes('Math.abs(raw) > OVERFLOW_GUARD_ABS') && sensitivity.includes('abortTick = tick;')
  });
}

function artifactAudit() {
  const zipBytes = readFileSync(artifactPath);
  const actualZipSha = sha256(zipBytes);
  if (actualZipSha !== contract.artifact.sha256) {
    add('artifact:zip_sha256', 'MISMATCH', { expected: contract.artifact.sha256, actual: actualZipSha });
    return;
  }
  add('artifact:zip_sha256', 'MATCH', { sha256: actualZipSha, artifactId: contract.artifact.artifactId });
  const manifestBytes = unzip('manifest.json');
  const summariesBytes = unzip('summaries.json');
  const ticksBytes = unzip('tick-comparisons.jsonl');
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  const summaries = JSON.parse(summariesBytes.toString('utf8'));
  const pinnedConfig = git(['show', contract.historicalReferences.PR13 + ':experiments/AT-002-CALIBRATION/configuration.json']);
  const pinnedConfigSha256 = sha256(pinnedConfig);
  const internal = unzip('checksums.sha256').toString('utf8').trim().split(/\r?\n/);
  const internalChecks = [];
  for (const line of internal) {
    const match = line.match(/^([a-f0-9]{64})  (.+)$/);
    if (!match) { internalChecks.push({ file: line, status: 'INVALID_CHECKSUM_LINE' }); continue; }
    const member = match[2];
    const bytes = unzip(member);
    internalChecks.push({ file: member, expected: match[1], actual: sha256(bytes), status: sha256(bytes) === match[1] ? 'MATCH' : 'MISMATCH' });
  }
  add('artifact:internal_checksums', internalChecks.every((x) => x.status === 'MATCH') && internalChecks.length === 3 ? 'MATCH' : 'MISMATCH', internalChecks);
  const manifestOk = manifest.runId === contract.artifact.runId &&
    manifest.sourceCommit === contract.historicalReferences.PR13SensitivitySourceCommit &&
    manifest.trajectoryCount === contract.artifact.expectedTrajectoryCount &&
    manifest.expectedTrajectoryCount === contract.artifact.expectedTrajectoryCount &&
    summaries.length === contract.artifact.expectedTrajectoryCount &&
    manifest.configSha256 === pinnedConfigSha256 &&
    manifest.pulseTicks === 18 && manifest.recoveryTicks === 24 &&
    JSON.stringify(manifest.levels) === JSON.stringify(contract.topology.perturbationLevels) &&
    JSON.stringify(manifest.seedSet) === JSON.stringify(contract.artifact.expectedSeeds);
  add('artifact:manifest_scope', manifestOk ? 'MATCH' : 'MISMATCH', {
    runId: manifest.runId, sourceCommit: manifest.sourceCommit, trajectoryCount: manifest.trajectoryCount,
    pulseTicks: manifest.pulseTicks, recoveryTicks: manifest.recoveryTicks, levels: manifest.levels,
    artifactConfigSha256: manifest.configSha256, pinnedConfigSha256,
    summariesCount: summaries.length, tickComparisonsBytes: ticksBytes.length
  });
  const seeds = contract.artifact.expectedSeeds;
  const guardRows = seeds.map((seed) => {
    const rows = summaries.filter((row) => row.variant === 'D' && row.seed === seed);
    const baseline = rows.find((row) => row.variable === 'BASELINE');
    const perturbed = rows.filter((row) => row.variable !== 'BASELINE');
    const expectedAbortTick = contract.guardAudit.expectedAbortTicks[String(seed)];
    const cause = baseline?.abortReason?.includes('D overflow guard triggered:') ? 'D_OVERFLOW_GUARD' : 'UNCLASSIFIED';
    const baselineMatches = Boolean(baseline) && baseline.abortTick === expectedAbortTick &&
      baseline.lastCompletedTick === expectedAbortTick - 1 &&
      baseline.status === 'ABORTED_GUARD' && cause === contract.guardAudit.cause;
    const sameGuard = baselineMatches && perturbed.length === 9 &&
      perturbed.every((row) => row.abortTick === baseline.abortTick && row.status === 'ABORTED_GUARD' && row.abortReason?.includes('D overflow guard triggered:'));
    return {
      seed, cause, expectedAbortTick, baselineAbortTick: baseline?.abortTick ?? null,
      lastCompletedTick: baseline?.lastCompletedTick ?? null,
      perturbationCount: perturbed.length, baselineMatchesExpectedGuard: baselineMatches,
      allPerturbationsSameGuardTick: sameGuard
    };
  });
  add('artifact:D_guard_censoring_by_seed', guardRows.every((row) => row.allPerturbationsSameGuardTick && row.baselineMatchesExpectedGuard) ? 'MATCH' : 'MISMATCH', guardRows);
}

try {
  sourceAudit();
  sourceSemantics();
  artifactAudit();
} catch (error) {
  process.stderr.write(String(error?.stack ?? error) + '\n');
  process.exit(1);
}
const statuses = checks.map((item) => item.status);
const hasMismatch = statuses.includes('MISMATCH');
const hasPartial = statuses.includes('PARTIAL_MATCH');
const overall = hasMismatch ? 'DEFINITION_MISMATCH' : hasPartial ? 'DEFINITION_PARTIAL_MATCH' : 'DEFINITION_MATCH';
const report = {
  comparatorVersion: '0.2.0',
  overall,
  interpretation: 'This comparator checks historical source identity, selected semantic anchors, deterministic topology reconstruction, synchronous tick semantics, guard censoring and artifact provenance. It does not prove full cross-language semantic equivalence or behavioral equivalence.',
  repository: contract.repository,
  historicalReferences: contract.historicalReferences,
  artifact: { ...contract.artifact, suppliedPath: artifactPath, verifiedSha256: sha256(readFileSync(artifactPath)) },
  checkCount: checks.length,
  checks,
  prohibitedInference: ['DEFINITION_MATCH does not imply BEHAVIORAL_EQUIVALENCE', 'A finite observed prefix does not establish asymptotic stability', 'Censored ticks are not zero-valued observations']
};
const output = JSON.stringify(report, null, 2) + '\n';
if (outIndex >= 0 && args[outIndex + 1]) writeFileSync(path.resolve(process.cwd(), args[outIndex + 1]), output, { flag: 'w' });
process.stdout.write(output);
if (overall !== 'DEFINITION_MATCH') process.exitCode = 1;
