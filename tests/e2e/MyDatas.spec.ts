import { test, expect } from '@playwright/test';
import { logingUserTest } from '../support/Access.page';
import { fakePhone } from '../helpers';

 
test.describe('WebUser', () => {

  test.beforeEach(async ({ page }) => {
    await logingUserTest(page);
    await page.getByRole('link', { name: 'Minha conta' }).click();
  });

  test('Layout', async ({ page }) => {
    await expect(page.getByRole('article')).toMatchAriaSnapshot(`
      - article:
        - navigation:
          - link "Meus dados":
            - /url: /conta/perfil/
            - img
            - text: ""
          - link "Senha":
            - /url: /conta/senha/
            - img
            - text: ""
          - link "Privacidade":
            - /url: /conta/privacidade/
            - img
            - text: ""
        - heading "Meus dados" [level=3]
        - text: Nome completo
        - paragraph: Wesley Leal dos Santos
        - separator
        - heading "Contato" [level=3]
        - button:
          - img
        - text: Telefone
        - paragraph: /\\(\\d+\\) \\d+-\\d+/
        - text: E-mail
        - paragraph: wesley.leal@chavesnamao.com.br
        - status "Informação":
          - paragraph: Usamos esses dados para enviar informações e possibilitar contato caso você tenha publicado um anúncio.
      `);
  });
 
    test('Edição de telefone', async ({ page }) => {
      const newPhone = fakePhone();
      
      const contactSection = page.getByRole('article').filter({ 
        has: page.getByRole('heading', { name: 'Contato' }) 
      });
      await contactSection.getByRole('button').click();
    
      const phoneInput = page.getByRole('textbox', { name: 'Telefone' });
      
      await phoneInput.fill(newPhone);
      await page.getByRole('button', { name: 'Salvar' }).click();
 
      await expect(phoneInput).toHaveValue(newPhone);
      await expect(page.getByText(newPhone)).toBeVisible();
    });
  });
