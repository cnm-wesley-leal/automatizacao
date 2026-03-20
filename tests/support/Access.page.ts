import { Page, expect } from '@playwright/test';
import { createUserFake } from '../test-data/fakerUser';
import { landingHome } from './Landing.page';

export async function logingUserTest(page: Page){
    await landingHome(page);
  
    await page.getByRole('link', { name: 'Entrar' }).click();
    await page.getByRole('button', { name: 'Entrar com email' }).click();
    await page.getByPlaceholder('Email cadastrado').click();
    await page.getByPlaceholder('Email cadastrado').fill(process.env.USER_EMAIL!);  
    await page.getByPlaceholder('Senha cadastrada').click();
    await page.getByPlaceholder('Senha cadastrada').fill(process.env.USER_PASSWORD!);  
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByText(process.env.USER_EMAIL!)).toBeVisible();
}

export async function createUser(page: Page){
    const user = createUserFake()

    await landingHome(page);

    await page.getByRole('link', { name: 'Entrar' }).click();
    await page.getByRole('link', { name: 'Cadastre-se aqui' }).click();
    await page.getByRole('textbox', { name: 'Nome completo' }).fill(user.fullName);
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Telefone/whatsapp' }).fill(user.phone);  
    await page.getByRole('textbox', { name: 'Senha', exact: true }).fill(user.password);
    await page.getByRole('textbox', { name: 'Repetir senha' }).fill(user.password);
    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(page.getByText(user.email)).toBeVisible();

}