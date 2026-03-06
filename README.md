# ZETUSHIN Application (zetu-shinAPP)

ZETUSHINは、舌画像から体調を解析するAIを活用した東洋医学研究プラットフォームです。
本リポジトリは「壊れない構造」を基本憲法として、物理的な品質保証と将来の拡張性を両立しています。

## 📜 ドキュメント・仕様書

### コア・憲法
- [FIXED_CONSTITUTION.md](./FIXED_CONSTITUTION.md) - プロジェクトの最高法規（ドメイン分離、DEV封印等）
- [ARCHITECTURE.md](./ARCHITECTURE.md) - システム物理構造とデータフロー

### 拡散・成長設計（将来機能）
これらの機能は実装済みですが、現在は Feature Flag により封印されています。
- [拡散機能完全仕様書](./%E6%8B%A1%E6%95%A3%E6%A9%9F%E8%83%BD%E5%AE%8C%E5%85%A8%E4%BB%95%E6%A7%98%E6%9B%B8) - 10万人規模への拡散戦略とデータモデル
- [拡散設計ワイヤーフレーム](./%E6%8B%A1%E6%95%A3%E8%A8%AD%E8%A8%88%E3%83%AF%E3%82%A4%E3%83%A4%E3%83%BC%E3%83%95%E3%83%AC%E3%83%BC%E3%83%A0) - 共有カードやチャートのUIレイアウト

### 研究・観察補助
- **色観察補助機能 (FEATURE_COLOR_ASSIST)**: `project/reference/` 配下の SSOT (Single Source of Truth) 画像を基準とした、色判定の観察補助（Assist）機能です。表示されている指標に基づく特定の自動診断結果・断定文を出力するものではありません。あくまで研究者向けの目視支援用UIとしてFeature Flagで封印されています。

---

## 🛠 開発と監査

### 監査テストの実行
変更を加える際は、必ず以下のスクリプトを実行し、全テストがPASSすることを確認してください。
```bash
bash scripts/audit/run.sh
```

### 研究開発モード (Research Mode)
研究ダッシュボードや画像投入パネルを有効にして起動するには、以下のコマンドを使用します。
```bash
npm run dev:research
```
起動後、ブラウザで `/admin/research` を開くか、画面左下の `Dev Control` -> `Research Tools` からダッシュボードへアクセスできます。

### 管理者認証 (Admin Authentication)
`/admin/research` は機密情報を含むため、管理者認証が必要です。
1. **環境変数の設定**:
   - `ADMIN_RESEARCH_PASSWORD`: ダッシュボードへのアクセスパスワード。
   - `INTERNAL_API_KEY`: トークンの署名に使用する秘密鍵。
2. **アクセス方法**:
   - 本番環境では直接 `/admin/research` にアクセスすると、認証ゲートが表示されます。
   - 正しいパスワードを入力することで、1時間は同ブラウザタブでアクセスが許可されます。

### ビルド生成物の扱い
`dist` および `dist-ssr` ディレクトリはビルドシステム(Vite)によって自動生成される成果物です。
Git管理の対象外として `.gitignore` で明示的に除外されており、ソースコードリポジトリには含めない運用とします。

### 開発用フラグ
本番ビルドでは `isDevEnabled()` が常に `false` となり、デバッグツールは物理的に除去されます。
将来機能の有効化は `utils/featureFlags.ts` で管理されます。
