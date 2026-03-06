import { test, expect } from '@playwright/test';

test.describe('A-05 Security Audit: DOM Inspection', () => {
    test('Ensures that no DEV UI or feature debug elements are exposed in production', async ({ page }) => {
        // We will test against the local server if running locally, or prod url.
        // For audit scripts, we check the actual prod url to strictly make sure LP/APP is clean in Prod.
        const targetUrl = process.env.TEST_URL || 'https://zetu-shin-app.vercel.app';

        await page.goto(targetUrl);

        // Verify that the title is expected
        await expect(page).toHaveTitle(/(ZETUSHIN|Z-26)/i);

        // Verify there is no debug panel
        const debugHooks = await page.$$('.debug-panel, [data-testid="debug-view"], #debug-overlay, [class*="debug"]');
        expect(debugHooks.length, `Found ${debugHooks.length} debug elements on production DOM`).toBe(0);

        // Verify there is no Research OS dashboard visible by default on landing page
        const researchDash = await page.$$('.research-dashboard, [class*="research"]');
        expect(researchDash.length, `Found ${researchDash.length} research elements exposed without flags`).toBe(0);

    });
});
