const { spawnSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const android = path.join(root, 'android');
const isWin = process.platform === 'win32';
const gradlew = path.join(android, isWin ? 'gradlew.bat' : 'gradlew');
const args = ['assembleRelease'];
if (process.env.CI === 'true') args.push('-PreactNativeArchitectures=arm64-v8a');

const result = spawnSync(gradlew, args, {
  cwd: android,
  stdio: 'inherit',
  shell: isWin,
  env: process.env,
});

if (result.status !== 0) process.exit(result.status ?? 1);
require('./copy-apk.cjs');
