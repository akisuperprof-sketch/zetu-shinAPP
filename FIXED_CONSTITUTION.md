# ZETUSHIN 基本憲法（FIXED_CONSTITUTION）
**初版固定日**: 2026-03-05  
**適用範囲**: z-26（LP）/ zetu-shinAPP（アプリ）の全開発

> [!CAUTION]
> この文書は「憲法」です。変更には監査テスト全PASSが必須条件です。

---

## 1. ドメイン分離（物理遮断）

| ドメイン | 用途 | 禁止事項 |
|---------|------|---------|
| `z-26.vercel.app` | **LP専用** | アプリUI・/app・/api の表示は禁止。404で封印。 |
| `zetu-shin-app.vercel.app` | **アプリ専用** | LP静的HTML・LP用rewriteの混入は禁止。 |

- この分離が崩れる変更は **禁止**
- 変更時は監査テスト（`scripts/audit/run.sh`）を先に通してからマージすること

## 2. DEV/DEBUG 本番完全封印

- 本番ビルドで `isDevEnabled()` は **必ず false**
- `?debug=1` や `localStorage` で突破不能（`import.meta.env.PROD` ビルド時定数ガード）
- DOM検査で `devButton/debugButton/devText/fixedBottomElements` が常に `false/0`
- 封印を緩める変更は **禁止**（開発環境のみ有効化可）

## 3. 研究同意UI（最短文・価値明示）

### 確定テキスト（C-1）
```
研究協力のお願い：撮影した舌画像と回答は、
個人が特定できない形に整えて東洋医学研究に活用します。
□ 同意する
```

- 同意OFFでもアプリ利用は可能
- 研究保存（画像・回答DB化）は同意ONの時だけ発火
- 同意はバージョン（v1.0等）+ 日時で追跡（後日改定時に遡及可能）

## 4. 研究データ方針（匿名化＋最小収集）

- 主キー: `anon_id`（匿名UUID、ニックネームや本名と紐付けない）
- 画像保存: `anon_id/yyyy-mm-dd/uuid.jpg`（Supabase Storage）
- DB最小項目:
  - `tongue_observations`: anon_id, image_ref, timestamp, consent_version
  - `research_events`: anon_id, event_type, timestamp
  - `analyses`: anon_id, answers_json, questionnaire_version, scores, timestamp
- 年齢/性別/主訴は研究価値が高いので収集する（最小原則）
- 追加時は `docs/research_min_schema.md` に version 付きで追記
- 画像のEXIFデータ（GPS含む）はアップロード前にクライアントサイドで除去（`compressImage`/Canvas経由で実装済み）

## 5. 診断コアロジック変更禁止

以下のファイル群は **変更禁止**（バグ修正を除く）:
- `services/analyzers/*`（スコア計算・分類）
- `services/tongueAnalyzerRouter.ts`（ルーター）
- `constants/patternGroups.ts`（パターン定義）
- `utils/coreEngine.ts`（コアエンジン）

## 6. 壊れない構造（運用ガード）

### 429耐性
- 専用UI + カウントダウン + 自動再試行
- Thundering Herd防止: ジッター導入（既存実装を維持）

### タイムアウト耐性
- API側: `Promise.race` 等でタイムアウト制御
- UI側: バックオフ（2s/5s/15s）で最大3回リトライ
- 失敗時: サポート誘導（`requestId` 付き）

### エラー標準化
- 表示項目: `status / code / route / requestId / sha`
- コピー可能なエラーブロック

## 7. ログインUX（ニックネーム）

- 初回利用でニックネーム設定（任意・本名誘導しない）
- 全UIで「◯◯さん」と呼称（ヘッダー・結果・設定等）
- ニックネーム未設定時: 汎用呼称（「ようこそ」）にフォールバック
- いつでも設定画面から変更可能
- ログアウト時はニックネームのみ消去（anon_id・研究同意は保持）

---

## 監査テスト（変更時必須）

```bash
# 実行方法
bash scripts/audit/run.sh

# 全テストPASSが必須条件
# A-01: z-26.vercel.app/app → 404
# A-02: z-26.vercel.app/api/health → 404
# A-03: z-26.vercel.app/assets/* → 200
# A-04: zetu-shin-app.vercel.app/api/health → 200
# A-05: DOM検査でDEV要素ゼロ
```

## 改定履歴

| 日付 | 版 | 変更内容 |
|------|-----|---------|
| 2026-03-05 | v1.0 | 初版固定 |
