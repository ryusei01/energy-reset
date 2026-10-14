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

Expo GoでQRコードを読み込んでください。Android向け開発ビルドを作る場合は、ExpoのEAS Buildを利用できます。

```bash
npm run typecheck
npm test
```

## 機能

- 眠気・だるさ・気分・ストレスを0〜10で記録
- ブレスガーデン（呼吸ガイド）、バブルポップ、リズムリセット（簡易版）、スモールクエスト
- ゲーム前後の体調変化をSQLiteに保存
- タスク登録・2分タイマー・XP付与
- ゲームごとの平均変化を表示

## 制約

これは動作するMVPの初期実装です。リズムゲームは音源同期なし、呼吸ゲームは呼吸センサーなし、ゲーム画面はシンプルなReact Native UIです。睡眠記録用のDBはありますが入力画面は未実装です。通知、キャラクター育成、詳細な統計、医学的効果の検証も未実装です。

このアプリは医療機器ではありません。強い眠気や早朝覚醒が続く場合は医療機関に相談してください。

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
