import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'
dotenv.config({ quiet: true })

const isCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  testIgnore: '**/fuzz/**',
  fullyParallel: true,

  forbidOnly: !!process.env.CI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: [['html'], ['json', { outputFile: 'playwright-results.json' }]],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    actionTimeout: isCI ? 15000 : 10000,
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
      use: { ...devices['Desktop Chrome'], storageState: '.auth/user.json' },
      dependencies: ['setup-chromium'],
    },
    {
      name: 'webkit-safari',
      fullyParallel: false,
      retries: isCI ? 2 : 1,
      timeout: isCI ? 240000 : 180000,
      use: {
        ...devices['Desktop Safari'],
        storageState: '.auth/user-webkit.json',
        actionTimeout: isCI ? 25000 : 18000,
        navigationTimeout: isCI ? 45000 : 30000,
      },
      dependencies: ['setup-webkit'],
    },
    {
      name: 'ios-safari-iphone-14',
      fullyParallel: false,
      retries: isCI ? 2 : 1,
      timeout: isCI ? 240000 : 180000,
      use: {
        ...devices['iPhone 14'],
        storageState: '.auth/user-ios.json',
        actionTimeout: isCI ? 25000 : 18000,
        navigationTimeout: isCI ? 45000 : 30000,
      },
      dependencies: ['setup-ios'],
    },
  ],
})
