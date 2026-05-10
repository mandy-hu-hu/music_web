const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/e2e',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
    },
    webServer: {
        command: 'npx serve frontend -p 3000 --no-clipboard',
        port: 3000,
        reuseExistingServer: !process.env.CI,
    },
    timeout: 30000,
});
