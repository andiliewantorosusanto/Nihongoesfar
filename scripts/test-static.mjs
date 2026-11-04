import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
// The server integration test needs PostgreSQL; the static deployment does not run that server.
const files = readdirSync('tests')
  .filter((name) => name.endsWith('.test.ts') && name !== 'server.test.ts')
  .map((name) => 'tests/' + name);
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
