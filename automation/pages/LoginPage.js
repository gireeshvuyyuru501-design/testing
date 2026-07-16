// @ts-check

class LoginPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.nameInput = page.locator('#nameInput');
    this.continueBtn = page.locator('#continueBtn');
    this.statusMessage = page.locator('#statusMessage');
  }

  async goto() {
    await this.page.goto('/');
  }

  async loginAs(name) {
    await this.nameInput.fill(name);
    await this.continueBtn.click();
  }
}

module.exports = { LoginPage };
