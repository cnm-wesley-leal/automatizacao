import { test as setup, expect } from '@playwright/test'
import { TEST_DATA } from './utils/test-data'
import { dismissCookieConsent, hasAuthenticatedCookies, openLoginByEmail } from './utils/helpers'
import { isCI } from './utils/config'

function getStorageStatePath(projectName: string): string {
  if (projectName === 'setup-webkit') return '.auth/user-webkit.json'
  if (projectName === 'setup-ios') return '.auth/user-ios.json'
  return TEST_DATA.auth.statePath
}

setup('authenticate as WebUser', async ({ page }, testInfo) => {
  const userEmail = process.env.USER_EMAIL_WEBUSER
  const userPassword = process.env.USER_PASSWORD
  expect(userEmail, 'USER_EMAIL_WEBUSER não definido para auth.setup.ts').toBeTruthy()
  expect(userPassword, 'USER_PASSWORD não definido para auth.setup.ts').toBeTruthy()

  await page.goto(TEST_DATA.urls.base, { waitUntil: 'networkidle' })
  await dismissCookieConsent(page, testInfo)

  const maxAttempts = 2
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await openLoginByEmail(page)
    await page.getByPlaceholder(TEST_DATA.locators.login.emailInput).fill(userEmail!)
    await page.getByPlaceholder(TEST_DATA.locators.login.passwordInput).fill(userPassword!)
    await page.getByRole('button', { name: TEST_DATA.locators.login.submitBtn }).click()

    try {
      await expect.poll(
        async () => {
          if (await hasAuthenticatedCookies(page)) return true
          const hasEmailInUi = await page.getByText(userEmail!).first().isVisible().catch(() => false)
          const entrarHidden = await page
            .getByRole('link', { name: TEST_DATA.locators.login.entrarLink })
            .isHidden()
            .catch(() => false)
          return hasEmailInUi || entrarHidden
        },
        {
          timeout: isCI ? 45000 : 25000,
          message: 'Login não confirmou estado autenticado por UI ou cookies.',
        }
      ).toBeTruthy()
      break
    } catch {
      if (attempt === maxAttempts) throw new Error('Não foi possível autenticar o usuário no setup após retries.')
      await page.goto(TEST_DATA.urls.base, { waitUntil: 'domcontentloaded' })
      await dismissCookieConsent(page, testInfo)
    }
  }

  await page.context().storageState({ path: getStorageStatePath(testInfo.project.name) })
})
