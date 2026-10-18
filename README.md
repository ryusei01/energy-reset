# Energy Reset

体調チェック、4種類の短時間ゲーム、タスク開始支援、プレイ前後の変化分析を備えたAndroid向けExpoアプリのMVPです。

## 開発環境

- Node.js 22
- Android端末 / Android Emulator
- Expo SDK 54

```bash
npm install
npx expo start
```

Expo GoでQRコードを読み込んでください。

## Android APK を作る（実機インストール用）

プロジェクトのフォルダで:

```bash
npm run android:apk
```

**できあがった APK の場所（ここを探せば OK）:**

| パス | 説明 |
|------|------|
| `build/EnergyReset.apk` | ビルド後に自動コピーされるファイル（**いちばん探しやすい**） |
| `android/app/build/outputs/apk/release/app-release.apk` | Gradle の本来の出力 |

フルパスの例（この PC）:

`d:\document\program\project\energy-reset\build\EnergyReset.apk`

エクスプローラーでプロジェクト `energy-reset` を開き、`build` フォルダ → `EnergyReset.apk` です。

端末へ入れる例:

```bash
adb install build/EnergyReset.apk
```

初回ビルドは数分かかります。Java と Android SDK（`ANDROID_HOME`）が必要です。

```bash
npm run typecheck
npm test
```

## 機能

- 眠気・だるさ・気分・ストレスを0〜10で記録
- ブレスガーデン（吸う4秒・吐く6秒のアニメーション）、バブルポップ、リズムリセット（72 BPMの判定）、スモールクエスト
- 音と振動のオンオフ、プレイ中の画面スリープ防止
- ゲーム前後の体調変化をSQLiteに保存
- タスク登録・2分タイマー・XPに応じた仲間の成長
- ゲームごとの平均変化と直近プレイのグラフ
- 睡眠時間と早朝覚醒の記録
- 毎日1回のローカル通知
- JSONでのバックアップと復元

## 制約

このアプリは医療機器ではありません。呼吸センサーはなく、リズムの音はアプリ内で生成したクリックです。通知には端末の許可が必要です。表示する数値は自己評価の差であり、治療効果の検証はしていません。

強い眠気や早朝覚醒が続く場合は医療機関に相談してください。

## GitHubへアップロード

```bash
git init
git add .
git commit -m "Initial Energy Reset MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/energy-reset.git
git push -u origin main
```

事前にGitHubで空の `energy-reset` リポジトリを作成してください。
