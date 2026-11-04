import { spawn } from 'node:child_process';
const children = [
  spawn(process.execPath, ['server/index.ts'], { stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit' }),
];
let exiting = false;
function stop(code = 0) {
  if (exiting) return;
  exiting = true;
  for (const c of children) c.kill('SIGTERM');
  process.exitCode = code;
}
for (const c of children) c.on('exit', (code) => stop(code || 0));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop());
