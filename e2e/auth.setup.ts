import { test as setup, expect } from '@playwright/test';
import { TEST_DATA } from './utils/test-data';

const env = ((globalThis as any).process?.env ?? {}) as Record<string, string | undefined>;
const isCI = Boolean(env.CI);

async function dismissCookieConsentIfPresent(page: import('@playwright/test').Page) {
  const cookieConsentButton = page.getByRole('button', { name: TEST_DATA.locators.common.cookieConsent });
  try {
    await expect(cookieConsentButton).toBeVisible({ timeout: 5000 });
    await cookieConsentButton.click();
  } catch (error) {
    console.warn(`Cookie consent nao exibido no setup: ${String(error)}`);
  }
}

async function openEmailLoginForm(page: import('@playwright/test').Page) {
  await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeVisible({
    timeout: isCI ? 30000 : 15000
  });
  await page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink }).click();

  await expect(page.getByRole('button', { name: TEST_DATA.locators.login.entrarComEmailBtn })).toBeVisible({
    timeout: isCI ? 20000 : 10000
  });
  await page.getByRole('button', { name: TEST_DATA.locators.login.entrarComEmailBtn }).click();

  await expect(page.getByPlaceholder(TEST_DATA.locators.login.emailInput)).toBeVisible();
  await expect(page.getByPlaceholder(TEST_DATA.locators.login.passwordInput)).toBeVisible();
}

async function waitForAuthenticatedState(
  page: import('@playwright/test').Page,
  userEmail: string
): Promise<boolean> {
  let isAuthenticated = false;

  await expect
    .poll(
      async () => {
        const cookies = await page.context().cookies();
        const hasSessionCookie = cookies.some(
          cookie => cookie.name === TEST_DATA.auth.cookies.sessionId && Boolean(cookie.value)
        );
        const hasAccountCookie = cookies.some(
          cookie => cookie.name === TEST_DATA.auth.cookies.accountInfo && Boolean(cookie.value)
        );

        const hasEmailInUi = await page.getByText(userEmail).first().isVisible().catch(() => false);
        const entrarHidden = await page
          .getByRole('link', { name: TEST_DATA.locators.login.entrarLink })
          .isHidden()
          .catch(() => false);

        isAuthenticated = (hasSessionCookie && hasAccountCookie) || hasEmailInUi || entrarHidden;
        return isAuthenticated;
      },
      {
        timeout: isCI ? 45000 : 25000,
        message: 'Login nao confirmou estado autenticado por UI ou cookies.'
      }
    )
    .toBeTruthy();

  return isAuthenticated;
}

function getStorageStatePath(projectName: string): string {
  if (projectName === 'setup-webkit') {
    return '.auth/user-webkit.json';
  }

  if (projectName === 'setup-ios') {
    return '.auth/user-ios.json';
  }

  return TEST_DATA.auth.statePath;
}

setup('authenticate as WebUser', async ({ page }, testInfo) => {
  const userEmail = env.USER_EMAIL_WEBUSER;
  const userPassword = env.USER_PASSWORD;
  expect(userEmail, 'USER_EMAIL_WEBUSER nao definido para auth.setup.ts').toBeTruthy();
  expect(userPassword, 'USER_PASSWORD nao definido para auth.setup.ts').toBeTruthy();

  // Use networkidle to ensure the page is stable in CI
  await page.goto(TEST_DATA.urls.base, { waitUntil: 'networkidle' });
  
  await dismissCookieConsentIfPresent(page);

  const maxAttempts = 2;
  let authenticated = false;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await openEmailLoginForm(page);
    await page.getByPlaceholder(TEST_DATA.locators.login.emailInput).fill(userEmail!);
    await page.getByPlaceholder(TEST_DATA.locators.login.passwordInput).fill(userPassword!);
    await page.getByRole('button', { name: TEST_DATA.locators.login.submitBtn }).click();

    authenticated = await waitForAuthenticatedState(page, userEmail!);
    if (authenticated) {
      break;
    }

    if (attempt < maxAttempts) {
      await page.goto(TEST_DATA.urls.base, { waitUntil: 'domcontentloaded' });
      await dismissCookieConsentIfPresent(page);
    }
  }

  expect(authenticated, 'Nao foi possivel autenticar o usuario no setup apos retries.').toBeTruthy();

  await page.context().storageState({ path: getStorageStatePath(testInfo.project.name) });
});
