import { test as base, expect } from '@playwright/test';

type MyFixtures = {
};

export const test = base.extend<MyFixtures>({

  page: async ({ page }, use) => {
    await page.goto('/');
    const isLoginVisible = await page.getByRole('link', { name: 'Entrar' }).isVisible();

    if (isLoginVisible) {
      throw new Error('Sessão inválida ou expirada. Verifique o setup de autenticação.');
    }

    await use(page);
  },
});

export { expect };
