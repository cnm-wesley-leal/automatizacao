import { expect, type Page } from '@playwright/test';

export class LandingPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto(process.env.BASE_URL!);
  }

  async expectLoaded() {
    await expect(this.page).toHaveTitle(/.*/, { timeout: 5000 });
  }

  async clickChavesNaMao() {
    await this.page.getByRole('link', { name: 'Chaves na Mão' }).click();
  }

  async expectOnChavesNaMao() {
    await expect(this.page).toHaveURL(/chavesnamao/);
  }
}
