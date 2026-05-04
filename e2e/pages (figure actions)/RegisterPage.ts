import { Page, expect } from '@playwright/test';
import { createUserFake, User } from '../fixtures/fakerUser';
import { landingHome } from '../utils/helpers';
import { TEST_DATA } from '../utils/test-data';

export class RegisterPage {
  private readonly page: Page;
  public user: User;

  constructor(page: Page) {
    this.page = page;
    this.user = createUserFake();
  }

  async navigate() {
    await landingHome(this.page);
    await this.page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink }).click();
    await this.page.getByRole('link', { name: TEST_DATA.locators.login.cadastreSeLink }).click();
  }

  async fillForm(user: User = this.user) {
    await this.page.getByRole('textbox', { name: TEST_DATA.locators.registration.fullNameInput }).fill(user.fullName);
    await this.page.getByRole('textbox', { name: TEST_DATA.locators.registration.emailInput }).fill(user.email);
    await this.page.getByRole('textbox', { name: TEST_DATA.locators.registration.phoneInput }).fill(user.phone);
    await this.page.getByRole('textbox', { name: TEST_DATA.locators.registration.passwordInput, exact: true }).fill(user.password);
    await this.page.getByRole('textbox', { name: TEST_DATA.locators.registration.repeatPasswordInput }).fill(user.password);
  }

  async submit() {
    await this.page.getByRole('button', { name: TEST_DATA.locators.login.criarContaBtn }).click();
  }

  async registerUser(): Promise<User> {
    await this.navigate();
    await this.fillForm();
    await this.submit();
    await expect(this.page.getByText(this.user.email)).toBeVisible();
    return this.user;
  }
}
