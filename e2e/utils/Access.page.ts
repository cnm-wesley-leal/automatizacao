import { Page, expect } from '@playwright/test';
import { createUserFake } from '../fixtures/fakerUser';
import { landingHome } from './helpers';
import { TEST_DATA } from './test-data';
import process from 'process';

export async function logingUserTestWebUser(page: Page) {
    await landingHome(page);

    await page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink }).click();
    await page.getByRole('button', { name: TEST_DATA.locators.login.entrarComEmailBtn }).click();
    await page.getByPlaceholder(TEST_DATA.locators.login.emailInput).click();
    await page.getByPlaceholder(TEST_DATA.locators.login.emailInput).fill(process.env.USER_EMAIL_WEBUSER!);
    await page.getByPlaceholder(TEST_DATA.locators.login.passwordInput).click();
    await page.getByPlaceholder(TEST_DATA.locators.login.passwordInput).fill(process.env.USER_PASSWORD!);
    await page.getByRole('button', { name: TEST_DATA.locators.login.submitBtn }).click();

    await expect(page.getByText(process.env.USER_EMAIL_WEBUSER!)).toBeVisible();
}

export async function createUser(page: Page) {
    const user = createUserFake()

    await landingHome(page);

    await page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink }).click();
    await page.getByRole('link', { name: TEST_DATA.locators.login.cadastreSeLink }).click();
    await page.getByRole('textbox', { name: TEST_DATA.locators.registration.fullNameInput }).fill(user.fullName);
    await page.getByRole('textbox', { name: TEST_DATA.locators.registration.emailInput }).fill(user.email);
    await page.getByRole('textbox', { name: TEST_DATA.locators.registration.phoneInput }).fill(user.phone);
    await page.getByRole('textbox', { name: TEST_DATA.locators.registration.passwordInput, exact: true }).fill(user.password);
    await page.getByRole('textbox', { name: TEST_DATA.locators.registration.repeatPasswordInput }).fill(user.password);
    await page.getByRole('button', { name: TEST_DATA.locators.login.criarContaBtn }).click();

    await expect(page.getByText(user.email)).toBeVisible();
}

export async function logingUserTestAdvitiser(page: Page) {
    await landingHome(page);

    await page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink }).click();
    await page.getByRole('button', { name: TEST_DATA.locators.login.entrarComEmailBtn }).click();
    await page.getByPlaceholder(TEST_DATA.locators.login.emailInput).click();
    await page.getByPlaceholder(TEST_DATA.locators.login.emailInput).fill(process.env.USER_EMAIL_ADVERTISER!);
    await page.getByPlaceholder(TEST_DATA.locators.login.passwordInput).click();
    await page.getByPlaceholder(TEST_DATA.locators.login.passwordInput).fill(process.env.USER_PASSWORD!);
    await page.getByRole('button', { name: TEST_DATA.locators.login.submitBtn }).click();

    await expect(page.getByText(process.env.USER_EMAIL_ADVERTISER!)).toBeVisible();
}
