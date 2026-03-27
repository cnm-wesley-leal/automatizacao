import { test, Page, expect } from '@playwright/test';
import { logingUserTestWebUser } from '../support/Access.page';

test.describe('Exclusão de conta', () => {
    test.beforeEach(async ({ page }) => {
      await logingUserTestWebUser(page);
    });
  
    test('Deve solicitar exclusão com sucesso', async ({ page }) => {
      await page.getByRole('link', { name: 'Minha conta' }).click();
      await page.getByTitle('Privacidade').click();
      await page.getByTitle('Exclusão da conta').click();
  
      await page.getByPlaceholder('e-mail@exemplo.com.br').fill(process.env.USER_EMAIL_WEBUSER!);
      await page.getByRole('button', { name: 'Solicitar exclusão' }).click();
  
      const successModal = page.locator('#mdl-delete-account-success-modal');
      await expect(successModal).toBeVisible();
      await expect(successModal.getByRole('heading'))
        .toHaveText(/Solicitação realizada com sucesso/i);

    await page.getByRole('button', { name: 'Sair da conta' }).click();
    await expect(page.getByRole('heading', { name: 'Acesse ou crie sua conta' })).toBeVisible();


    });
  
    test('Deve cancelar solicitação de exclusão com sucesso', async ({ page }) => {
      // navega até solicitação e solicita exclusão primeiro...
  
      await page.getByRole('button', { name: 'Cancelar solicitação' }).click();
      await page.getByRole('button', { name: 'Ir para o login' }).click();
  
      await expect(page.getByRole('heading', { name: 'Acesse ou crie sua conta' })).toBeVisible();
    });
  });
/*test.describe('Termos', () => {
    test.beforeEach(async ({ page }) => {
        await logingUserTestWebUser(page);
        await page.getByRole('link', { name: 'Minha conta' }).click();
        await page.getByTitle('Privacidade').click();
      });

      test('Validar página de Termos de Uso', async ({ page }) => {
        await page.getByRole('link', { name: 'Privacidade' }).click();
      
        const popupPromise = page.waitForEvent('popup');
        await page.getByRole('link', { name: 'Termos de uso' }).click();
      
        const termosPage = await popupPromise;
      
        await expect(termosPage.getByRole('article')).toMatchAriaSnapshot(`
          - heading "Termos de uso" [level=1]:
            - text: ""
            - img
          - heading "Antes de navegar em nosso portal leia nosso Termo de Uso e Política de Privacidade." [level=2]
          - heading "TERMOS DE USO" [level=2]
        `);
      });
      test('Validar página de Política de Privacidade', async ({ page }) => {
        await page.getByRole('link', { name: 'Privacidade' }).click();
      
        const popupPromise = page.waitForEvent('popup');
        await page.getByRole('link', { name: 'Política de privacidade' }).click();
      
        const privacidadePage = await popupPromise;
      
        await expect(privacidadePage.getByRole('article')).toMatchAriaSnapshot(`
          - heading "Políticas de privacidade" [level=1]
          - heading "POLÍTICAS DE PRIVACIDADE E SEGURANÇA DE DADOS" [level=2]
        `);
      });
      test('Deve exibir corretamente o modal de exclusão', async ({ page }) => {
          
        const modal = page.locator('#mdl-delete-account-form-modal');
          
        await expect(modal.getByRole('heading', { name: /Solicitar exclusão da conta/i })).toBeVisible();
          
        await expect(modal.getByText(/A exclusão da sua conta levará/i)).toBeVisible();
          
        await expect(modal.getByPlaceholder('e-mail@exemplo.com.br')).toBeVisible();
          
        await expect(modal.getByRole('button', { name: 'Cancelar' })).toBeVisible();
        await expect(modal.getByRole('button', { name: 'Solicitar exclusão' })).toBeVisible();
          });

    test('Não deve permitir exclusão com email incorreto', async ({ page }) => {              
        const input = page.getByPlaceholder('e-mail@exemplo.com.br');
          
        await input.fill('email@errado.com');
          
        await page.getByRole('button', { name: 'Solicitar exclusão' }).click();
          
        await expect(page.locator('small'))
              .toHaveText(/não corresponde ao registrado/i);
          });


      });*/

