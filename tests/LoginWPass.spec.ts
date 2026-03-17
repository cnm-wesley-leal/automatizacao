import { test, expect } from '@playwright/test';

test('Login usuário de teste', async ({ page }) => {
    await page.goto(process.env.BASE_URL!);

  await page.locator('body').press('Enter');
  await page.getByRole('link', { name: 'Entrar' }).click();
  await page.getByRole('button', { name: 'Entrar com email' }).click();
  await page.getByPlaceholder('Email cadastrado').click();
  await page.getByPlaceholder('Email cadastrado').fill(process.env.USER_EMAIL!);  
  await page.getByPlaceholder('Senha cadastrada').click();
  await page.getByPlaceholder('Senha cadastrada').fill(process.env.USER_PASSWORD!);  
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.locator('#avatar-container')).toBeVisible()
})


