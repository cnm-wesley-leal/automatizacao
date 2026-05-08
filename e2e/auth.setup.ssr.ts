import { test as setup, expect } from '@playwright/test'
import { TEST_DATA, SSR_DATA } from './utils/test-data'
import { dismissCookieConsent, assertAuthenticatedCookies } from './utils/helpers'
import { TIMEOUTS } from './utils/config'

type Profile = 'webuser' | 'pf' | 'pj'
type Device = 'chrome' | 'ios'

function detectProfile(projectName: string): Profile {
  if (projectName.includes('webuser')) return 'webuser'
  if (projectName.includes('-pf')) return 'pf'
  return 'pj'
}

function detectDevice(projectName: string): Device {
  return projectName.includes('ios') ? 'ios' : 'chrome'
}

function getAuthPath(profile: Profile, device: Device): string {
  const key = `${profile}${device === 'chrome' ? 'Chrome' : 'Ios'}` as keyof typeof SSR_DATA.authPaths
  return SSR_DATA.authPaths[key]
}

setup('ssr authenticate', async ({ page }, testInfo) => {
  const profile = detectProfile(testInfo.project.name)
  const device = detectDevice(testInfo.project.name)
  const user = SSR_DATA.users[profile]
  const statePath = getAuthPath(profile, device)

  await page.goto(SSR_DATA.baseUrl, { waitUntil: 'networkidle' })
  await dismissCookieConsent(page)

  await expect(
    page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })
  ).toBeVisible({ timeout: TIMEOUTS.authLink })
  await page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink }).click()

  await expect(
    page.getByRole('button', { name: TEST_DATA.locators.login.entrarComEmailBtn })
  ).toBeVisible({ timeout: 10000 })
  await page.getByRole('button', { name: TEST_DATA.locators.login.entrarComEmailBtn }).click()

  await page.getByPlaceholder(TEST_DATA.locators.login.emailInput).fill(user.email)
  await page.getByPlaceholder(TEST_DATA.locators.login.passwordInput).fill(user.password)
  await page.getByRole('button', { name: TEST_DATA.locators.login.submitBtn }).click()

  if (profile === 'pj') {
    await page.waitForURL(/meus-dados/, { timeout: 8000 }).catch(() => {})
    await page.goto(SSR_DATA.baseUrl, { waitUntil: 'domcontentloaded' })
  }

  await assertAuthenticatedCookies(
    page,
    25000,
    `[${testInfo.project.name}] Cookie de sessão não encontrado após login (${user.email})`
  )

  await page.context().storageState({ path: statePath })
})
