// @ts-check

class StudentsPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.nameInput = page.locator('#studentName');
    this.emailInput = page.locator('#studentEmail');
    this.ageInput = page.locator('#studentAge');
    this.saveBtn = page.locator('#saveBtn');
    this.cancelEditBtn = page.locator('#cancelEditBtn');
    this.refreshBtn = page.locator('#refreshBtn');
    this.statusMessage = page.locator('#statusMessage');
    this.tableBody = page.locator('#studentsTableBody');
  }

  async goto() {
    await this.page.goto('/students.html');
  }

  async addStudent({ name, email = '', age = '' }) {
    await this.nameInput.fill(name);
    if (email) await this.emailInput.fill(email);
    if (age !== '') await this.ageInput.fill(String(age));
    await this.saveBtn.click();
  }

  rowFor(name) {
    return this.tableBody.locator('tr', { hasText: name });
  }

  async editStudent(name, updates) {
    const row = this.rowFor(name);
    await row.locator('.edit-btn').click();
    if (updates.name !== undefined) {
      await this.nameInput.fill(updates.name);
    }
    if (updates.email !== undefined) {
      await this.emailInput.fill(updates.email);
    }
    if (updates.age !== undefined) {
      await this.ageInput.fill(String(updates.age));
    }
    await this.saveBtn.click();
  }

  async deleteStudent(name) {
    this.page.once('dialog', (dialog) => dialog.accept());
    const row = this.rowFor(name);
    await row.locator('.delete-btn').click();
  }
}

module.exports = { StudentsPage };
