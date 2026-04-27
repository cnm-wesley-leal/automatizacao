import { test as base, expect } from '@playwright/test';
import { TEST_DATA } from '../utils/test-data';

// Define the type for our custom fixtures (currently empty if we use standard page)
type MyFixtures = {
  // We keep the generic test so we can add hooks and custom logic
};

export const test = base.extend<MyFixtures>({
  // 💡 Upgrade: Automatic session validation
  // This runs before every test to ensure the injected session is still valid
  page: async ({ page }, use) => {
    // Navigate to a safe page to check auth status (e.g., home)
    await page.goto('/');
    
    // Check if a login indicator is visible (e.g., "Entrar" link)
    // If it is, then the injected session has expired or is invalid
    const isLoginVisible = await page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink }).isVisible();
    
    if (isLoginVisible) {
      throw new Error('Sessão inválida ou expirada. Verifique o setup de autenticação.');
    }

    await use(page);
  },
});

export { expect };
