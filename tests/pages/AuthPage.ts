import { expect, type Page } from '@playwright/test';

export class AuthPage {
  constructor(private readonly page: Page) {}

  async openLogin() {
    await this.page.getByRole('link', { name: 'Entrar' }).click();
  }

  async chooseEmailLogin() {
    await this.page.getByRole('button', { name: 'Entrar com email' }).click();
  }

  async loginWithEmail(email: string, password: string) {
    await this.openLogin();
    await this.chooseEmailLogin();
    await this.page.getByPlaceholder('Email cadastrado').fill(email);
    await this.page.getByPlaceholder('Senha cadastrada').fill(password);
    await this.page.getByRole('button', { name: 'Entrar' }).click();
  }

  async openCreateAccount() {
    await this.openLogin();
    await this.page.getByRole('link', { name: 'Cadastre-se aqui' }).click();
  }

  async createAccount(data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) {
    await this.openCreateAccount();

    await this.page.getByRole('textbox', { name: 'Nome completo' }).fill(data.fullName);
    await this.page.getByRole('textbox', { name: 'Email' }).fill(data.email);
    await this.page.getByRole('textbox', { name: 'Telefone/whatsapp' }).fill(data.phone);
    await this.page.getByRole('textbox', { name: 'Senha', exact: true }).fill(data.password);
    await this.page.getByRole('textbox', { name: 'Repetir senha' }).fill(data.password);

    await this.page.getByRole('button', { name: 'Criar conta' }).click();
  }

  async expectLoggedIn() {
    await expect(this.page.locator('#avatar-container')).toBeVisible();
  }
}
