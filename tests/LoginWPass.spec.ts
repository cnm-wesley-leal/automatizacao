import { test, expect } from '@playwright/test';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';

test('Login usuário de teste', async ({ page }) => {
  const landing = new LandingPage(page);
  const auth = new AuthPage(page);

  await landing.goto();
  await auth.loginWithEmail(process.env.USER_EMAIL!, process.env.USER_PASSWORD!);
  await auth.expectLoggedIn();
  await expect(page.locator('#avatar-container')).toBeVisible();
});


