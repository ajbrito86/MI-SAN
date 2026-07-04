const { existsSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const binName = process.platform === 'win32' ? 'patch-package.cmd' : 'patch-package';
const patchPackageBin = join(__dirname, '..', 'node_modules', '.bin', binName);

if (!existsSync(patchPackageBin)) {
  console.log('patch-package not installed; skipping patches.');
  process.exit(0);
}

const result = spawnSync(patchPackageBin, { stdio: 'inherit', shell: process.platform === 'win32' });

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status || 0);
