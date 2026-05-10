const { test, expect } = require('@playwright/test');
const { SEED_SONGS, blockCDN, mockRoutes, gotoMain } = require('./helpers');

test.beforeEach(async ({ page }) => {
    await blockCDN(page);
    // Start with Love Story already subscribed
    await mockRoutes(page, { subscriptions: [SEED_SONGS[0]] });
    await gotoMain(page);
    // Wait for subscription list to render
    await page.waitForSelector('#subscriptionList .song-card', { timeout: 5000 });
});

test('TC-E-017: clicking Remove removes the card from the subscription list', async ({ page }) => {
    await expect(page.locator('#subscriptionList .song-card')).toHaveCount(1);

    await page.locator('#subscriptionList .btn-remove').click();

    // After removal the list should show the empty message
    await expect(page.locator('#subscriptionList')).toContainText('No subscriptions yet.', {
        timeout: 5000,
    });
});

test('TC-E-018: after removal the search result button reverts to Subscribe (enabled)', async ({ page }) => {
    // First, run a search that returns Love Story
    await page.fill('#qTitle', 'Love Story');
    await page.click('#queryForm button[type="submit"]');
    await page.waitForSelector('#queryResults .song-card', { timeout: 5000 });

    // The result button should be "Subscribed" (disabled)
    const resultBtn = page.locator('#queryResults .song-card').first().locator('button');
    await expect(resultBtn).toHaveText('Subscribed');
    await expect(resultBtn).toBeDisabled();

    // Remove the subscription
    await page.locator('#subscriptionList .btn-remove').click();
    await page.waitForTimeout(600); // allow renderSubscriptions + form resubmit to finish

    // Query re-runs automatically after removal; button should be Subscribe (enabled)
    await expect(resultBtn).toHaveText('Subscribe', { timeout: 5000 });
    await expect(resultBtn).toBeEnabled();
});

test('TC-E-019: removing the last subscription shows "No subscriptions yet." placeholder', async ({ page }) => {
    await page.locator('#subscriptionList .btn-remove').click();

    await expect(page.locator('#subscriptionList .empty-msg')).toHaveText(
        'No subscriptions yet.',
        { timeout: 5000 }
    );
});
