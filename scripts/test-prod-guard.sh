#!/bin/bash
echo "🚀 Starting Production Guard Verification (Build & Preview)..."

# 1. Build the app
npm run build

# 2. Start preview in background with strict port
npm run preview -- --port 4173 --strictPort &
PREVIEW_PID=$!

# 3. Wait for server
echo "Waiting for preview server to start on port 4173..."
for i in {1..10}; do
    if curl -s http://localhost:4173 > /dev/null; then
        echo "Server is up!"
        break
    fi
    echo "Wait..."
    sleep 2
done

# 4. Run specific E2E test against preview port
echo "Running E2E verification against http://localhost:4173..."
cat > tests/e2e/prod-verify-temp.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test('PROD Verification: Dev tools and debug APIs must be GONE', async ({ page, request }) => {
    // Force set baseURL for this test to the preview server
    await page.goto('http://localhost:4173');
    
    // 1. UI Check: Dev Control Center badge should be missing
    const devBadge = page.locator('text=Dev');
    await expect(devBadge).not.toBeVisible({ timeout: 5000 });
    
    // 2. UI Check: Settings icon/button should be missing
    const devSettings = page.locator('button[title="開発者用コントロールセンターを開く"]');
    await expect(devSettings).not.toBeVisible({ timeout: 5000 });

    // 3. API Guard Check
    const response = await request.get('http://localhost:4173/api/research_debug');
    
    const contentType = response.headers()['content-type'] || '';
    const isHtml = contentType.includes('text/html');
    
    if (response.status() === 200) {
        expect(isHtml).toBe(true); 
        const text = await response.text();
        expect(text).toContain('<!DOCTYPE html>');
        // Must NOT contain any part of the researchers data
        expect(text).not.toContain('"status":"success"');
        expect(text).not.toContain('research_events');
    } else {
        expect([404, 403]).toContain(response.status());
    }
});
EOF

npx playwright test tests/e2e/prod-verify-temp.spec.ts --project=chromium

RESULT=$?

# 5. Cleanup
kill $PREVIEW_PID
rm tests/e2e/prod-verify-temp.spec.ts

if [ $RESULT -eq 0 ]; then
    echo "✅ Production Guard Verification PASSED."
    exit 0
else
    echo "❌ Production Guard Verification FAILED."
    exit 1
fi
