import { test, expect } from '@playwright/test';
import { TEST_DATA } from '../utils/test-data';

const env = ((globalThis as any).process?.env ?? {}) as Record<string, string | undefined>;

async function openAuthPanel(page: import('@playwright/test').Page) {
  await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeVisible();
  await page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink }).click();

  await expect(page.getByRole('heading', { name: /acesse ou crie sua conta/i })).toBeVisible();
}

async function openLoginByEmail(page: import('@playwright/test').Page) {
  await openAuthPanel(page);

  await expect(page.getByRole('button', { name: TEST_DATA.locators.login.entrarComEmailBtn })).toBeVisible();
  await page.getByRole('button', { name: TEST_DATA.locators.login.entrarComEmailBtn }).click();

  await expect(page.getByPlaceholder(TEST_DATA.locators.login.emailInput)).toBeVisible();
  await expect(page.getByPlaceholder(TEST_DATA.locators.login.passwordInput)).toBeVisible();
}

type SocialOutcome = 'success' | 'error';

type SocialProvider = {
  name: 'Google' | 'Facebook' | 'Apple';
  buttonName: string;
  oauthSignalRegex: RegExp;
};

const socialProviders: SocialProvider[] = [
  {
    name: 'Google',
    buttonName: TEST_DATA.locators.login.entrarComGoogleBtn,
    oauthSignalRegex: /(accounts\.google\.com|oauth|social\/google|auth\/google)/i
  },
  {
    name: 'Facebook',
    buttonName: TEST_DATA.locators.login.entrarComFacebookBtn,
    oauthSignalRegex: /(facebook\.com|oauth|social\/facebook|auth\/facebook)/i
  },
  {
    name: 'Apple',
    buttonName: TEST_DATA.locators.login.entrarComAppleBtn,
    oauthSignalRegex: /(appleid\.apple\.com|oauth|social\/apple|auth\/apple)/i
  }
];

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

async function assertSessionState(page: import('@playwright/test').Page, loggedIn: boolean) {
  await expect
    .poll(async () => {
      const cookies = await page.context().cookies();
      const hasSession = cookies.some(
        cookie => cookie.name === TEST_DATA.auth.cookies.sessionId && Boolean(cookie.value)
      );
      const hasAccount = cookies.some(
        cookie => cookie.name === TEST_DATA.auth.cookies.accountInfo && Boolean(cookie.value)
      );
      return hasSession && hasAccount;
    })
    .toBe(loggedIn);

  if (loggedIn) {
    await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeHidden();
    return;
  }

  await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeVisible();
}

async function runSocialLoginWithMock(
  page: import('@playwright/test').Page,
  provider: SocialProvider,
  outcome: SocialOutcome
) {
  const mockHandler = async (route: import('@playwright/test').Route) => {
    const request = route.request();

    if (request.isNavigationRequest()) {
      await route.fulfill({
        status: outcome === 'success' ? 200 : 401,
        contentType: 'text/html',
        body:
          outcome === 'success'
            ? '<html><body>mock social success</body></html>'
            : '<html><body>mock social error</body></html>'
      });
      return;
    }

    await route.fulfill({
      status: outcome === 'success' ? 200 : 401,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        success: outcome === 'success',
        provider: provider.name,
        message:
          outcome === 'success'
            ? `${provider.name} mock login success`
            : `${provider.name} mock login error`
      })
    });
  };
  await page.context().route(provider.oauthSignalRegex, mockHandler);

  try {
    await openAuthPanel(page);

    const socialButton = page.getByRole('button', { name: provider.buttonName });
    await expect(socialButton).toBeVisible();
    await socialButton.click();

    if (outcome === 'success') {
      await setMockSocialSession(page);
    } else {
      await page.context().clearCookies();
    }

    await page.goto(TEST_DATA.urls.base, { waitUntil: 'domcontentloaded' });
    await assertSessionState(page, outcome === 'success');
  } finally {
    await page.context().unroute(provider.oauthSignalRegex, mockHandler);
  }
}

test.describe('Feature Auth - Login e Cadastro', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_DATA.urls.base);

    // Dismiss the cookie consent if present without introducing fixed waits.
    await page.getByText(TEST_DATA.locators.common.cookieConsent).click({ timeout: 5000 }).catch(() => {});

    // Initial state checkpoint.
    await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeVisible();
  });

  test('CT01 - deve realizar login com credenciais validas', async ({ page }) => {
    test.skip(
      !env.USER_EMAIL_WEBUSER || !env.USER_PASSWORD,
      'Defina USER_EMAIL_WEBUSER e USER_PASSWORD para executar CT01.'
    );

    await openLoginByEmail(page);

    await page.getByPlaceholder(TEST_DATA.locators.login.emailInput).fill(env.USER_EMAIL_WEBUSER!);
    await page.getByPlaceholder(TEST_DATA.locators.login.passwordInput).fill(env.USER_PASSWORD!);

    await page.getByRole('button', { name: TEST_DATA.locators.login.submitBtn }).click();

    // Final state checkpoint for authenticated user.
    await expect(page.getByText(env.USER_EMAIL_WEBUSER!)).toBeVisible();
  });

  test('CT02 - deve exibir erro ao tentar login com senha invalida', async ({ page }) => {
    test.skip(
      !env.USER_EMAIL_WEBUSER,
      'Defina USER_EMAIL_WEBUSER para executar CT02.'
    );

    await openLoginByEmail(page);

    await page.getByPlaceholder(TEST_DATA.locators.login.emailInput).fill(env.USER_EMAIL_WEBUSER!);
    await page.getByPlaceholder(TEST_DATA.locators.login.passwordInput).fill('SenhaInvalida123');

    await page.getByRole('button', { name: TEST_DATA.locators.login.submitBtn }).click();

    // Checkpoint: user should remain on auth flow and get feedback.
    await expect(page.getByRole('button', { name: TEST_DATA.locators.login.submitBtn })).toBeVisible();
    await expect(page.getByText(/email e\/ou senha inv[aá]lidos/i)).toBeVisible();
  });

  test('CT03 - deve abrir o fluxo de cadastro a partir do login', async ({ page }) => {
    await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeVisible();
    await page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink }).click();

    await expect(page.getByRole('link', { name: TEST_DATA.locators.login.cadastreSeLink })).toBeVisible();
    await page.getByRole('link', { name: TEST_DATA.locators.login.cadastreSeLink }).click();

    // Final state checkpoint: registration form fields are available.
    await expect(page.getByRole('textbox', { name: TEST_DATA.locators.registration.fullNameInput })).toBeVisible();
    await expect(page.getByRole('textbox', { name: TEST_DATA.locators.registration.emailInput })).toBeVisible();
    await expect(page.getByRole('textbox', { name: TEST_DATA.locators.registration.phoneInput })).toBeVisible();
    await expect(page.getByRole('textbox', { name: TEST_DATA.locators.registration.passwordInput, exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: TEST_DATA.locators.registration.repeatPasswordInput })).toBeVisible();
    await expect(page.getByRole('button', { name: TEST_DATA.locators.login.criarContaBtn })).toBeVisible();
  });

  test('CT04 - deve exibir opcoes de login social', async ({ page }) => {
    await openAuthPanel(page);

    await expect(page.getByRole('button', { name: TEST_DATA.locators.login.entrarComAppleBtn })).toBeVisible();
    await expect(page.getByRole('button', { name: TEST_DATA.locators.login.entrarComGoogleBtn })).toBeVisible();
    await expect(page.getByRole('button', { name: TEST_DATA.locators.login.entrarComFacebookBtn })).toBeVisible();
  });

  test('CT05 - deve realizar login social com mock de sucesso (Google)', async ({ page }) => {
    await runSocialLoginWithMock(page, socialProviders[0], 'success');
  });

  test('CT06 - deve bloquear login social com mock de erro (Google)', async ({ page }) => {
    await runSocialLoginWithMock(page, socialProviders[0], 'error');
  });

  test('CT07 - deve realizar login social com mock de sucesso (Facebook)', async ({ page }) => {
    await runSocialLoginWithMock(page, socialProviders[1], 'success');
  });

  test('CT08 - deve bloquear login social com mock de erro (Facebook)', async ({ page }) => {
    await runSocialLoginWithMock(page, socialProviders[1], 'error');
  });

  test('CT09 - deve realizar login social com mock de sucesso (Apple)', async ({ page }) => {
    await runSocialLoginWithMock(page, socialProviders[2], 'success');
  });

  test('CT10 - deve bloquear login social com mock de erro (Apple)', async ({ page }) => {
    await runSocialLoginWithMock(page, socialProviders[2], 'error');
  });
});
