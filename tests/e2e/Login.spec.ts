import { test, expect } from '@playwright/test';
import { createUser, logingUserTest} from '../support/Access.page';


test.describe('Acesso a home', () => {
  test('deve criar um usuário com dados gerados', async ({ page }) => {
    await page.goto(process.env.BASE_URL!);

    await page.getByRole('link', { name: 'Entrar' }).click();
    await page.getByRole('button', { name: 'Entrar com email' }).click();
    await page.getByPlaceholder('Email cadastrado').click();
    await page.getByPlaceholder('Email cadastrado').fill(process.env.USER_EMAIL!);  
    await page.getByPlaceholder('Senha cadastrada').click();
    await page.getByPlaceholder('Senha cadastrada').fill(process.env.USER_PASSWORD!);  
const btnEntrar = page.locator('button.style_LabelButton__sXl6w', { hasText: 'Entrar' }).last();
await btnEntrar.click({timeout: 120000});
 });
})
  /*test('deve logar em um usuário teste', async ({ page }) => {
    await logingUserTest(page);
    await expect(page.locator('#avatar-container')).toBeVisible()
  });
})*/
