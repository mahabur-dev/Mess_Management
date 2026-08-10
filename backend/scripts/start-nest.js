const path = require('node:path');
const { spawn } = require('node:child_process');

const nestCli = path.resolve(__dirname, '../node_modules/@nestjs/cli/bin/nest.js');
const child = spawn(process.execPath, [nestCli, ...process.argv.slice(2)], {
  cwd: path.resolve(__dirname, '..'),
  env: {
    ...process.env,
    // SWC keeps the project's `src/*` imports in compiled JavaScript. Make
    // Node resolve those imports against the compiled dist/src directory.
    NODE_PATH: path.resolve(__dirname, '../dist'),
  },
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
