import { test, expect } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';
import { createUserFake } from '../fixtures/fakerUser';
import { TEST_DATA } from '../utils/test-data';

const env = ((globalThis as any).process?.env ?? {}) as Record<string, string | undefined>;
const isCI = Boolean(env.CI);

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
    await expect.poll(
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
        message: 'Cookies de autenticação não foram criados após cadastro bem-sucedido'
      }
    ).toBeTruthy();

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
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === TEST_DATA.auth.cookies.sessionId);
    const authCookie = cookies.find(c => c.name === TEST_DATA.auth.cookies.accountInfo);

    expect(sessionCookie).toBeUndefined();
    expect(authCookie).toBeUndefined();
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

    // Step 4: Validar que a mensagem de senha fraca foi exibida
    // OU que o botão foi desabilitado antes da submissão
    // Tenta encontrar mensagem de erro
    const weakPasswordError = page.getByText(/senha fraca|senha [aá] fraca|senha deve|requisitos de senha/i);
    const buttonDisabled = await page.getByRole('button', { name: TEST_DATA.locators.login.criarContaBtn }).isDisabled();

    const hasError = await weakPasswordError.isVisible().catch(() => false);
    expect(hasError || buttonDisabled).toBe(true);
  });

  test('CT14 - deve validar senhas não coincidentes', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const fakeUser = createUserFake();

    // Step 1: Navegar até o formulário de cadastro
    await registerPage.navigateToRegisterForm();

    // Step 2: Preencher com senhas diferentes
    await page
      .getByRole('textbox', { name: TEST_DATA.locators.registration.fullNameInput })
      .fill(fakeUser.fullName);
    await page
      .getByRole('textbox', { name: TEST_DATA.locators.registration.emailInput })
      .fill(fakeUser.email);
    await page
      .getByRole('textbox', { name: TEST_DATA.locators.registration.phoneInput })
      .fill(fakeUser.phone);
    await page
      .getByRole('textbox', { name: TEST_DATA.locators.registration.passwordInput, exact: true })
      .fill(fakeUser.password);
    
    // Preencher com senha diferente no campo de confirmação
    const differentPassword = `${fakeUser.password}Different`;
    await page
      .getByRole('textbox', { name: TEST_DATA.locators.registration.repeatPasswordInput })
      .fill(differentPassword);

    // Step 3: Tentar submeter o formulário
    const submitButton = page.getByRole('button', { name: TEST_DATA.locators.login.criarContaBtn });
    
    // Validar que o botão está desabilitado OU mensagem de erro aparece
    const isButtonDisabled = await submitButton.isDisabled();
    
    if (!isButtonDisabled) {
      // Se o botão não está desabilitado, clicar e esperar por erro
      await submitButton.click();
      
      // Aguardar por mensagem de erro ou ficar na mesma página
      const mismatchError = page.getByText(/senhas n[aã]o coincidem|as senhas n[aã]o s[aã]o iguais|senha n[aã]o/i);
      const hasError = await mismatchError.isVisible().catch(() => false);
      
      // OU validar que o usuário ainda está no formulário (não foi submetido)
      const stillOnForm = await submitButton.isVisible();
      
      expect(hasError || stillOnForm).toBe(true);
    } else {
      // Se o botão está desabilitado, validar que a validação está funcionando
      expect(isButtonDisabled).toBe(true);
    }
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
      // Preencher com email inválido
      await page
        .getByRole('textbox', { name: TEST_DATA.locators.registration.emailInput })
        .clear();
      await page
        .getByRole('textbox', { name: TEST_DATA.locators.registration.emailInput })
        .fill(invalidEmail);

      // Preencher outros campos
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

      // Step 3: Validar que o botão está desabilitado OU mensagem de erro
      const submitButton = page.getByRole('button', { name: TEST_DATA.locators.login.criarContaBtn });
      const isDisabled = await submitButton.isDisabled().catch(() => false);
      
      // A validação deve estar ativa (botão desabilitado ou erro exibido)
      expect(isDisabled).toBe(true);
    }
  });

  test('CT16 - deve validar consentimento de Termos de Serviço', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const fakeUser = createUserFake();

    // Step 1: Navegar até o formulário de cadastro
    await registerPage.navigateToRegisterForm();

    // Step 2: Tentar localizar checkbox de termos
    const termsCheckbox = page.locator('input[type="checkbox"]').filter({ 
      has: page.getByText(/termos|privacidade|aceito/i) 
    }).first();

    const hasTermsCheckbox = await termsCheckbox.isVisible().catch(() => false);

    if (hasTermsCheckbox) {
      // Step 3: Preencher formulário SEM marcar termos
      await registerPage.fillRegistrationForm({
        fullName: fakeUser.fullName,
        email: fakeUser.email,
        phone: fakeUser.phone,
        password: fakeUser.password,
      });

      // Garantir que termos NÃO estão marcados
      await termsCheckbox.uncheck().catch(() => {});

      // Step 4: Tentar submeter
      await registerPage.submitRegistration();

      // Step 5: Validar que erro foi exibido ou botão está desabilitado
      const isDisabled = await page.getByRole('button', { name: TEST_DATA.locators.login.criarContaBtn }).isDisabled();
      const hasError = await page.getByText(/termos|consentimento|aceitar/i).isVisible().catch(() => false);

      expect(isDisabled || hasError).toBe(true);
    } else {
      // Se não houver checkbox de termos, pular o teste
      test.skip(true, 'Checkbox de termos não encontrado no formulário');
    }
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
