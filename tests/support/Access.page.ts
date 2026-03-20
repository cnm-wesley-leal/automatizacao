import { Page, expect, Locator } from '@playwright/test';
import { createUserFake } from '../test-data/fakerUser';
import { landingHome } from './Landing.page';

export async function logingUserTest(page: Page){
    await landingHome(page);
  
    await page.getByRole('link', { name: 'Entrar' }).click();
    await page.getByRole('button', { name: 'Entrar com email' }).click();
    await page.getByPlaceholder('Email cadastrado').click();
    await page.getByPlaceholder('Email cadastrado').fill(process.env.USER_EMAIL!);  
    await page.getByPlaceholder('Senha cadastrada').click();
    await page.getByPlaceholder('Senha cadastrada').fill(process.env.USER_PASSWORD!);  
    const btnEntrar = page.locator('button.style_LabelButton__sXl6w', { hasText: 'Entrar' }).last();
    await btnEntrar.click();
    await expect(btnEntrar).toHaveAttribute('aria-busy', 'false');}

export async function createUser(page: Page){
    const user = createUserFake()

    await landingHome(page);

    await page.getByRole('link', { name: 'Entrar' }).click();
    await page.getByRole('link', { name: 'Cadastre-se aqui' }).click();
    await page.getByRole('textbox', { name: 'Nome completo' }).fill(user.fullName);
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Telefone/whatsapp' }).fill(user.phone);  
    await page.getByRole('textbox', { name: 'Senha', exact: true }).fill(user.password);
    await page.getByRole('textbox', { name: 'Repetir senha' }).fill(user.password);
    await page.getByRole('button', { name: 'Criar conta' }).click({timeout:30000});

}


export class LoginPage {
  readonly page: Page;
  readonly linkEntrar: Locator;
  readonly btnEntrarComEmail: Locator;
  readonly inputEmail: Locator;
  readonly inputSenha: Locator;
  readonly btnSubmit: Locator;

  constructor(page: Page) {
    this.page = page;
    this.linkEntrar = page.getByRole('link', { name: 'Entrar' });
    this.btnEntrarComEmail = page.getByRole('button', { name: 'Entrar com email' });
    this.inputEmail = page.getByPlaceholder('Email cadastrado');
    this.inputSenha = page.getByPlaceholder('Senha cadastrada');

    // Seletor mais resiliente: filtra pelo texto sem depender de classe gerada
    this.btnSubmit = page
    .getByRole('button', { name: 'Entrar' })
    .filter({ hasNot: page.getByText('com email') });
  }

  async goto() {
    await this.page.goto(process.env.BASE_URL!);
  }

  async login(email: string, password: string) {
    await this.linkEntrar.click();
    await this.btnEntrarComEmail.click();
    await this.inputEmail.fill(email);
    await this.inputSenha.fill(password);
    await this.btnSubmit.click();
  }
}