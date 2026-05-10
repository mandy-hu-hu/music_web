const { test, expect } = require('@playwright/test');
const { API, ALICE, blockCDN, mockRoutes } = require('./helpers');

test.beforeEach(async ({ page }) => {
    await blockCDN(page);
});

test('TC-E-004: successful login redirects to main.html and shows user info', async ({ page }) => {
    await mockRoutes(page);
    await page.goto('/index.html');
    await page.click('.btnLogin-popup');

    await page.fill('#loginEmail', ALICE.email);
    await page.fill('#loginPassword', 'pass123');

    await Promise.all([
        page.waitForURL('**/main.html', { timeout: 10000 }),
        page.click('#loginForm button[type="submit"]'),
    ]);

    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#displayEmail')).toHaveText(ALICE.email);
    await expect(page.locator('#displayUsername')).toHaveText(ALICE.user_name);
});

test('TC-E-005: wrong password shows error in #loginError', async ({ page }) => {
    await mockRoutes(page, {
        loginResponse: { ok: false, error: 'email or password is invalid' },
    });

    await page.goto('/index.html');
    await page.click('.btnLogin-popup');
    await page.fill('#loginEmail', ALICE.email);
    await page.fill('#loginPassword', 'wrongpass');

    await Promise.all([
        page.waitForResponse(`${API}/login`),
        page.click('#loginForm button[type="submit"]'),
    ]);

    await expect(page.locator('#loginError')).toHaveText('email or password is invalid', { timeout: 3000 });
    await expect(page).toHaveURL(/index\.html/);
});

test('TC-E-006: unknown email shows generic error', async ({ page }) => {
    await mockRoutes(page, {
        loginResponse: { ok: false, error: 'email or password is invalid' },
    });

    await page.goto('/index.html');
    await page.click('.btnLogin-popup');
    await page.fill('#loginEmail', 'nobody@test.com');
    await page.fill('#loginPassword', 'pass123');

    await Promise.all([
        page.waitForResponse(`${API}/login`),
        page.click('#loginForm button[type="submit"]'),
    ]);

    await expect(page.locator('#loginError')).toHaveText('email or password is invalid', { timeout: 3000 });
});

test('TC-E-007: navigating directly to main.html without session redirects to index.html', async ({ page }) => {
    await mockRoutes(page);
    await page.goto('/main.html');
    await page.waitForURL(/index\.html/, { timeout: 5000 });
    await expect(page).toHaveURL(/index\.html/);
});

test('TC-E-008: login modal auto-opens when URL has ?showLogin=true', async ({ page }) => {
    await mockRoutes(page);
    await page.goto('/index.html?showLogin=true');
    await page.waitForLoadState('domcontentloaded');

    const hasActivePopup = await page.evaluate(() =>
        document.querySelector('.wrapper').classList.contains('active-popup')
    );
    expect(hasActivePopup).toBe(true);
});
