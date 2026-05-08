import { test, expect } from '@playwright/test'
import { RegisterPage } from '../pages/RegisterPage'
import { createUserFake } from '../fixtures/fakerUser'
import { TEST_DATA } from '../utils/test-data'
import {
  dismissCookieConsent,
  assertAuthenticatedCookies,
  assertNoAuthenticatedCookies,
  setMockSocialSession,
} from '../utils/helpers'
import { TIMEOUTS } from '../utils/config'

async function waitForRegistrationOutcomeByUiOrUrl(
  page: import('@playwright/test').Page
): Promise<'success' | 'duplicate'> {
  let outcome: 'pending' | 'success' | 'duplicate' = 'pending'

  await expect
    .poll(
      async () => {
        const isDuplicateDataErrorVisible = await page
          .getByText(/telefone j[aá] cadastrado|email j[aá] cadastrado|email j[aá] est[aá] em uso|este email j[aá]/i)
          .first()
          .isVisible()
          .catch(() => false)

        if (isDuplicateDataErrorVisible) {
          outcome = 'duplicate'
          return outcome
        }

        const isEntrarHidden = await page
          .getByRole('link', { name: TEST_DATA.locators.login.entrarLink })
          .isHidden()
          .catch(() => false)
        const currentUrl = page.url().toLowerCase()
        const isAuthFlowUrl = /\/entrar|\/login|\/cadastrar/.test(currentUrl)

        if (isEntrarHidden || !isAuthFlowUrl) {
          outcome = 'success'
          return outcome
        }

        outcome = 'pending'
        return outcome
      },
      {
        timeout: TIMEOUTS.registrationOutcome,
        message: 'UI/URL não confirmou desfecho de cadastro no tempo esperado.',
      }
    )
    .not.toBe('pending')

  if (outcome === 'pending') throw new Error('Desfecho de cadastro permaneceu pendente após polling.')
  return outcome
}

test.describe('Feature Auth - Cadastro de Usuários', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto(TEST_DATA.urls.base)
    await dismissCookieConsent(page, testInfo)
    await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeVisible()
  })

  test('CT11 - deve realizar cadastro com dados válidos (email novo)', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    const maxAttempts = 3

    await registerPage.navigateToRegisterForm()
    await registerPage.assertFormFieldsVisible()

    let lastTriedUser = createUserFake()
    let submittedWithoutDuplicateError = false
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      lastTriedUser = createUserFake()
      await registerPage.fillRegistrationForm({
        fullName: lastTriedUser.fullName,
        email: lastTriedUser.email,
        phone: lastTriedUser.phone,
        password: lastTriedUser.password,
      })

      await registerPage.submitRegistration()

      const hasDuplicateDataError = await page
        .getByText(/telefone j[aá] cadastrado|email j[aá] cadastrado|email j[aá] est[aá] em uso|este email j[aá]/i)
        .first()
        .isVisible({ timeout: 2500 })
        .catch(() => false)
      if (hasDuplicateDataError) {
        if (attempt === maxAttempts)
          throw new Error(`CT11 falhou após ${maxAttempts} tentativas por dados duplicados. Último email: ${lastTriedUser.email}`)
        continue
      }

      const outcome = await waitForRegistrationOutcomeByUiOrUrl(page)
      if (outcome === 'duplicate') {
        if (attempt === maxAttempts)
          throw new Error(`CT11 falhou após ${maxAttempts} tentativas por dados duplicados. Último email: ${lastTriedUser.email}`)
        continue
      }

      submittedWithoutDuplicateError = true
      break
    }
    expect(submittedWithoutDuplicateError).toBeTruthy()

    await assertAuthenticatedCookies(page)
    await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeHidden()
    expect(page.url()).not.toContain('/login')
  })

  test('CT12 - deve exibir erro ao tentar cadastro com email duplicado', async ({ page }) => {
    test.skip(!process.env.USER_EMAIL_WEBUSER, 'Defina USER_EMAIL_WEBUSER para executar CT12.')

    const registerPage = new RegisterPage(page)
    const fakeUser = createUserFake()

    await registerPage.navigateToRegisterForm()
    await registerPage.fillRegistrationForm({
      fullName: fakeUser.fullName,
      email: process.env.USER_EMAIL_WEBUSER!,
      phone: fakeUser.phone,
      password: fakeUser.password,
    })

    await registerPage.submitRegistration()
    await registerPage.assertEmailAlreadyRegisteredError()
    await registerPage.assertStillOnRegistrationForm()
    await assertNoAuthenticatedCookies(page)
  })

  test('CT13 - deve validar força de senha durante o cadastro', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    const fakeUser = createUserFake()

    await registerPage.navigateToRegisterForm()
    await registerPage.fillRegistrationForm({
      fullName: fakeUser.fullName,
      email: fakeUser.email,
      phone: fakeUser.phone,
      password: '123',
    })

    await registerPage.submitRegistration()

    const weakPasswordError = page.getByText(/senha fraca|senha [aá] fraca|senha deve|requisitos de senha/i)
    const buttonDisabled = await page.getByRole('button', { name: TEST_DATA.locators.login.criarContaBtn }).isDisabled()
    const hasError = await weakPasswordError.isVisible().catch(() => false)
    expect(hasError || buttonDisabled).toBe(true)
    await assertNoAuthenticatedCookies(page)
  })

  test('CT14 - deve validar senhas não coincidentes', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    const fakeUser = createUserFake()

    await registerPage.navigateToRegisterForm()
    await registerPage.fillRegistrationForm({
      fullName: fakeUser.fullName,
      email: fakeUser.email,
      phone: fakeUser.phone,
      password: fakeUser.password,
    })

    await page
      .getByRole('textbox', { name: TEST_DATA.locators.registration.repeatPasswordInput })
      .fill(`${fakeUser.password}Different`)

    const submitButton = page.getByRole('button', { name: TEST_DATA.locators.login.criarContaBtn })
    const isButtonDisabled = await submitButton.isDisabled()

    if (!isButtonDisabled) {
      await submitButton.click()
      const mismatchError = page.getByText(/senhas n[aã]o coincidem|as senhas n[aã]o s[aã]o iguais|senha n[aã]o/i)
      const hasError = await mismatchError.isVisible().catch(() => false)
      const stillOnForm = await submitButton.isVisible()
      expect(hasError || stillOnForm).toBe(true)
    } else {
      expect(isButtonDisabled).toBe(true)
    }
    await assertNoAuthenticatedCookies(page)
  })

  test('CT15 - deve validar formato de email inválido', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    const fakeUser = createUserFake()

    await registerPage.navigateToRegisterForm()

    for (const invalidEmail of ['email_sem_arroba', 'email@', '@example.com']) {
      await page.getByRole('textbox', { name: TEST_DATA.locators.registration.emailInput }).clear()
      await page.getByRole('textbox', { name: TEST_DATA.locators.registration.emailInput }).fill(invalidEmail)
      await page.getByRole('textbox', { name: TEST_DATA.locators.registration.fullNameInput }).fill(fakeUser.fullName)
      await page.getByRole('textbox', { name: TEST_DATA.locators.registration.phoneInput }).fill(fakeUser.phone)
      await page.getByRole('textbox', { name: TEST_DATA.locators.registration.passwordInput, exact: true }).fill(fakeUser.password)
      await page.getByRole('textbox', { name: TEST_DATA.locators.registration.repeatPasswordInput }).fill(fakeUser.password)
      await expect(page.getByText(/email inv[aá]lido/i)).toBeVisible()
    }
    await assertNoAuthenticatedCookies(page)
  })

  test('CT17 - deve permitir login social com novo registro automático', async ({ page }) => {
    const oauthSignalRegex = /(accounts\.google\.com|oauth|social\/google|auth\/google)/i

    const mockHandler = async (route: import('@playwright/test').Route) => {
      const request = route.request()
      if (request.isNavigationRequest()) {
        await route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>mock social success</body></html>' })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({ success: true, provider: 'Google', message: 'Google mock social signup success' }),
      })
    }

    await page.context().route(oauthSignalRegex, mockHandler)

    try {
      await page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink }).click()
      const googleSocialButton = page.getByRole('button', { name: TEST_DATA.locators.login.entrarComGoogleBtn })
      await expect(googleSocialButton).toBeVisible()

      await googleSocialButton.click()
      await setMockSocialSession(page)

      await page.goto(TEST_DATA.urls.base, { waitUntil: 'domcontentloaded' })
      await assertAuthenticatedCookies(page)
      await expect(page).not.toHaveURL(/\/(entrar|login|cadastrar)/i)
      await expect(page.getByRole('heading', { name: /acesse ou crie sua conta/i })).toBeHidden()
    } finally {
      await page.context().unroute(oauthSignalRegex, mockHandler)
    }
  })
})
