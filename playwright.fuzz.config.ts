import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'
dotenv.config({ quiet: true })

const isCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e/fuzz',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: isCI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report-fuzz' }], ['json', { outputFile: 'playwright-results-fuzz.json' }]],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    actionTimeout: isCI ? 20000 : 15000,
    navigationTimeout: isCI ? 45000 : 30000,
  },
  timeout: isCI ? 180000 : 120000,
  expect: { timeout: isCI ? 15000 : 10000 },

  projects: [
    { name: 'setup-chromium', testMatch: /auth\.setup\.ts/, testDir: './e2e' },

    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/user.json' },
      dependencies: ['setup-chromium'],
    },
  ],
})
