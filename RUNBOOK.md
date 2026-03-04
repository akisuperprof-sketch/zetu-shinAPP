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

### 2段階：サーバーログの確認 (Vercel Dashboard)
- Vercel の Logs タブを開き、`[api:index]` または `[save_observation]` をフィルタリングします。
- ステータスコードが 200 以外（401, 429, 500）になっているリクエストの詳細を確認します。

---

## 3. 研究データ蓄積（Step 1）の検証
解析結果画面でデータが正しく保存されているか確認します。

### クライアント側（debug=1時）
- 解析完了直後、画面右下に `RESEARCH: archived_ok` と表示されれば保存成功です。
- `archived_failed` や `archived_error` の場合は、表示されるエラーメッセージから原因を特定します。

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
