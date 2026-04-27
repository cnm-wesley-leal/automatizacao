import { test as setup, expect } from '@playwright/test';
import { TEST_DATA } from './utils/test-data';

setup('authenticate as WebUser', async ({ page }) => {
  await page.goto(TEST_DATA.urls.base);
  await page.getByText(TEST_DATA.locators.common.cookieConsent).click({ timeout: 10000 }).catch(() => { });

  await page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink }).click();
  await page.getByRole('button', { name: TEST_DATA.locators.login.entrarComEmailBtn }).click();
  await page.getByPlaceholder(TEST_DATA.locators.login.emailInput).fill(process.env.USER_EMAIL_WEBUSER!);
  await page.getByPlaceholder(TEST_DATA.locators.login.passwordInput).fill(process.env.USER_PASSWORD!);
  await page.getByRole('button', { name: TEST_DATA.locators.login.submitBtn }).click();

  await expect(page.getByText(process.env.USER_EMAIL_WEBUSER!)).toBeVisible({ timeout: 15000 });

  await page.context().storageState({ path: TEST_DATA.auth.statePath });
});
