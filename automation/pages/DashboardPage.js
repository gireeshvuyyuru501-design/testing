// @ts-check

class DashboardPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.welcomeHeading = page.locator('#welcomeHeading');
    this.studentCount = page.locator('#studentCount');
    this.logoutBtn = page.locator('#logoutBtn');
    this.studentsLink = page.locator('a[href="students.html"]');
  }

  async goto() {
    await this.page.goto('/dashboard.html');
  }

  async goToStudents() {
    await this.studentsLink.click();
  }
}

module.exports = { DashboardPage };
