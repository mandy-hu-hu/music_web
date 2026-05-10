const { test, expect } = require('@playwright/test');
const { SEED_SONGS, blockCDN, mockRoutes, gotoMain } = require('./helpers');

test.beforeEach(async ({ page }) => {
    await blockCDN(page);
    await mockRoutes(page);
    await gotoMain(page);
    // Wait for subscriptions to load
    await page.waitForTimeout(300);
});

test('TC-E-009: search by artist shows matching song cards', async ({ page }) => {
    await page.fill('#qArtist', 'Taylor Swift');
    await page.click('#queryForm button[type="submit"]');

    await page.waitForSelector('.song-card', { timeout: 5000 });

    const cards = page.locator('.song-card');
    await expect(cards).toHaveCount(SEED_SONGS.length);

    const firstArtist = await cards.first().locator('.song-artist').textContent();
    expect(firstArtist).toBe('Taylor Swift');
});

test('TC-E-010: search with no results shows empty message', async ({ page }) => {
    // Override music route to return empty
    await page.route('**/music**', route =>
        route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({ ok: true, data: { items: [], count: 0 } }),
        })
    );

    await page.fill('#qArtist', 'XYZ Nonexistent');
    await page.click('#queryForm button[type="submit"]');
    await page.waitForTimeout(300);

    await expect(page.locator('#queryResults')).toContainText(
        'No result is retrieved. Please query again'
    );
});

test('TC-E-011: submitting empty query form shows error (no client-side guard)', async ({ page }) => {
    // Override music route to simulate backend 400
    await page.route('**/music**', route =>
        route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({ ok: false, error: 'At least one query field is required' }),
        })
    );

    await page.click('#queryForm button[type="submit"]');
    await page.waitForTimeout(300);

    await expect(page.locator('#queryError')).toHaveText(
        'At least one query field is required'
    );
});

test('TC-E-012: each result card has a Subscribe or Subscribed button', async ({ page }) => {
    await page.fill('#qTitle', 'Love Story');
    await page.click('#queryForm button[type="submit"]');

    await page.waitForSelector('.song-card', { timeout: 5000 });

    const buttons = page.locator('.song-card button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
        const text = await buttons.nth(i).textContent();
        expect(['Subscribe', 'Subscribed']).toContain(text);
    }
});

test('TC-E-013: already-subscribed song shows disabled Subscribed button in results', async ({ page }) => {
    // Start with Love Story already subscribed
    await page.route('**/subscriptions**', route => {
        if (route.request().method() === 'GET') {
            route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify({
                    ok: true,
                    data: { items: [SEED_SONGS[0]] }, // Love Story
                }),
            });
        } else {
            route.continue();
        }
    });

    await page.reload();
    await page.waitForTimeout(300);

    await page.fill('#qTitle', 'Love Story');
    await page.click('#queryForm button[type="submit"]');
    await page.waitForSelector('.song-card', { timeout: 5000 });

    const btn = page.locator('.song-card .btn-add').first();
    await expect(btn).toHaveText('Subscribed');
    await expect(btn).toBeDisabled();
});
