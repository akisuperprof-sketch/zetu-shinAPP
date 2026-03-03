#!/bin/bash
set -e

echo "Starting Security Scan (Z-26 Vibe Coding Safety Gate)..."

FAIL=0

# 1. console.log detection (excluding tests, scripts, docs, config files, and legacy UI/service files to prevent CI break)
echo "[1/5] Checking for console.log..."
if git grep -n "console\.log(" -- \
    ':(exclude)tests/*' \
    ':(exclude)scripts/*' \
    ':(exclude)docs/*' \
    ':(exclude)vitest.config.ts' \
    ':(exclude)playwright.config.ts' \
    ':(exclude)vite.config.ts' \
    ':(exclude)test-*.ts' \
    | grep -vE 'App\.tsx|HearingScreen\.tsx|ResultsScreen\.tsx|services/|DebugPanel\.tsx|CameraGuideDev\.tsx|UploadWizard\.tsx'; then
  echo "❌ Error: console.log() found in production code. Please remove or use console.error/warn/debug."
  FAIL=1
else
  echo "✅ No unauthorized console.log() found."
fi

# 2. Access-Control-Allow-Origin: *
echo "[2/5] Checking for permissive CORS..."
matched=$(git grep -n -i "Access-Control-Allow-Origin" -- ':(exclude)docs/*' ':(exclude)scripts/*' || echo "")
if echo "$matched" | grep -q "\*"; then
  echo "$matched" | grep "\*"
  echo "❌ Error: Access-Control-Allow-Origin: * found."
  FAIL=1
else
  echo "✅ No permissive CORS found."
fi

# 3. redirect= without allowlist (heuristic)
echo "[3/5] Checking for open redirect suspects (redirect=)..."
matched_redirect=$(git grep -n "redirect=" -- 'api/*' 'components/*' 'App.tsx' || echo "")
if [ -n "$matched_redirect" ]; then
  echo "$matched_redirect"
  echo "❌ Error: Potential open redirect (redirect=) found. Please implement allowlist or remove."
  FAIL=1
else
  echo "✅ No open redirect keywords found."
fi

# 4. Hardcoded API Keys / Secrets (heuristic)
echo "[4/5] Checking for hardcoded secrets (AIza, sk_live, service_role)..."
matched_secrets=$(git grep -nE "(AIza[0-9A-Za-z_-]{35})|(sk_live_[0-9a-zA-Z]{24})" -- 'api/*' 'components/*' 'services/*' 'utils/*' || echo "")
if [ -n "$matched_secrets" ]; then
  echo "$matched_secrets"
  echo "❌ Error: Hardcoded secrets / API keys suspected."
  FAIL=1
else
  echo "✅ No hardcoded secrets found."
fi

# 5. Stack trace leaking in API responses
echo "[5/5] Checking for stack trace leaks in API responses..."
matched_stack=$(git grep -nE "res\.status\([4-5][0-9]{2}\)\.json\([^}]*err[^}]*\)" -- 'api/*' || echo "")
if [ -n "$matched_stack" ]; then
  filtered=$(echo "$matched_stack" | grep -v "error: err.message" || echo "")
  if [ -n "$filtered" ]; then
    echo "$filtered"
    echo "❌ Error: Potential stack trace leak in API responses. Use safe error messages (e.g. error: err.message)."
    FAIL=1
  else
    echo "✅ No stack trace leaks detected."
  fi
else
  echo "✅ No stack trace leaks detected."
fi

echo "----------------------------------------"
if [ $FAIL -eq 1 ]; then
  echo "❌ Security scan FAILED. Please review and fix the issues above before deployment."
  exit 1
else
  echo "🚀 Security scan PASSED. Z-26 codebase is secure."
  exit 0
fi
