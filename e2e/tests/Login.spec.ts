import { test } from '@playwright/test';
import { landingHome } from '../utils/helpers';

test.describe('Login com email', () => {
  test('Login com email', async ({ page }) => {
    await landingHome(page);
  })
})
