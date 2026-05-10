const { test, expect } = require('@playwright/test');
const { API, SEED_SONGS, blockCDN } = require('./helpers');

/**
 * TC-E-023: Complete end-to-end journey.
 * Register → Login → Search → Subscribe → Unsubscribe → Logout
 */
test('TC-E-023: full user journey completes without errors', async ({ page }) => {
    await blockCDN(page);

    let subs = [];

    await page.route(`${API}/register`, route =>
        route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({ ok: true, data: { message: 'User registered successfully', email: 'flow@test.com' } }),
        })
    );

    await page.route(`${API}/login`, route =>
        route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({ ok: true, data: { email: 'flow@test.com', user_name: 'FlowUser' } }),
        })
    );

    await page.route(`${API}/music**`, route =>
        route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({ ok: true, data: { items: SEED_SONGS, count: SEED_SONGS.length } }),
        })
    );

    await page.route(`${API}/subscriptions**`, async route => {
        const method = route.request().method();
        if (method === 'GET') {
            await route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify({ ok: true, data: { items: subs } }),
            });
        } else if (method === 'POST') {
            const body = JSON.parse(route.request().postData() || '{}');
            subs.push(body.song || {});
            await route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify({ ok: true, data: { message: 'Subscription added' } }),
            });
        } else if (method === 'DELETE') {
            const body = JSON.parse(route.request().postData() || '{}');
            subs = subs.filter(s => s.song_id !== body.song_id);
            await route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify({ ok: true, data: { message: 'Subscription removed' } }),
            });
        } else {
            await route.continue();
        }
    });

    // ── Step 1: Navigate to landing page ─────────────────────────────────────
    await page.goto('/index.html');
    await page.click('.btnLogin-popup');

    // ── Step 2: Register ──────────────────────────────────────────────────────
    await page.click('.register-link');
    await page.fill('#registerUsername', 'FlowUser');
    await page.fill('#registerEmail', 'flow@test.com');
    await page.fill('#registerPassword', 'flowpass');

    page.once('dialog', dialog => dialog.accept());
    await Promise.all([
        page.waitForResponse(`${API}/register`),
        page.click('#registerForm button[type="submit"]'),
    ]);
    await page.waitForTimeout(200);

    const isRegister = await page.evaluate(() =>
        document.querySelector('.wrapper').classList.contains('active')
    );
    expect(isRegister).toBe(false);

    // ── Step 3: Login ─────────────────────────────────────────────────────────
    await page.fill('#loginEmail', 'flow@test.com');
    await page.fill('#loginPassword', 'flowpass');

    await Promise.all([
        page.waitForURL('**/main.html', { timeout: 10000 }),
        page.click('#loginForm button[type="submit"]'),
    ]);

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(300);

    await expect(page.locator('#displayUsername')).toHaveText('FlowUser');

    // ── Step 4: Search ────────────────────────────────────────────────────────
    await page.fill('#qArtist', 'Taylor Swift');
    await page.click('#queryForm button[type="submit"]');
    await page.waitForSelector('#queryResults .song-card', { timeout: 5000 });

    // ── Step 5: Subscribe ─────────────────────────────────────────────────────
    const firstResultBtn = page.locator('#queryResults .song-card').first().locator('button');
    await firstResultBtn.click();
    await expect(firstResultBtn).toHaveText('Subscribed', { timeout: 5000 });

    await expect(page.locator('#subscriptionList .song-card')).toHaveCount(1, { timeout: 5000 });

    // ── Step 6: Unsubscribe ───────────────────────────────────────────────────
    await page.locator('#subscriptionList .btn-remove').click();
    await expect(page.locator('#subscriptionList')).toContainText('No subscriptions yet.', {
        timeout: 5000,
    });

    // ── Step 7: Logout ────────────────────────────────────────────────────────
    await page.click('#btnLogout');
    await page.waitForURL(/index\.html/, { timeout: 5000 });
    await expect(page).toHaveURL(/index\.html/);

    const email = await page.evaluate(() => sessionStorage.getItem('loggedInEmail'));
    expect(email).toBeNull();
});
