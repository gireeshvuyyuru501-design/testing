// @ts-check
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { DashboardPage } = require('../pages/DashboardPage');

test.describe('Login flow', () => {
  test('logs in with a valid name and reaches the dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.loginAs('Ada Lovelace');

    await expect(page).toHaveURL(/dashboard\.html$/);
    await expect(dashboardPage.welcomeHeading).toHaveText('Welcome, Ada Lovelace');

    const storedUser = await page.evaluate(() => localStorage.getItem('studentSystemUser'));
    expect(storedUser).toBe('Ada Lovelace');
  });

  test('does not navigate when name is empty', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.continueBtn.click();

    await expect(page).toHaveURL(/\/$/);
    await expect(loginPage.statusMessage).toContainText('enter a name');
  });
});
