import { test as setup, expect } from '@playwright/test';
import { TEST_DATA } from './utils/test-data';

setup('authenticate as WebUser', async ({ page }) => {
  // Use networkidle to ensure the page is stable in CI
  await page.goto(TEST_DATA.urls.base, { waitUntil: 'networkidle' });
  
  // Handle cookie consent without silent failures.
  const cookieConsentButton = page.getByRole('button', { name: TEST_DATA.locators.common.cookieConsent });
  try {
    await expect(cookieConsentButton).toBeVisible({ timeout: 5000 });
    await cookieConsentButton.click();
  } catch (error) {
    console.warn(`Cookie consent nao exibido no setup: ${String(error)}`);
  }

  // Increase timeout for the 'Entrar' link
  await page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink }).click({ timeout: 20000 });
  await page.getByRole('button', { name: TEST_DATA.locators.login.entrarComEmailBtn }).click();
  
  await page.getByPlaceholder(TEST_DATA.locators.login.emailInput).fill(process.env.USER_EMAIL_WEBUSER!);
  await page.getByPlaceholder(TEST_DATA.locators.login.passwordInput).fill(process.env.USER_PASSWORD!);
  await page.getByRole('button', { name: TEST_DATA.locators.login.submitBtn }).click();

  await expect(page.getByText(process.env.USER_EMAIL_WEBUSER!)).toBeVisible({ timeout: 20000 });

  await page.context().storageState({ path: TEST_DATA.auth.statePath });
});
