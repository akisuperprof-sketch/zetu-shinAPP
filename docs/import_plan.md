# 既存研究画像インポート計画 (import_plan)
**Version**: v1.0  
**固定日**: 2026-03-05  
**対象画像数**: 100〜300枚（既存収集分）

> [!WARNING]
> 本手順はインポート「計画」です。実行はSupabase環境とテーブル作成が完了してから行います。

---

## 1. 前提条件（実行前に全て満たすこと）

- [ ] Supabase プロジェクトが作成済み
- [ ] `tongue_observations` / `analyses` テーブルが `research_min_schema.md` に従い作成済み
- [ ] Storage バケット `research` が作成済み（private, 認証なしアップロード不可）
- [ ] 画像元データに対する研究利用同意が取得済み
- [ ] EXIF除去ツール（`exiftool` 等）がインストール済み

## 2. 匿名化手順

### 2.1 画像のEXIF除去
```bash
# 全画像からEXIF（GPS含む）を除去
find ./raw_images -name "*.jpg" -exec exiftool -all= {} \;
find ./raw_images -name "*.png" -exec exiftool -all= {} \;
```

### 2.2 ファイル名の匿名化
```bash
# 元ファイル名にID情報が含まれる場合、UUID化
#!/bin/bash
for file in ./raw_images/*.jpg; do
  uuid=$(uuidgen | tr '[:upper:]' '[:lower:]')
  mv "$file" "./anonymized/${uuid}.jpg"
done
```

### 2.3 メタデータCSV作成
```csv
uuid,original_date,age_range,gender,chief_complaint,consent_version
abc-123.jpg,2025-10-15,30代,女性,肩こり,v1.0-import
def-456.jpg,2025-10-16,20代,男性,,v1.0-import
```

- `consent_version` は `v1.0-import`（既存データの一括同意を示す特別バージョン）
- 元データの個人情報（氏名・学籍番号等）はCSVに **含めない**

## 3. インポート手順

### 3.1 Storage アップロード
```bash
# Supabase CLIを使用
for file in ./anonymized/*.jpg; do
  uuid=$(basename "$file" .jpg)
  anon_id="import-batch-001"  # 一括インポート用の共通anon_id
  date=$(date +%Y-%m-%d)
  supabase storage cp "$file" "research/${anon_id}/${date}/${uuid}.jpg"
done
```

### 3.2 DB レコード追加
```sql
-- import_batch.sql
INSERT INTO tongue_observations (
  id, anon_id, image_ref, age_range, gender, chief_complaint,
  consent_version, consent_at, created_at, schema_version
) VALUES
  (gen_random_uuid(), 'import-batch-001', 'import-batch-001/2026-03-05/abc-123.jpg',
   '30代', '女性', '肩こり', 'v1.0-import', NOW(), '2025-10-15', 'v1.0'),
  -- ... 以下、CSVから自動生成
;
```

### 3.3 インポート用スクリプト（自動生成）
```bash
# CSVからSQLを生成するスクリプト
# scripts/import/csv_to_sql.py（後日作成）
python scripts/import/csv_to_sql.py \
  --csv ./import_metadata.csv \
  --anon-id import-batch-001 \
  --output ./import_batch.sql
```

## 4. 検証手順

1. `SELECT COUNT(*) FROM tongue_observations WHERE consent_version = 'v1.0-import'` → 期待行数
2. Storage内のファイル数とDB行数の整合チェック
3. ランダム10件を目視確認（画像が正しいか、EXIF除去されているか）
4. `anon_id` で検索して個人特定できないことを確認

## 5. ロールバック手順

```sql
-- インポートした全データを削除
DELETE FROM analyses WHERE observation_id IN (
  SELECT id FROM tongue_observations WHERE consent_version = 'v1.0-import'
);
DELETE FROM tongue_observations WHERE consent_version = 'v1.0-import';
```

```bash
# Storage削除
supabase storage rm -r "research/import-batch-001"
```

## 6. 制約事項

- インポートデータの `consent_version` は `v1.0-import` で区別
- 通常ユーザーデータ（`v1.0`）とは分離管理
- 元データの保管場所・廃棄手順は別途定める
- **インポート後は元データのローカルコピーを廃棄**（`rm -rf ./raw_images ./anonymized`）
