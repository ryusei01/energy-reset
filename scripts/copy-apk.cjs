const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const destDir = path.join(root, 'build');
const dest = path.join(destDir, 'EnergyReset.apk');

if (!fs.existsSync(src)) {
  console.error('APK がまだありません。先に npm run android:apk を実行してください。');
  console.error('Gradle の出力先:', src);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('');
console.log('=== APK の場所 ===');
console.log(dest);
console.log('');
console.log('（Gradle 直出力）', src);
