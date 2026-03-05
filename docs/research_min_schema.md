# 研究データ最小スキーマ (research_min_schema)
**Version**: v1.0  
**固定日**: 2026-03-05  
**管理元**: FIXED_CONSTITUTION.md §4

> [!IMPORTANT]
> このスキーマへのカラム追加は version を更新し、後方互換を保証すること。
> 既存カラムの削除・型変更は禁止（マイグレーション必須）。

---

## 1. tongue_observations（観測記録）

| カラム | 型 | 必須 | 説明 |
|--------|-----|------|------|
| `id` | UUID | ✅ | 主キー |
| `anon_id` | UUID | ✅ | 匿名ユーザーID（個人情報と紐付けない） |
| `image_ref` | TEXT | ✅ | Storage内のパス `anon_id/yyyy-mm-dd/uuid.jpg` |
| `age_range` | TEXT | - | 年齢区分（10代/20代/.../70代以上） |
| `gender` | TEXT | - | 性別（男性/女性/その他/未回答） |
| `chief_complaint` | TEXT | - | 主訴（自由記述、最大200文字） |
| `consent_version` | TEXT | ✅ | 同意バージョン（v1.0等） |
| `consent_at` | TIMESTAMPTZ | ✅ | 同意日時 |
| `created_at` | TIMESTAMPTZ | ✅ | 作成日時 |
| `schema_version` | TEXT | ✅ | `v1.0` 固定 |

## 2. research_events（研究イベントログ）

| カラム | 型 | 必須 | 説明 |
|--------|-----|------|------|
| `id` | UUID | ✅ | 主キー |
| `anon_id` | UUID | ✅ | 匿名ユーザーID |
| `event_type` | TEXT | ✅ | `consent_given` / `consent_revoked` / `analysis_completed` / `image_uploaded` |
| `metadata` | JSONB | - | イベント固有のメタデータ |
| `created_at` | TIMESTAMPTZ | ✅ | イベント発生日時 |

## 3. analyses（解析結果）

| カラム | 型 | 必須 | 説明 |
|--------|-----|------|------|
| `id` | UUID | ✅ | 主キー |
| `anon_id` | UUID | ✅ | 匿名ユーザーID |
| `observation_id` | UUID | ✅ | tongue_observations.id への参照 |
| `answers_json` | JSONB | ✅ | 問診回答（全質問のスナップショット） |
| `questionnaire_version` | TEXT | ✅ | 問診バージョン（v1.0等） |
| `scores_json` | JSONB | - | スコア結果（虚実/寒熱/燥湿等） |
| `pattern_ids` | TEXT[] | - | 判定パターンID群 |
| `analysis_mode` | TEXT | ✅ | `standard` / `heat_cold` / `pro` |
| `created_at` | TIMESTAMPTZ | ✅ | 解析日時 |
| `schema_version` | TEXT | ✅ | `v1.0` 固定 |

## 4. Storage構造

```
supabase-storage/
└── research/
    └── {anon_id}/
        └── {yyyy-mm-dd}/
            └── {uuid}.jpg    ← 舌画像（リサイズ済み、EXIF除去）
```

## 5. 匿名化ルール

- `anon_id` は端末のlocalStorageで生成（`crypto.randomUUID()`）
- ニックネーム・メールアドレス・IPアドレスはDBに保存 **しない**
- 画像のEXIFデータ（GPS含む）はアップロード前にクライアントサイドで除去
- 年齢は区分（10代/20代等）で保存し、生年月日は収集しない

## 6. スキーマ改定ルール

1. カラム **追加** のみ許可（DEFAULTまたはNULLABLE必須）
2. `schema_version` を更新（v1.0 → v1.1 等）
3. `FIXED_CONSTITUTION.md` と本ドキュメントの両方を更新
4. マイグレーションSQLを `docs/migrations/` に保存
5. 既存データの後方互換を保証
