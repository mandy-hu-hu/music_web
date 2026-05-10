const { test, expect } = require('@playwright/test');
const { API, blockCDN, mockRoutes } = require('./helpers');

test.beforeEach(async ({ page }) => {
    await blockCDN(page);
});

test('TC-E-001: successful registration shows alert and switches to login view', async ({ page }) => {
    await mockRoutes(page);
    await page.goto('/index.html');
    await page.click('.btnLogin-popup');
    await page.click('.register-link');

    await page.fill('#registerUsername', 'E2EUser');
    await page.fill('#registerEmail', 'e2e@test.com');
    await page.fill('#registerPassword', 'password123');

    page.once('dialog', dialog => dialog.accept());

    await Promise.all([
        page.waitForResponse(`${API}/register`),
        page.click('#registerForm button[type="submit"]'),
    ]);
    await page.waitForTimeout(200);

    const hasActive = await page.evaluate(() =>
        document.querySelector('.wrapper').classList.contains('active')
    );
    expect(hasActive).toBe(false);
});

test('TC-E-002: duplicate email shows error in #registerError', async ({ page }) => {
    await mockRoutes(page, {
        registerResponse: { ok: false, error: 'The email already exists' },
    });

    await page.goto('/index.html');
    await page.click('.btnLogin-popup');
    await page.click('.register-link');

    await page.fill('#registerUsername', 'AnyUser');
    await page.fill('#registerEmail', 'existing@test.com');
    await page.fill('#registerPassword', 'password123');

    await Promise.all([
        page.waitForResponse(`${API}/register`),
        page.click('#registerForm button[type="submit"]'),
    ]);

    await expect(page.locator('#registerError')).toHaveText('The email already exists', { timeout: 3000 });
});

test('TC-E-003: empty required fields block submission (HTML5 validation)', async ({ page }) => {
    await mockRoutes(page);
    await page.goto('/index.html');
    await page.click('.btnLogin-popup');
    await page.click('.register-link');

    const fetchCalled = [];
    await page.route(`${API}/register`, route => {
        fetchCalled.push(true);
        route.continue();
    });

    await page.evaluate(() =>
        document.querySelector('#registerForm button[type="submit"]').click()
    );
    await page.waitForTimeout(200);

    expect(fetchCalled).toHaveLength(0);
});
