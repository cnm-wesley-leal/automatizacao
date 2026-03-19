import { test, expect } from '@playwright/test';
import { createUser, logingUserTest} from '../support/Access.page';


test.describe('Criação de conta', () => {
  test('deve criar um usuário com dados gerados', async ({ page }) => {
    await createUser(page);
    await expect(page.locator('#avatar-container')).toBeVisible()
  });

  test('deve logar em um usuário teste', async ({ page }) => {
    await logingUserTest(page);
    await expect(page.locator('#avatar-container')).toBeVisible()
  });
});
