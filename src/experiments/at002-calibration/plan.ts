import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildCalibrationPlan, type At002Configuration } from './runner';

const configPath = fileURLToPath(new URL('../../../experiments/AT-002-CALIBRATION/configuration.json', import.meta.url));
const config = JSON.parse(readFileSync(configPath, 'utf8')) as At002Configuration;
const jobs = buildCalibrationPlan(config);
process.stdout.write(JSON.stringify({
  mode: 'PLAN_ONLY',
  experimentId: config.experimentId,
  protocolVersion: config.protocolVersion,
  executed: false,
  jobCount: jobs.length,
  jobs
}, null, 2) + '\n');
