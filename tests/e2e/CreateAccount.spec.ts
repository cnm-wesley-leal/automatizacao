import { test, expect } from '@playwright/test'; // Importe o expect
import { createUser } from '../test-data/fakerUser';
import { landingHome } from '../support/Landing.spect';


test('criar conta com dados válidos', async ({ page }) => {
  const user = createUser(
  );

await page.goto(process.env.BASE_URL!);

  // Interação
  await page.getByRole('link', { name: 'Entrar' }).click();
  await page.getByRole('link', { name: 'Cadastre-se aqui' }).click();
  await page.getByRole('textbox', { name: 'Nome completo' }).fill(user.fullName);
  await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
  await page.getByRole('textbox', { name: 'Telefone/whatsapp' }).fill(user.phone);  
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill(user.password);
  await page.getByRole('textbox', { name: 'Repetir senha' }).fill(user.password);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.locator('#avatar-container')).toBeVisible()

});