#!/bin/bash
set -e

echo "=================================================="
echo " Z-26 Supabase RLS & Storage 監査ヘルパー"
echo "=================================================="
echo "このスクリプトは、Supabase環境のRLS設定ならびにStorage権限を"
echo "監査するためのSQLや確認手順を出力する支援ツールです。"
echo ""
echo "▼ 次のステップ ▼"
echo "1. Supabaseのダッシュボードにログインし、「SQL Editor」を開いてください。"
echo "2. 以下のSQLをそれぞれコピー＆ペーストして実行し、セキュリティホールが無いか確認します。"
echo ""

cat << 'EOF'
--------------------------------------------------
【確認1】全テーブルのRLSが有効(true)になっているか
--------------------------------------------------
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

--------------------------------------------------
【確認2】設定済みのポリシーが過剰な権限(匿名すべて許可など)を持っていないか
--------------------------------------------------
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public';
EOF

echo ""
echo "▼ Storage(ストレージ)の確認 ▼"
echo "3. ダッシュボードの「Storage」メニューへ移動し、バケットの公開設定を確認してください。"
echo "  [要注意] 舌画像(tongue_images等)が含まれるバケットは、必ず【Private】(非公開)となっている必要があります。"
echo ""
echo "※ 監査の詳細は docs/supabase_security_audit_v1.md のフォーマットに従って証跡（スクショや結果テキスト）を残してください。"
echo "=================================================="
exit 0
