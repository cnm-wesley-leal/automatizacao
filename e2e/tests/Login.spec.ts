import { test, expect } from '@playwright/test'
import { TEST_DATA } from '../utils/test-data'
import {
  dismissCookieConsent,
  assertAuthenticatedCookies,
  assertNoAuthenticatedCookies,
  openAuthPanel,
  openLoginByEmail,
  runSocialLoginWithMock,
  socialProviders,
} from '../utils/helpers'
import { TIMEOUTS } from '../utils/config'

test.describe('Feature Auth - Login e Cadastro', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto(TEST_DATA.urls.base, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page, testInfo)
    await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeVisible()
  })

  test('CT01 - deve realizar login com credenciais validas', async ({ page }) => {
    test.skip(
      !process.env.USER_EMAIL_WEBUSER || !process.env.USER_PASSWORD,
      'Defina USER_EMAIL_WEBUSER e USER_PASSWORD para executar CT01.'
    )

    await openLoginByEmail(page)

    await page.getByPlaceholder(TEST_DATA.locators.login.emailInput).fill(process.env.USER_EMAIL_WEBUSER!)
    await page.getByPlaceholder(TEST_DATA.locators.login.passwordInput).fill(process.env.USER_PASSWORD!)
    await page.getByRole('button', { name: TEST_DATA.locators.login.submitBtn }).click()

    await expect(page.getByText(process.env.USER_EMAIL_WEBUSER!)).toBeVisible()
    await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeHidden()
    await assertAuthenticatedCookies(
      page,
      TIMEOUTS.authCookiesLogin,
      'Cookies de autenticação não foram persistidos após login válido.'
    )
  })

  test('CT02 - deve exibir erro ao tentar login com senha invalida', async ({ page }) => {
    test.skip(!process.env.USER_EMAIL_WEBUSER, 'Defina USER_EMAIL_WEBUSER para executar CT02.')

    await openLoginByEmail(page)

    await page.getByPlaceholder(TEST_DATA.locators.login.emailInput).fill(process.env.USER_EMAIL_WEBUSER!)
    await page.getByPlaceholder(TEST_DATA.locators.login.passwordInput).fill('SenhaInvalida123')
    await page.getByRole('button', { name: TEST_DATA.locators.login.submitBtn }).click()

    await expect(page.getByRole('button', { name: TEST_DATA.locators.login.submitBtn })).toBeVisible()
    await expect(page.getByText(/email e\/ou senha inv[aá]lidos/i)).toBeVisible()
    await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeVisible()

    await assertNoAuthenticatedCookies(page)
  })

  test('CT03 - deve abrir o fluxo de cadastro a partir do login', async ({ page }) => {
    await openAuthPanel(page)
    await expect(page.getByRole('link', { name: TEST_DATA.locators.login.cadastreSeLink })).toBeVisible()
    await page.getByRole('link', { name: TEST_DATA.locators.login.cadastreSeLink }).click()

    await expect(page.getByRole('textbox', { name: TEST_DATA.locators.registration.fullNameInput })).toBeVisible()
    await expect(page.getByRole('textbox', { name: TEST_DATA.locators.registration.emailInput })).toBeVisible()
    await expect(page.getByRole('textbox', { name: TEST_DATA.locators.registration.phoneInput })).toBeVisible()
    await expect(page.getByRole('textbox', { name: TEST_DATA.locators.registration.passwordInput, exact: true })).toBeVisible()
    await expect(page.getByRole('textbox', { name: TEST_DATA.locators.registration.repeatPasswordInput })).toBeVisible()
    await expect(page.getByRole('button', { name: TEST_DATA.locators.login.criarContaBtn })).toBeVisible()
  })

  test('CT04 - deve exibir opcoes de login social', async ({ page }) => {
    await openAuthPanel(page)

    await expect(page.getByRole('button', { name: TEST_DATA.locators.login.entrarComAppleBtn })).toBeVisible()
    await expect(page.getByRole('button', { name: TEST_DATA.locators.login.entrarComGoogleBtn })).toBeVisible()
    await expect(page.getByRole('button', { name: TEST_DATA.locators.login.entrarComFacebookBtn })).toBeVisible()
  })

  test('CT05 - deve realizar login social com mock de sucesso (Google)', async ({ page }) => {
    await runSocialLoginWithMock(page, socialProviders[0], 'success')
  })

  test('CT06 - deve bloquear login social com mock de erro (Google)', async ({ page }) => {
    await runSocialLoginWithMock(page, socialProviders[0], 'error')
  })

  test('CT07 - deve realizar login social com mock de sucesso (Facebook)', async ({ page }) => {
    await runSocialLoginWithMock(page, socialProviders[1], 'success')
  })

  test('CT08 - deve bloquear login social com mock de erro (Facebook)', async ({ page }) => {
    await runSocialLoginWithMock(page, socialProviders[1], 'error')
  })

  test('CT09 - deve realizar login social com mock de sucesso (Apple)', async ({ page }) => {
    await runSocialLoginWithMock(page, socialProviders[2], 'success')
  })

  test('CT10 - deve bloquear login social com mock de erro (Apple)', async ({ page }) => {
    await runSocialLoginWithMock(page, socialProviders[2], 'error')
  })
})
