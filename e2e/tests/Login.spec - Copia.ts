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

async function assertSocialLoginStarts(
  page: import('@playwright/test').Page,
  buttonName: string,
  oauthSignalRegex: RegExp
) {
  const matchedRequests: string[] = [];
  let captureStarted = false;

  const onRequest = (request: import('@playwright/test').Request) => {
    if (!captureStarted) return;

    const requestUrl = request.url();
    if (oauthSignalRegex.test(requestUrl)) {
      matchedRequests.push(requestUrl);
    }
  };

  page.on('request', onRequest);

  try {
    await openAuthPanel(page);

    const socialButton = page.getByRole('button', { name: buttonName });
    await expect(socialButton).toBeVisible();

    const popupPromise = page
      .context()
      .waitForEvent('page', { timeout: 7000 })
      .then(async popup => {
        await popup.waitForLoadState('domcontentloaded', { timeout: 7000 }).catch(() => {});
        return popup.url();
      })
      .catch(() => null);

    captureStarted = true;
    await socialButton.click();

    const popupUrl = await popupPromise;
    if (popupUrl) {
      expect(popupUrl).toMatch(oauthSignalRegex);
      return;
    }

    await expect
      .poll(() => matchedRequests.length, {
        timeout: 10000,
        message: `Nao foi detectado inicio do fluxo social para ${buttonName}.`
      })
      .toBeGreaterThan(0);
  } finally {
    captureStarted = false;
    page.off('request', onRequest);
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

  test('CT05 - deve iniciar fluxo de login social com Google', async ({ page }) => {
    await assertSocialLoginStarts(
      page,
      TEST_DATA.locators.login.entrarComGoogleBtn,
      /(accounts\.google\.com|oauth|social\/google|auth\/google)/i
    );
  });

  test('CT06 - deve iniciar fluxo de login social com Facebook', async ({ page }) => {
    await assertSocialLoginStarts(
      page,
      TEST_DATA.locators.login.entrarComFacebookBtn,
      /(facebook\.com|oauth|social\/facebook|auth\/facebook)/i
    );
  });

  test('CT07 - deve iniciar fluxo de login social com Apple', async ({ page }) => {
    await assertSocialLoginStarts(
      page,
      TEST_DATA.locators.login.entrarComAppleBtn,
      /(appleid\.apple\.com|oauth|social\/apple|auth\/apple)/i
    );
  });
});
