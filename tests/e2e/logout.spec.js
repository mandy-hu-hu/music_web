const { test, expect } = require('@playwright/test');
const { blockCDN, mockRoutes, gotoMain } = require('./helpers');

test.beforeEach(async ({ page }) => {
    await blockCDN(page);
    await mockRoutes(page);
    await gotoMain(page);
    await page.waitForTimeout(300);
});

test('TC-E-020: clicking Logout redirects to index.html?showLogin=true', async ({ page }) => {
    await page.click('#btnLogout');
    await page.waitForURL(/index\.html\?showLogin=true/, { timeout: 5000 });
    await expect(page).toHaveURL(/index\.html\?showLogin=true/);
});

test('TC-E-020b: login modal auto-opens after logout redirect', async ({ page }) => {
    await page.click('#btnLogout');
    await page.waitForURL(/showLogin=true/, { timeout: 5000 });
    await page.waitForLoadState('domcontentloaded');

    const hasPopup = await page.evaluate(() =>
        document.querySelector('.wrapper').classList.contains('active-popup')
    );
    expect(hasPopup).toBe(true);
});

test('TC-E-021: sessionStorage is cleared after logout', async ({ page }) => {
    await page.click('#btnLogout');
    await page.waitForURL(/showLogin=true/, { timeout: 5000 });

    const email = await page.evaluate(() => sessionStorage.getItem('loggedInEmail'));
    const username = await page.evaluate(() => sessionStorage.getItem('loggedInUsername'));
    expect(email).toBeNull();
    expect(username).toBeNull();
});

test('TC-E-022: navigating to main.html after logout re-triggers auth guard', async ({ page }) => {
    await page.click('#btnLogout');
    await page.waitForURL(/showLogin=true/, { timeout: 5000 });

    await page.goto('/main.html');
    await page.waitForURL(/index\.html/, { timeout: 5000 });
    await expect(page).toHaveURL(/index\.html/);
});
