// @ts-check
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { StudentsPage } = require('../pages/StudentsPage');

test.describe('Navigation flow', () => {
  test('moves from login -> dashboard -> students and back', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const studentsPage = new StudentsPage(page);

    await loginPage.goto();
    await loginPage.loginAs('Grace Hopper');

    await expect(dashboardPage.welcomeHeading).toHaveText('Welcome, Grace Hopper');

    await dashboardPage.goToStudents();
    await expect(page).toHaveURL(/students\.html$/);
    await expect(studentsPage.saveBtn).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/dashboard\.html$/);
  });

  test('logging out clears the stored user and redirects to login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.loginAs('Alan Turing');
    await dashboardPage.logoutBtn.click();

    // The app redirects to the explicit login page on logout.
    await expect(page).toHaveURL(/login\.html$/);
    const storedUser = await page.evaluate(() => localStorage.getItem('studentSystemUser'));
    expect(storedUser).toBeNull();
  });
});
