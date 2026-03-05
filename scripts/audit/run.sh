#!/bin/bash
# ZETUSHIN 監査スクリプト
# 基本憲法（FIXED_CONSTITUTION.md）の遵守を検証する
# 使い方: bash scripts/audit/run.sh

set -euo pipefail

PASS=0
FAIL=0
RESULTS=""

check() {
  local id="$1"
  local desc="$2"
  local expected="$3"
  local actual="$4"
  
  if [ "$actual" = "$expected" ]; then
    RESULTS="${RESULTS}\n| ${id} | ${desc} | ${expected} | ${actual} | ✅ PASS |"
    PASS=$((PASS + 1))
  else
    RESULTS="${RESULTS}\n| ${id} | ${desc} | ${expected} | ${actual} | ❌ FAIL |"
    FAIL=$((FAIL + 1))
  fi
}

echo "🔍 ZETUSHIN 監査テスト開始..."
echo ""

# A-01: LP /app → 404
STATUS_01=$(curl -s -o /dev/null -w "%{http_code}" https://z-26.vercel.app/app)
check "A-01" "LP /app は404" "404" "$STATUS_01"

# A-02: LP /api/health → 404
STATUS_02=$(curl -s -o /dev/null -w "%{http_code}" https://z-26.vercel.app/api/health)
check "A-02" "LP /api/health は404" "404" "$STATUS_02"

# A-03: LP asset → 200
STATUS_03=$(curl -s -o /dev/null -w "%{http_code}" https://z-26.vercel.app/assets/hero_mockup.png)
check "A-03" "LP asset は200" "200" "$STATUS_03"

# A-04: APP /api/health → 200
STATUS_04=$(curl -s -o /dev/null -w "%{http_code}" https://zetu-shin-app.vercel.app/api/health)
check "A-04" "APP /api/health は200" "200" "$STATUS_04"

# A-04b: APP health SHA
APP_SHA=$(curl -s https://zetu-shin-app.vercel.app/api/health | grep -o '"sha":"[^"]*"' | head -1)

# A-05: DOM検査は手動（curlではSPAのDOMを取得できないため）
# → ブラウザ自動テスト or 別途 playwright で実施
RESULTS="${RESULTS}\n| A-05 | DOM検査(DEV要素ゼロ) | - | 手動/Playwright | ⏳ 別途 |"

echo ""
echo "============================="
echo "  ZETUSHIN 監査結果"
echo "============================="
echo ""
echo "| ID | テスト | 期待値 | 実測値 | 判定 |"
echo "|-----|--------|--------|--------|------|"
echo -e "$RESULTS"
echo ""
echo "APP Health: ${APP_SHA:-N/A}"
echo ""
echo "PASS: ${PASS} / FAIL: ${FAIL}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "❌ 監査FAIL — デプロイ前に修正が必要です"
  exit 1
else
  echo "✅ 全テストPASS（DOM検査は別途実施）"
  exit 0
fi
