import { test as base, expect } from '@playwright/test';
import { TEST_DATA } from '../utils/test-data';

type MyFixtures = {
};

export const test = base.extend<MyFixtures>({

  page: async ({ page }, use) => {
    await page.goto('/');
    const cookies = await page.context().cookies();
    const hasSessionCookie = cookies.some(
      cookie => cookie.name === TEST_DATA.auth.cookies.sessionId && Boolean(cookie.value)
    );
    const hasAccountCookie = cookies.some(
      cookie => cookie.name === TEST_DATA.auth.cookies.accountInfo && Boolean(cookie.value)
    );

    if (!hasSessionCookie || !hasAccountCookie) {
      throw new Error('Sessão inválida ou expirada. Verifique o setup de autenticação.');
    }

    await use(page);
  },
});

export { expect };
