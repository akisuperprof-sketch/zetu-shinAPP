# 舌神 -ZETUSHIN- 運用・検証手順書 (RUNBOOK)

## 1. 概要
本プロジェクトにおける研究データ蓄積（Step 1）および本番環境でのトラブルシューティング手順をまとめたものです。

## 2. 接続・解析不能時のトラブルシューティング
「現在利用できません」と表示される場合、以下の手順で原因を特定します。

### 1段階：デバッグ情報の確認
- 本番URLに `?debug=1` を付与してアクセスします。
- 撮影画面（UploadWizard）のボタン上部に赤い文字でエラー理由（`[DEBUG: API_ERROR]`）が表示されます。
    - `API_CHECK_FAILED: 401`: HMACトークンの検証失敗（サーバー・クライアント間のキー不一致）。
    - `API_CHECK_FAILED: 500`: サーバー側での環境変数未設定（`GEMINI_API_KEY` 等）。
    - `CONNECTION_FAILED`: ネットワーク遮断、または Vercel Functions のコールドスタート失敗。

### 2段階：サーバーログ・ヘルスチェックの確認
- ブラウザで `{HOST}/api/health` にアクセスし、以下の情報が正しく返るか確認します：
    - `status: "ok"`
    - `version`: フロントエンドのフッターと一致しているか
    - `sha`: デプロイされたコミットハッシュ

- Vercel の Logs タブを開き、`[api:index]` または `[save_observation]` をフィルタリングします。
- ステータスコードが 200 以外（401, 429, 500）になっているリクエストの詳細を確認します。

---

## 3. 研究データ蓄積（Step 1）の検証
解析結果画面でデータが正しく保存されているか確認します。

### クライアント側（debug=1時）
- 解析完了直後、画面右下に `RESEARCH: archived_ok` と表示されれば保存成功です。
- `archived_failed` や `archived_error` の場合は、表示されるエラーメッセージから原因を特定します。

---

## 4. ローカル開発環境でのテスト手順 (Phase 1 完走用)
フロントエンド (Vite) と API (api/index.ts) の両方をテストするには、`vercel dev` の利用を最優先します。

### A. `vercel dev` による一括起動（推奨）
1. ターミナルで `vercel dev --listen 3500` を実行します（Port 3500 を推奨）。
2. 初回起動時はプロジェクトのリンクを求められる場合があります。
3. `http://localhost:3500` にアクセスして `/api/health` が HTTP 200 を返すことを確認します。
4. `/app?debug=1` を開き、診断フローを最後までテストします。

### B. `npm run dev` + `vercel dev` の併用（Proxy経由）
- `vite.config.ts` に `/api` の Proxy 設定（Target: 3500番など）が含まれているか確認します。
- Vite (localhost:3000) からでも、`vercel dev` (localhost:3500) が別で動いていれば API 疎通が可能です。

## 5. 「現在利用できません」発生時の切り分け
- `?debug=1` を付与して画面最下部の [RETRY] ボタン または [Missing Envs] 表示を確認します。
- `API_CHECK_FAILED: 404`: `vercel dev` または Proxy が正しく設定されていません。
- `API_CHECK_FAILED: 500`: 環境変数（`GEMINI_API_KEY` 等）が読み込まれていません（`vercel dev` 起動時のログを確認）。
- `RESEARCH: archived_failed`: 保存は失敗してもユーザー結果画面はブロッキングせず継続するのが正常な仕様です。
エラーメッセージから原因を特定します。

### サーバー側（管理者・開発者向け）
1. **Supabase Storage**:
   - `tongue-images` バケット内に `{anonId}/{yyyy-mm-dd}/{uuid}.jpg` が生成されているか確認。
2. **Supabase Database**:
   - `tongue_observations` テーブルに新しい行が追加されているか確認。
   - `features_json` カラムに画像特徴量（brightness, contrast等）が正しく記録されているか確認。

---

## 4. 環境変数の設定 (Required Envs)
以下の環境変数が Vercel に設定されている必要があります。

| Key | Description |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase プロジェクト URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 管理用キー (Storage/DB書き込み用) |
| `GEMINI_API_KEY` | Google Gemini API キー |
| `INTERNAL_API_KEY` | クライアント・サーバー間のセキュリティ用共有キー |

---

## 5. 修正・メンテナンス時の注意点
- `services/analyzers/` の中身は**絶対に変更しない**こと。
- APIパスの変更は行わず、`api/index.ts` のハンドラーとして登録すること。
- 撮影→結果の導線は、研究データの保存が失敗しても止めない（疎結合）こと。
