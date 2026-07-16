// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration for the Student Management System.
 * Tests assume the backend server is already running on http://localhost:3000
 * (see backend/server.js -> `npm start`).
 */
module.exports = defineConfig({
  testDir: './automation/tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
