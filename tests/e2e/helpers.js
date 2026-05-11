/**
 * Shared helpers and seed data for E2E tests.
 * All API calls are intercepted via page.route() — no real backend needed.
 */

// Must match the ACTIVE_BACKEND URL hardcoded in frontend JS files.
const API = 'http://music-alb-1834554723.us-east-1.elb.amazonaws.com';

const SEED_SONGS = [
    {
        title: 'Love Story', artist: 'Taylor Swift', year: '2008',
        album: 'Fearless', song_id: 'Love Story#2008#Fearless',
        img_url: '', image_key: 'TaylorSwift.jpg',
    },
    {
        title: '#41', artist: 'Dave Matthews', year: '1999',
        album: 'Listener Supported', song_id: '#41#1999#Listener Supported',
        img_url: '', image_key: 'DaveMatthews.jpg',
    },
];

const ALICE = { email: 'alice@test.com', user_name: 'Alice' };

async function blockCDN(page) {
    await page.route('https://unpkg.com/**', route => route.abort());
}

/**
 * Mock all API endpoints.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} opts
 * @param {object[]} opts.subscriptions   initial GET /subscriptions items
 * @param {object}  opts.loginResponse
 * @param {object}  opts.registerResponse
 * @param {object[]} opts.musicItems
 */
async function mockRoutes(page, opts = {}) {
    const {
        subscriptions = [],
        loginResponse = { ok: true, data: ALICE },
        registerResponse = { ok: true, data: { message: 'User registered successfully', email: 'new@test.com' } },
        musicItems = SEED_SONGS,
    } = opts;

    await page.route(`${API}/login`, route =>
        route.fulfill({ contentType: 'application/json', body: JSON.stringify(loginResponse) })
    );

    await page.route(`${API}/register`, route =>
        route.fulfill({ contentType: 'application/json', body: JSON.stringify(registerResponse) })
    );

    await page.route(`${API}/music**`, route =>
        route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({ ok: true, data: { items: musicItems, count: musicItems.length } }),
        })
    );

    let currentSubs = [...subscriptions];

    await page.route(`${API}/subscriptions**`, async route => {
        const method = route.request().method();

        if (method === 'GET') {
            await route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify({ ok: true, data: { items: currentSubs } }),
            });
        } else if (method === 'POST') {
            const body = JSON.parse(route.request().postData() || '{}');
            const song = body.song || {};
            currentSubs.push(song);
            await route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify({ ok: true, data: { message: 'Subscription added', item: song } }),
            });
        } else if (method === 'DELETE') {
            const body = JSON.parse(route.request().postData() || '{}');
            currentSubs = currentSubs.filter(s => s.song_id !== body.song_id);
            await route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify({ ok: true, data: { message: 'Subscription removed' } }),
            });
        } else {
            await route.continue();
        }
    });
}

async function gotoMain(page, user = ALICE) {
    // Use a flag so the init script only fires once: after logout the flag persists
    // but the email/username are gone, preventing re-injection on subsequent navigations.
    await page.addInitScript(u => {
        if (!sessionStorage.getItem('__session_initialized__')) {
            sessionStorage.setItem('__session_initialized__', '1');
            sessionStorage.setItem('loggedInEmail', u.email);
            sessionStorage.setItem('loggedInUsername', u.user_name);
        }
    }, user);
    await page.goto('/main.html');
    await page.waitForLoadState('domcontentloaded');
}

async function loginViaUI(page) {
    await page.goto('/index.html');
    await page.click('.btnLogin-popup');
    await page.fill('#loginEmail', ALICE.email);
    await page.fill('#loginPassword', 'pass123');

    const navPromise = page.waitForURL('**/main.html', { timeout: 10000 });
    await page.click('#loginForm button[type="submit"]');
    await navPromise;
    await page.waitForLoadState('domcontentloaded');
}

module.exports = { API, SEED_SONGS, ALICE, blockCDN, mockRoutes, gotoMain, loginViaUI };
