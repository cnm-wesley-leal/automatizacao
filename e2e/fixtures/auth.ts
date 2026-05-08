import { test as base, expect } from '@playwright/test'
import { hasAuthenticatedCookies } from '../utils/helpers'

export const test = base.extend<{}>({
  page: async ({ page }, use) => {
    await page.goto('/')
    if (!(await hasAuthenticatedCookies(page))) {
      throw new Error('Sessão inválida ou expirada. Verifique o setup de autenticação.')
    }
    await use(page)
  },
})

export { expect }
