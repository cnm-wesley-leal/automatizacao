import { test, expect } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';
import { createUserFake } from '../fixtures/fakerUser';
import { TEST_DATA } from '../utils/test-data';

const env = ((globalThis as any).process?.env ?? {}) as Record<string, string | undefined>;
const isCI = Boolean(env.CI);

async function assertAuthenticatedCookies(page: import('@playwright/test').Page) {
  await expect
    .poll(
      async () => {
        const cookies = await page.context().cookies();
        const hasSession = cookies.some(
          cookie => cookie.name === TEST_DATA.auth.cookies.sessionId && Boolean(cookie.value)
        );
        const hasAccount = cookies.some(
          cookie => cookie.name === TEST_DATA.auth.cookies.accountInfo && Boolean(cookie.value)
        );
        return hasSession && hasAccount;
      },
      {
        timeout: isCI ? 20000 : 10000,
        message: 'Cookies de autenticacao nao foram criados no fluxo esperado.'
      }
    )
    .toBeTruthy();
}

async function assertNoAuthenticatedCookies(page: import('@playwright/test').Page) {
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name === TEST_DATA.auth.cookies.sessionId);
  const authCookie = cookies.find(c => c.name === TEST_DATA.auth.cookies.accountInfo);
  expect(sessionCookie).toBeUndefined();
  expect(authCookie).toBeUndefined();
}

test.describe('Feature Auth - Cadastro de Usuários', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto(TEST_DATA.urls.base);

    // Dismiss cookie consent se presente
    const consentButton = page.getByRole('button', { name: TEST_DATA.locators.common.cookieConsent });
    try {
      await expect(consentButton).toBeVisible({ timeout: 5000 });
      await consentButton.click();
    } catch (error) {
      testInfo.annotations.push({
        type: 'info',
        description: `Cookie consent não exibido: ${String(error)}`
      });
    }

    // Initial state checkpoint: link de "Entrar" deve estar visível
    await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeVisible();
  });

  test('CT11 - deve realizar cadastro com dados válidos (email novo)', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const newUser = createUserFake();

    // Step 1: Navegar até o formulário de cadastro
    await registerPage.navigateToRegisterForm();

    // Step 2: Validar que o formulário está completo
    await registerPage.assertFormFieldsVisible();

    // Step 3: Preencher o formulário com dados válidos
    await registerPage.fillRegistrationForm({
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      password: newUser.password,
    });

    // Step 4: Submeter o formulário
    await registerPage.submitRegistration();

    // Step 5: Validar que o registro foi bem-sucedido
    // Aguarda redirecionamento e verificação de autenticação com polling
    await assertAuthenticatedCookies(page);

    // Step 6: Validar que o link de "Entrar" desaparece (indicador de autenticação)
    await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeHidden();

    // Step 7: Validar que a página mudou (pós-cadastro)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
  });

  test('CT12 - deve exibir erro ao tentar cadastro com email duplicado', async ({ page }) => {
    test.skip(
      !env.USER_EMAIL_WEBUSER,
      'Defina USER_EMAIL_WEBUSER para executar CT12.'
    );

    const registerPage = new RegisterPage(page);
    const fakeUser = createUserFake();

    // Step 1: Navegar até o formulário de cadastro
    await registerPage.navigateToRegisterForm();

    // Step 2: Preencher o formulário com email já cadastrado
    await registerPage.fillRegistrationForm({
      fullName: fakeUser.fullName,
      email: env.USER_EMAIL_WEBUSER!, // Email já existe no staging
      phone: fakeUser.phone,
      password: fakeUser.password,
    });

    // Step 3: Submeter o formulário
    await registerPage.submitRegistration();

    // Step 4: Validar que a mensagem de erro foi exibida
    await registerPage.assertEmailAlreadyRegisteredError();

    // Step 5: Validar que o usuário ainda está no formulário (não autenticado)
    await registerPage.assertStillOnRegistrationForm();

    // Step 6: Validar que nenhum cookie de autenticação foi criado
    await assertNoAuthenticatedCookies(page);
  });

  test('CT13 - deve validar força de senha durante o cadastro', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const fakeUser = createUserFake();

    // Step 1: Navegar até o formulário de cadastro
    await registerPage.navigateToRegisterForm();

    // Step 2: Tentar preencher com senha fraca
    const weakPassword = '123'; // Muito fraca
    await registerPage.fillRegistrationForm({
      fullName: fakeUser.fullName,
      email: fakeUser.email,
      phone: fakeUser.phone,
      password: weakPassword,
    });

    // Step 3: Submeter o formulário
    await registerPage.submitRegistration();

    // Step 4: Validar que o cadastro nao concluiu com senha fraca.
    const weakPasswordError = page.getByText(/senha fraca|senha [aá] fraca|senha deve|requisitos de senha/i);
    const buttonDisabled = await page.getByRole('button', { name: TEST_DATA.locators.login.criarContaBtn }).isDisabled();

    const hasError = await weakPasswordError.isVisible().catch(() => false);
    expect(hasError || buttonDisabled).toBe(true);
    await assertNoAuthenticatedCookies(page);
  });

  test('CT14 - deve validar senhas não coincidentes', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const fakeUser = createUserFake();

    // Step 1: Navegar até o formulário de cadastro
    await registerPage.navigateToRegisterForm();

    // Step 2: Preencher dados base e sobrescrever confirmacao com senha diferente.
    await registerPage.fillRegistrationForm({
      fullName: fakeUser.fullName,
      email: fakeUser.email,
      phone: fakeUser.phone,
      password: fakeUser.password,
    });

    const differentPassword = `${fakeUser.password}Different`;
    await page
      .getByRole('textbox', { name: TEST_DATA.locators.registration.repeatPasswordInput })
      .fill(differentPassword);

    // Step 3: Tentar submeter o formulário
    const submitButton = page.getByRole('button', { name: TEST_DATA.locators.login.criarContaBtn });
    
    // Validar que o botao esta desabilitado OU mensagem de erro aparece.
    const isButtonDisabled = await submitButton.isDisabled();

    if (!isButtonDisabled) {
      await submitButton.click();

      const mismatchError = page.getByText(/senhas n[aã]o coincidem|as senhas n[aã]o s[aã]o iguais|senha n[aã]o/i);
      const hasError = await mismatchError.isVisible().catch(() => false);

      const stillOnForm = await submitButton.isVisible();

      expect(hasError || stillOnForm).toBe(true);
    } else {
      expect(isButtonDisabled).toBe(true);
    }
    await assertNoAuthenticatedCookies(page);
  });

  test('CT15 - deve validar formato de email inválido', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const fakeUser = createUserFake();

    // Step 1: Navegar até o formulário de cadastro
    await registerPage.navigateToRegisterForm();

    // Step 2: Tentar com alguns emails inválidos
    const invalidEmails = [
      'email_sem_arroba',
      'email@',
      '@example.com',
    ];

    for (const invalidEmail of invalidEmails) {
      await page
        .getByRole('textbox', { name: TEST_DATA.locators.registration.emailInput })
        .clear();
      await page
        .getByRole('textbox', { name: TEST_DATA.locators.registration.emailInput })
        .fill(invalidEmail);

      await page
        .getByRole('textbox', { name: TEST_DATA.locators.registration.fullNameInput })
        .fill(fakeUser.fullName);
      await page
        .getByRole('textbox', { name: TEST_DATA.locators.registration.phoneInput })
        .fill(fakeUser.phone);
      await page
        .getByRole('textbox', { name: TEST_DATA.locators.registration.passwordInput, exact: true })
        .fill(fakeUser.password);
      await page
        .getByRole('textbox', { name: TEST_DATA.locators.registration.repeatPasswordInput })
        .fill(fakeUser.password);

      await expect(page.getByText(/email inv[aá]lido/i)).toBeVisible();
    }
    await assertNoAuthenticatedCookies(page);
  });


  test('CT16 - deve validar consentimento de Termos de Serviço', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const fakeUser = createUserFake();

    // Step 1: Navegar até o formulário de cadastro
    await registerPage.navigateToRegisterForm();

    // Step 2: Tentar localizar checkbox de termos por semantica acessivel.
    const termsCheckbox = page
      .getByRole('checkbox', { name: /termos|privacidade|aceito/i })
      .or(page.getByLabel(/termos|privacidade|aceito/i))
      .first();

    const hasTermsCheckbox = (await termsCheckbox.count()) > 0;
    test.skip(!hasTermsCheckbox, 'Checkbox de termos não está disponível neste ambiente.');
    await expect(termsCheckbox).toBeVisible();

    // Step 3: Preencher formulario sem aceitar os termos.
    await registerPage.fillRegistrationForm({
      fullName: fakeUser.fullName,
      email: fakeUser.email,
      phone: fakeUser.phone,
      password: fakeUser.password,
    });

    await termsCheckbox.uncheck().catch(() => {});

    // Step 4: Tentar submeter.
    await registerPage.submitRegistration();

    // Step 5: Validar bloqueio por consentimento ausente.
    const isDisabled = await page.getByRole('button', { name: TEST_DATA.locators.login.criarContaBtn }).isDisabled();
    const hasError = await page.getByText(/termos|consentimento|aceitar/i).isVisible().catch(() => false);
    expect(isDisabled || hasError).toBe(true);
    await assertNoAuthenticatedCookies(page);
  });

  test('CT17 - deve permitir login social com novo registro automático', async ({ page }) => {
    test.skip(
      true,
      'CT17 requer integração com provedores reais. Use mock para ambiente de staging.'
    );

    // Este teste seria implementado com mocks reais de OAuth
    // Similar aos testes em Login.spec.ts (CT05-CT10)
    // mas validando o registro automático de novo usuário

    const registerPage = new RegisterPage(page);

    // Simularia:
    // 1. Clicar em "Entrar com Google" (sem conta prévia)
    // 2. Validar que a sessão foi criada
    // 3. Validar que o usuário foi criado automaticamente
    // 4. Validar que os dados do perfil foram pré-preenchidos
  });
});
