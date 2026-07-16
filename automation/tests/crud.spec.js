// @ts-check
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { StudentsPage } = require('../pages/StudentsPage');

test.describe('Students CRUD flow', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs('Test Runner');
    await page.goto('/students.html');
  });

  test('creates, edits, refreshes, and deletes a student', async ({ page }) => {
    const studentsPage = new StudentsPage(page);
    const uniqueName = `Playwright Student ${Date.now()}`;

    // Create
    await studentsPage.addStudent({ name: uniqueName, email: 'student@example.com', age: 21 });
    // The UI sets a final "Loaded" status after refreshing the list, so accept either.
    await expect(studentsPage.statusMessage).toContainText(/Added|Loaded/);
    await expect(studentsPage.rowFor(uniqueName)).toBeVisible();

    // Edit
    const updatedName = `${uniqueName} (Updated)`;
    await studentsPage.editStudent(uniqueName, { name: updatedName, age: 22 });
    // Accept either the immediate "Updated" status or the subsequent "Loaded" message.
    await expect(studentsPage.statusMessage).toContainText(/Updated|Loaded/);
    await expect(studentsPage.rowFor(updatedName)).toBeVisible();
    await expect(studentsPage.rowFor(updatedName)).toContainText('22');

    // Refresh
    await studentsPage.refreshBtn.click();
    await expect(studentsPage.statusMessage).toContainText('Loaded');
    await expect(studentsPage.rowFor(updatedName)).toBeVisible();

    // Delete
    await studentsPage.deleteStudent(updatedName);
    // Deletion triggers a list refresh, which may replace the "Deleted" message.
    await expect(studentsPage.statusMessage).toContainText(/Deleted|Loaded/);
    await expect(studentsPage.rowFor(updatedName)).toHaveCount(0);
  });

  test('shows a required-field message when name is missing', async ({ page }) => {
    const studentsPage = new StudentsPage(page);
    await studentsPage.saveBtn.click();
    await expect(studentsPage.statusMessage).toContainText('Name is required');
  });
});
