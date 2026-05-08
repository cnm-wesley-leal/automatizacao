import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'
dotenv.config({ quiet: true })

const isCI = !!process.env.CI
const ssrBaseUrl = process.env.SSR_BASE_URL || 'https://qa.chavesnamao.com'

const SSR_PROFILES = ['webuser', 'pf', 'pj'] as const
const SSR_DEVICES = [
  { suffix: 'chrome', config: devices['Desktop Chrome'] },
  { suffix: 'ios', config: devices['iPhone 15'] },
] as const

type SsrProfile = (typeof SSR_PROFILES)[number]
type SsrSuffix = (typeof SSR_DEVICES)[number]['suffix']

function ssrAuthPath(profile: SsrProfile, suffix: SsrSuffix) {
  return `.auth/ssr-${profile}-${suffix}.json`
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: [['html'], ['json', { outputFile: 'playwright-results.json' }]],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    actionTimeout: isCI ? 20000 : 10000,
    navigationTimeout: isCI ? 30000 : 10000,
  },
  timeout: isCI ? 180000 : 120000,
  expect: { timeout: isCI ? 15000 : 10000 },

  projects: [
    // ── Shared auth setup ─────────────────────────────────────────────────────
    { name: 'setup-chromium', testMatch: /auth\.setup\.ts/ },
    { name: 'setup-webkit', testMatch: /auth\.setup\.ts/, use: { ...devices['Desktop Safari'] } },
    { name: 'setup-ios', testMatch: /auth\.setup\.ts/, use: { ...devices['iPhone 14'] } },

    // ── Main test projects ────────────────────────────────────────────────────
    {
      name: 'chromium',
      testIgnore: /SSRRelatedListings\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: '.auth/user.json' },
      dependencies: ['setup-chromium'],
    },
    {
      name: 'webkit-safari',
      testIgnore: /SSRRelatedListings\.spec\.ts/,
      use: { ...devices['Desktop Safari'], storageState: '.auth/user-webkit.json' },
      dependencies: ['setup-webkit'],
    },
    {
      name: 'ios-safari-iphone-14',
      testIgnore: /SSRRelatedListings\.spec\.ts/,
      use: { ...devices['iPhone 14'], storageState: '.auth/user-ios.json' },
      dependencies: ['setup-ios'],
    },

    // ── SSR setup projects (generated) ────────────────────────────────────────
    ...SSR_PROFILES.flatMap(profile =>
      SSR_DEVICES.map(({ suffix, config }) => ({
        name: `setup-ssr-${profile}-${suffix}`,
        testMatch: /auth\.setup\.ssr\.ts/,
        use: { ...config, baseURL: ssrBaseUrl },
      }))
    ),

    // ── SSR test projects ─────────────────────────────────────────────────────
    ...SSR_DEVICES.flatMap(({ suffix, config }) => [
      {
        name: `ssr-${suffix}-anonymous`,
        testMatch: /SSRRelatedListings\.spec\.ts/,
        use: { ...config, baseURL: ssrBaseUrl, storageState: { cookies: [], origins: [] } },
      },
      ...SSR_PROFILES.map(profile => ({
        name: `ssr-${suffix}-${profile}`,
        testMatch: /SSRRelatedListings\.spec\.ts/,
        use: { ...config, baseURL: ssrBaseUrl, storageState: ssrAuthPath(profile, suffix) },
        dependencies: [`setup-ssr-${profile}-${suffix}`],
      })),
    ]),
  ],
})
