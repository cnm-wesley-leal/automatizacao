import { test, expect } from '@playwright/test'; // Importe o expect
import { fakerPT_BR as faker } from '@faker-js/faker'; // Use o locale PT_BR para dados mais reais

test('criar conta com dados válidos', async ({ page }) => {
  // Gerando dados mais brasileiros
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const fullName = `${firstName} ${lastName}`;
  const email = faker.internet.email({ firstName, lastName }).toLowerCase();
  
  // Telefone BR (DDD + 9XXXX-XXXX) gerado manualmente para evitar variações de API do faker
  const ddd = faker.number.int({ min: 11, max: 99 });
  const prefix = faker.number.int({ min: 1000, max: 9999 });
  const suffix = faker.number.int({ min: 1000, max: 9999 });
  const phone = `(${ddd}) 9${prefix}-${suffix}`;

  const password = faker.internet.password({
    length: 8,
    prefix: 'Aa1!'
  });

  await page.goto('https://qa.chavesnamao.com.br/');
  
  // Interação
  await page.getByRole('link', { name: 'Entrar' }).click();
  await page.getByRole('link', { name: 'Cadastre-se aqui' }).click();

  await page.getByRole('textbox', { name: 'Nome completo' }).fill(fullName);
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Telefone/whatsapp' }).fill(phone);

  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill(password);
  await page.getByRole('textbox', { name: 'Repetir senha' }).fill(password);

  await page.getByRole('button', { name: 'Criar conta' }).click();

  // --- VALIDAÇÃO (Exemplo) ---

});