import { Page, expect } from '@playwright/test';
import { TEST_DATA } from '../utils/test-data';

/**
 * Page Object Model para o formulário de Cadastro/Registro
 * Encapsula todas as ações relacionadas ao registro de novos usuários
 */
export class RegisterPage {
  constructor(private page: Page) {}

  /**
   * Navega até o formulário de cadastro via fluxo de login
   */
  async navigateToRegisterForm() {
    // Clica no link de entrada
    await this.page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink }).click();
    
    // Aguarda modal de autenticação
    await expect(
      this.page.getByRole('heading', { name: /acesse ou crie sua conta/i })
    ).toBeVisible();

    // Clica em "Cadastre-se aqui"
    await expect(
      this.page.getByRole('link', { name: TEST_DATA.locators.login.cadastreSeLink })
    ).toBeVisible();
    await this.page.getByRole('link', { name: TEST_DATA.locators.login.cadastreSeLink }).click();

    // Aguarda carregamento do formulário de cadastro
    await this.assertFormFieldsVisible();
  }

  /**
   * Valida que todos os campos obrigatórios do formulário estão visíveis
   */
  async assertFormFieldsVisible() {
    await expect(
      this.page.getByRole('textbox', { name: TEST_DATA.locators.registration.fullNameInput })
    ).toBeVisible();
    await expect(
      this.page.getByRole('textbox', { name: TEST_DATA.locators.registration.emailInput })
    ).toBeVisible();
    await expect(
      this.page.getByRole('textbox', { name: TEST_DATA.locators.registration.phoneInput })
    ).toBeVisible();
    await expect(
      this.page.getByRole('textbox', { name: TEST_DATA.locators.registration.passwordInput, exact: true })
    ).toBeVisible();
    await expect(
      this.page.getByRole('textbox', { name: TEST_DATA.locators.registration.repeatPasswordInput })
    ).toBeVisible();
    await expect(
      this.page.getByRole('button', { name: TEST_DATA.locators.login.criarContaBtn })
    ).toBeVisible();
  }

  /**
   * Preenche o formulário de cadastro com os dados fornecidos
   */
  async fillRegistrationForm(data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) {
    // Preenche Nome Completo
    await this.page
      .getByRole('textbox', { name: TEST_DATA.locators.registration.fullNameInput })
      .fill(data.fullName);

    // Preenche Email
    await this.page
      .getByRole('textbox', { name: TEST_DATA.locators.registration.emailInput })
      .fill(data.email);

    // Preenche Telefone
    await this.page
      .getByRole('textbox', { name: TEST_DATA.locators.registration.phoneInput })
      .fill(data.phone);

    // Preenche Senha
    await this.page
      .getByRole('textbox', { name: TEST_DATA.locators.registration.passwordInput, exact: true })
      .fill(data.password);

    // Preenche Repetir Senha
    await this.page
      .getByRole('textbox', { name: TEST_DATA.locators.registration.repeatPasswordInput })
      .fill(data.password);
  }

  /**
   * Clica no botão "Criar Conta"
   */
  async submitRegistration() {
    await this.page
      .getByRole('button', { name: TEST_DATA.locators.login.criarContaBtn })
      .click();
  }

  /**
   * Valida que a mensagem de email já cadastrado é exibida
   */
  async assertEmailAlreadyRegisteredError() {
    await expect(
      this.page.getByText(/email j[aá] cadastrado|email j[aá] est[aá] em uso|este email j[aá]/i)
    ).toBeVisible();
  }

  /**
   * Valida que a mensagem de senhas não coincidentes é exibida
   */
  async assertPasswordsDoNotMatchError() {
    await expect(
      this.page.getByText(/senhas n[aã]o coincidem|as senhas n[aã]o s[aã]o iguais|senha n[aã]o/i)
    ).toBeVisible();
  }

  /**
   * Valida que a mensagem de senha fraca é exibida
   */
  async assertWeakPasswordError() {
    await expect(
      this.page.getByText(/senha fraca|senha [aá] fraca|senha deve|requisitos de senha/i)
    ).toBeVisible();
  }

  /**
   * Valida que a mensagem de email inválido é exibida
   */
  async assertInvalidEmailError() {
    await expect(
      this.page.getByText(/email inv[aá]lido|formato de email|email deve/i)
    ).toBeVisible();
  }

  /**
   * Valida que o usuário foi redirecionado para o dashboard/perfil após cadastro bem-sucedido
   */
  async assertSuccessfulRegistration(userEmail: string) {
    // Aguarda redirecionamento e validação de autenticação
    await expect(
      this.page.getByText(userEmail)
    ).toBeVisible({ timeout: 20000 });

    // Valida que o link de "Entrar" desaparece (indicador de autenticação)
    await expect(
      this.page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })
    ).toBeHidden();

    // Valida que os cookies de autenticação foram criados
    const cookies = await this.page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === TEST_DATA.auth.cookies.sessionId);
    const authCookie = cookies.find(c => c.name === TEST_DATA.auth.cookies.accountInfo);

    if (!sessionCookie || !authCookie) {
      throw new Error('Cookies de autenticação não foram criados após registro bem-sucedido');
    }
  }

  /**
   * Valida que o usuário permanece no formulário de cadastro (não autenticado)
   */
  async assertStillOnRegistrationForm() {
    await expect(
      this.page.getByRole('button', { name: TEST_DATA.locators.login.criarContaBtn })
    ).toBeVisible();
  }

  /**
   * Obtém o valor de um campo do formulário
   */
  async getFieldValue(fieldName: string): Promise<string> {
    const field = this.page.getByRole('textbox', { name: fieldName });
    return await field.inputValue();
  }

  /**
   * Limpa um campo do formulário
   */
  async clearField(fieldName: string) {
    await this.page
      .getByRole('textbox', { name: fieldName })
      .clear();
  }
}
