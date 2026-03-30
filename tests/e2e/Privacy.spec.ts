import { test, Page, expect } from '@playwright/test';
import { logingUserTestWebUser } from '../support/Access.page';

test.describe('Exclusão de conta', () => {

  test.beforeEach(async ({ page }) => {
    await logingUserTestWebUser(page);
  });

  test('Fluxo completo: solicitar e cancelar exclusão de conta', async ({ page }) => {

    await test.step('Navegar até Exclusão da conta', async () => {
      await page.getByRole('link', { name: 'Minha conta' }).click();
      await page.getByTitle('Privacidade').click();
      await page.getByTitle('Exclusão da conta').click();
    });

    await test.step('Solicitar exclusão com sucesso', async () => {
      await page.getByPlaceholder('e-mail@exemplo.com.br')
        .fill(process.env.USER_EMAIL_WEBUSER!);
      await page.getByRole('button', { name: 'Solicitar exclusão' }).click();

      const successModal = page.locator('#mdl-delete-account-success-modal');
      await expect(successModal).toBeVisible();
      await expect(successModal.getByRole('heading'))
        .toHaveText(/Solicitação realizada com sucesso/i);

    await page.getByRole('button', { name: 'Sair da conta' }).click();
    
    await expect(
      page.getByRole('heading', { name: 'Acesse ou crie sua conta' })
    ).toBeVisible();

    });

    await test.step('Cancelar solicitação de exclusão', async () => {
        await page.getByRole('link', { name: 'Entrar' }).click();
        await page.getByRole('button', { name: 'Entrar com email' }).click();
        await page.getByPlaceholder('Email cadastrado').click();
        await page.getByPlaceholder('Email cadastrado').fill(process.env.USER_EMAIL_WEBUSER!);  
        await page.getByPlaceholder('Senha cadastrada').click();
        await page.getByPlaceholder('Senha cadastrada').fill(process.env.USER_PASSWORD!);  
        await page.getByRole('button', { name: 'Entrar' }).click();
    
      await page.getByRole('button', { name: 'Cancelar solicitação' }).click();
      await page.getByRole('button', { name: 'Ir para o login' }).click();

      await expect(
        page.getByRole('heading', { name: 'Acesse ou crie sua conta' })
      ).toBeVisible();
   
    
    await page.getByRole('link', { name: 'Entrar' }).click();
    await page.getByRole('button', { name: 'Entrar com email' }).click();
    await page.getByPlaceholder('Email cadastrado').click();
    await page.getByPlaceholder('Email cadastrado').fill(process.env.USER_EMAIL_WEBUSER!);  
    await page.getByPlaceholder('Senha cadastrada').click();
    await page.getByPlaceholder('Senha cadastrada').fill(process.env.USER_PASSWORD!);  
    await page.getByRole('button', { name: 'Entrar' }).click();

    const dataSection = page.getByRole('article').filter({ 
      has: page.getByRole('heading', { name: 'Meus Dados' }) 
    });
    await expect(dataSection).toBeVisible();
  });
  });

});

test.describe('Termos', () => {
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
      });

