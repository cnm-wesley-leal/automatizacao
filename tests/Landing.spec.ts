import { test } from '@playwright/test';
import { LandingPage } from './pages/LandingPage';

test('landing page carrega e navega para Chaves na Mão', async ({ page }) => {
  const landing = new LandingPage(page);
  await landing.goto();
  await landing.expectLoaded();
  await landing.clickChavesNaMao();
  await landing.expectOnChavesNaMao();
});


