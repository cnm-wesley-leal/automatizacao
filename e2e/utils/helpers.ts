import { faker } from '@faker-js/faker'
import { Locator, Page, Route, TestInfo, expect } from '@playwright/test'
import { TEST_DATA } from './test-data'
import { TIMEOUTS } from './config'

export type SocialOutcome = 'success' | 'error'

export type SocialProvider = {
  name: 'Google' | 'Facebook' | 'Apple'
  buttonName: string
  oauthSignalRegex: RegExp
}

export const socialProviders: SocialProvider[] = [
  {
    name: 'Google',
    buttonName: TEST_DATA.locators.login.entrarComGoogleBtn,
    oauthSignalRegex: /(accounts\.google\.com|oauth|social\/google|auth\/google)/i,
  },
  {
    name: 'Facebook',
    buttonName: TEST_DATA.locators.login.entrarComFacebookBtn,
    oauthSignalRegex: /(facebook\.com|oauth|social\/facebook|auth\/facebook)/i,
  },
  {
    name: 'Apple',
    buttonName: TEST_DATA.locators.login.entrarComAppleBtn,
    oauthSignalRegex: /(appleid\.apple\.com|oauth|social\/apple|auth\/apple)/i,
  },
]

export async function runSocialLoginWithMock(
  page: Page,
  provider: SocialProvider,
  outcome: SocialOutcome
): Promise<void> {
  const mockHandler = async (route: Route) => {
    const request = route.request()
    if (request.isNavigationRequest()) {
      await route.fulfill({
        status: outcome === 'success' ? 200 : 401,
        contentType: 'text/html',
        body:
          outcome === 'success'
            ? '<html><body>mock social success</body></html>'
            : '<html><body>mock social error</body></html>',
      })
      return
    }
    await route.fulfill({
      status: outcome === 'success' ? 200 : 401,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        success: outcome === 'success',
        provider: provider.name,
        message:
          outcome === 'success'
            ? `${provider.name} mock login success`
            : `${provider.name} mock login error`,
      }),
    })
  }
  await page.context().route(provider.oauthSignalRegex, mockHandler)

  try {
    await openAuthPanel(page)

    const socialButton = page.getByRole('button', { name: provider.buttonName })
    await expect(socialButton).toBeVisible()
    await socialButton.click()

    if (outcome === 'success') {
      await setMockSocialSession(page)
    } else {
      await page.context().clearCookies()
    }

    await page.goto(TEST_DATA.urls.base, { waitUntil: 'load' })
    await expect.poll(() => hasAuthenticatedCookies(page)).toBe(outcome === 'success')
    if (outcome === 'error') {
      await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeVisible()
    }
  } finally {
    await page.context().unroute(provider.oauthSignalRegex, mockHandler)
  }
}

export function fakePhone(): string {
  const ddd = faker.number.int({ min: 11, max: 99 })
  const prefix = faker.number.int({ min: 1000, max: 9999 })
  const suffix = faker.number.int({ min: 1000, max: 9999 })
  return `(${ddd}) 9${prefix}-${suffix}`
}

export async function dismissCookieConsent(page: Page, testInfo?: TestInfo): Promise<void> {
  const btn = page.getByRole('button', { name: TEST_DATA.locators.common.cookieConsent })
  try {
    await expect(btn).toBeVisible({ timeout: TIMEOUTS.cookieConsent })
    await btn.click()
  } catch (err) {
    if (testInfo) {
      testInfo.annotations.push({ type: 'info', description: `Cookie consent não exibido: ${String(err)}` })
    }
  }
}

export async function hasAuthenticatedCookies(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies()
  return (
    cookies.some(c => c.name === TEST_DATA.auth.cookies.sessionId && Boolean(c.value)) &&
    cookies.some(c => c.name === TEST_DATA.auth.cookies.accountInfo && Boolean(c.value))
  )
}

export async function assertAuthenticatedCookies(
  page: Page,
  timeout: number = TIMEOUTS.authCookies,
  message = 'Cookies de autenticação não foram persistidos.'
): Promise<void> {
  await expect.poll(() => hasAuthenticatedCookies(page), { timeout, message }).toBeTruthy()
}

export async function assertNoAuthenticatedCookies(page: Page): Promise<void> {
  const cookies = await page.context().cookies()
  expect(cookies.find(c => c.name === TEST_DATA.auth.cookies.sessionId)).toBeUndefined()
  expect(cookies.find(c => c.name === TEST_DATA.auth.cookies.accountInfo)).toBeUndefined()
}

export function getCookieDomain(baseUrl = TEST_DATA.urls.base): string {
  const host = new URL(baseUrl).hostname
  return host.startsWith('.') ? host : `.${host}`
}

export async function setMockSocialSession(page: Page, baseUrl = TEST_DATA.urls.base): Promise<void> {
  const secure = baseUrl.startsWith('https://')
  await page.context().addCookies([
    {
      name: TEST_DATA.auth.cookies.sessionId,
      value: `mock-social-session-${Date.now()}`,
      domain: getCookieDomain(baseUrl),
      path: '/',
      httpOnly: true,
      secure,
      sameSite: secure ? 'None' : 'Lax',
    },
    {
      name: TEST_DATA.auth.cookies.accountInfo,
      value: `mock-social-account-${Date.now()}`,
      domain: getCookieDomain(baseUrl),
      path: '/',
      httpOnly: false,
      secure,
      sameSite: secure ? 'None' : 'Lax',
    },
  ])
}

export async function openAuthPanel(page: Page): Promise<void> {
  const entrarLink = page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })
  await expect(entrarLink).toBeVisible()
  // Aguarda estabilização pós-hidratação React — o link ganha id="avatar-container" após hidratar
  await page.locator('#avatar-container').waitFor({ state: 'visible', timeout: TIMEOUTS.authLink }).catch(() => {})
  await entrarLink.click()
  await expect(page.getByRole('heading', { name: /acesse ou crie sua conta/i })).toBeVisible()
}

export async function openLoginByEmail(page: Page): Promise<void> {
  await openAuthPanel(page)
  const emailBtn = page.getByRole('button', { name: TEST_DATA.locators.login.entrarComEmailBtn })
  await expect(emailBtn).toBeVisible()
  await emailBtn.click()
  await expect(page.getByPlaceholder(TEST_DATA.locators.login.emailInput)).toBeVisible()
  await expect(page.getByPlaceholder(TEST_DATA.locators.login.passwordInput)).toBeVisible()
}

export async function openFilterPanel(page: Page): Promise<void> {
  await page.waitForLoadState('load')
  // Desktop (1280px+): filter panel is always expanded in the sidebar — no action needed.
  // Mobile: filter panel is hidden behind a "Filtros" button that opens a modal at #filter-full.
  const filtrosBtn = page.locator('button:has-text("Filtros")').first()
  if (await filtrosBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await filtrosBtn.click()
    await page.waitForURL(/.*#filter-full/)
  }
}

export async function applyFilters(page: Page, triggerInput?: Locator): Promise<void> {
  // Mobile: "Aplicar Filtros" button commits all selections from the modal.
  // Desktop: buttons apply immediately on click; inputs apply on Enter key.
  const applyBtn = page.getByRole('button', { name: 'Aplicar Filtros' })
  if (await applyBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await applyBtn.click()
  } else if (triggerInput) {
    await triggerInput.press('Enter')
  }
}

export async function clearFilters(page: Page): Promise<void> {
  const clearBtn = page.getByRole('button', { name: 'Limpar' }).first()
  await expect(clearBtn).toBeVisible()
  await clearBtn.click()
}

export async function expandFilterSection(page: Page, sectionName: string): Promise<void> {
  // Sections are accordions; click the <p> header to expand
  const header = page.locator('p').filter({ hasText: sectionName }).first()
  const isExpanded = await page.getByRole('button', { name: new RegExp(sectionName.split(' ')[0]) }).isVisible().catch(() => false)
  if (!isExpanded) {
    await header.click()
  }
}
