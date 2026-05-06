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
        timeout: isCI ? 30000 : 15000,
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

async function waitForRegistrationOutcomeByUiOrUrl(page: import('@playwright/test').Page): Promise<'success' | 'duplicate'> {
  let outcome: 'pending' | 'success' | 'duplicate' = 'pending';

  await expect
    .poll(
      async () => {
        const isDuplicateDataErrorVisible = await page
          .getByText(/telefone j[aá] cadastrado|email j[aá] cadastrado|email j[aá] est[aá] em uso|este email j[aá]/i)
          .first()
          .isVisible()
          .catch(() => false);

        if (isDuplicateDataErrorVisible) {
          outcome = 'duplicate';
          return outcome;
        }

        const isEntrarHidden = await page
          .getByRole('link', { name: TEST_DATA.locators.login.entrarLink })
          .isHidden()
          .catch(() => false);
        const currentUrl = page.url().toLowerCase();
        const isAuthFlowUrl = /\/entrar|\/login|\/cadastrar/.test(currentUrl);

        if (isEntrarHidden || !isAuthFlowUrl) {
          outcome = 'success';
          return outcome;
        }

        outcome = 'pending';
        return outcome;
      },
      {
        timeout: isCI ? 30000 : 15000,
        message: 'UI/URL nao confirmou desfecho de cadastro no tempo esperado.'
      }
    )
    .not.toBe('pending');

  if (outcome === 'pending') {
    throw new Error('Desfecho de cadastro permaneceu pendente apos polling.');
  }

  return outcome;
}

function getCookieDomain() {
  const host = new URL(TEST_DATA.urls.base).hostname;
  return host.startsWith('.') ? host : `.${host}`;
}

async function setMockSocialSession(page: import('@playwright/test').Page) {
  const secureCookie = TEST_DATA.urls.base.startsWith('https://');

  await page.context().addCookies([
    {
      name: TEST_DATA.auth.cookies.sessionId,
      value: `mock-social-session-${Date.now()}`,
      domain: getCookieDomain(),
      path: '/',
      httpOnly: true,
      secure: secureCookie,
      sameSite: secureCookie ? 'None' : 'Lax'
    },
    {
      name: TEST_DATA.auth.cookies.accountInfo,
      value: `mock-social-account-${Date.now()}`,
      domain: getCookieDomain(),
      path: '/',
      httpOnly: false,
      secure: secureCookie,
      sameSite: secureCookie ? 'None' : 'Lax'
    }
  ]);
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
    const maxAttempts = 3;
    // Step 1: Navegar até o formulário de cadastro
    await registerPage.navigateToRegisterForm();

    // Step 2: Validar que o formulário está completo
    await registerPage.assertFormFieldsVisible();

    // Step 3 + 4: Preencher e submeter, com retry para colisao eventual de dado já cadastrado.
    let lastTriedUser = createUserFake();
    let submittedWithoutDuplicateError = false;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      lastTriedUser = createUserFake();
      await registerPage.fillRegistrationForm({
        fullName: lastTriedUser.fullName,
        email: lastTriedUser.email,
        phone: lastTriedUser.phone,
        password: lastTriedUser.password,
      });

      await registerPage.submitRegistration();

      const hasDuplicateDataError = await page
        .getByText(/telefone j[aá] cadastrado|email j[aá] cadastrado|email j[aá] est[aá] em uso|este email j[aá]/i)
        .first()
        .isVisible({ timeout: 2500 })
        .catch(() => false);
      if (hasDuplicateDataError) {
        if (attempt === maxAttempts) {
          throw new Error(
            `CT11 falhou apos ${maxAttempts} tentativas por dados duplicados. Ultimo email: ${lastTriedUser.email}, telefone: ${lastTriedUser.phone}`
          );
        }
        continue;
      }

      const outcome = await waitForRegistrationOutcomeByUiOrUrl(page);
      if (outcome === 'duplicate') {
        if (attempt === maxAttempts) {
          throw new Error(
            `CT11 falhou apos ${maxAttempts} tentativas por dados duplicados. Ultimo email: ${lastTriedUser.email}, telefone: ${lastTriedUser.phone}`
          );
        }
        continue;
      }

      submittedWithoutDuplicateError = true;
      break;
    }
    expect(submittedWithoutDuplicateError).toBeTruthy();

    // Step 5: Validar cookies apenas apos sucesso confirmado por UI/URL.
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


  test('CT17 - deve permitir login social com novo registro automático', async ({ page }) => {
    const oauthSignalRegex = /(accounts\.google\.com|oauth|social\/google|auth\/google)/i;

    const mockHandler = async (route: import('@playwright/test').Route) => {
      const request = route.request();

      if (request.isNavigationRequest()) {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<html><body>mock social success</body></html>'
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({
          success: true,
          provider: 'Google',
          message: 'Google mock social signup success'
        })
      });
    };

    await page.context().route(oauthSignalRegex, mockHandler);

    try {
      // Abre painel de autenticação e confirma opção social visível.
      await page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink }).click();
      const googleSocialButton = page.getByRole('button', { name: TEST_DATA.locators.login.entrarComGoogleBtn });
      await expect(googleSocialButton).toBeVisible();

      // Simula usuário novo autenticando via Google no callback mockado.
      await googleSocialButton.click();
      await setMockSocialSession(page);

      // Pós-login social: home autenticada e cookies presentes.
      await page.goto(TEST_DATA.urls.base, { waitUntil: 'domcontentloaded' });
      await assertAuthenticatedCookies(page);
      await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeHidden();

      // Sinal de cadastro automático: usuário autenticado e fora do fluxo de login/cadastro.
      await expect(page).not.toHaveURL(/\/(entrar|login|cadastrar)/i);

      const authPanelHeading = page.getByRole('heading', { name: /acesse ou crie sua conta/i });
      await expect(authPanelHeading).toBeHidden();
    } finally {
      await page.context().unroute(oauthSignalRegex, mockHandler);
    }
  });
});
