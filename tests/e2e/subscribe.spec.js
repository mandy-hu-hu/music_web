const { test, expect } = require('@playwright/test');
const { blockCDN, mockRoutes, gotoMain } = require('./helpers');

test.beforeEach(async ({ page }) => {
    await blockCDN(page);
    await mockRoutes(page);   // subscriptions start empty
    await gotoMain(page);
    await page.waitForTimeout(300);
});

// Scope to #queryResults so the locator is stable after subscriptions render.
async function searchAndGetFirstResultCard(page) {
    await page.fill('#qArtist', 'Taylor Swift');
    await page.click('#queryForm button[type="submit"]');
    await page.waitForSelector('#queryResults .song-card', { timeout: 5000 });
    return page.locator('#queryResults .song-card').first();
}

test('TC-E-014: clicking Subscribe changes button to Subscribed and adds to subscription list', async ({ page }) => {
    const card = await searchAndGetFirstResultCard(page);
    const btn = card.locator('button');

    await expect(btn).toHaveText('Subscribe');
    await btn.click();

    await expect(btn).toHaveText('Subscribed', { timeout: 5000 });
    await expect(page.locator('#subscriptionList .song-card')).toHaveCount(1, { timeout: 5000 });
});

test('TC-E-015: button shows Subscribing... and is disabled during in-flight request', async ({ page }) => {
    const { API } = require('./helpers');

    // Delay the POST /subscriptions response to observe intermediate state
    await page.route(`${API}/subscriptions**`, async route => {
        if (route.request().method() === 'POST') {
            await new Promise(r => setTimeout(r, 600));
            await route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify({ ok: true, data: { message: 'Subscription added' } }),
            });
        } else {
            await route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify({ ok: true, data: { items: [] } }),
            });
        }
    });

    const card = await searchAndGetFirstResultCard(page);
    const btn = card.locator('button');

    await btn.click();

    await expect(btn).toHaveText('Subscribing...', { timeout: 1000 });
    await expect(btn).toBeDisabled();

    await expect(btn).toHaveText('Subscribed', { timeout: 5000 });
});

test('TC-E-016: Subscribed button is disabled — cannot subscribe twice', async ({ page }) => {
    const card = await searchAndGetFirstResultCard(page);
    const btn = card.locator('button');

    await btn.click();
    await expect(btn).toHaveText('Subscribed', { timeout: 5000 });
    await expect(btn).toBeDisabled();

    // Force-clicking a disabled button must not trigger a second subscription
    await btn.click({ force: true });
    await page.waitForTimeout(300);

    await expect(page.locator('#subscriptionList .song-card')).toHaveCount(1);
});
