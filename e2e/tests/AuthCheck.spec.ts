import { test, expect } from '../fixtures/auth';
import { TEST_DATA } from '../utils/test-data';

test.describe('Verificação de Autenticação', () => {
  test('Deve estar logado após a injeção do cookie', async ({ page }, testInfo) => {
    await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeHidden();

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === TEST_DATA.auth.cookies.sessionId);
    const authCookie = cookies.find(c => c.name === TEST_DATA.auth.cookies.accountInfo);

    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.value.length ?? 0).toBeGreaterThan(10);
    expect(sessionCookie?.secure).toBeTruthy();

    // Account cookie pode não estar presente dependendo da resposta do backend
    const hasAccountCookie = Boolean(authCookie?.value);
    if (hasAccountCookie) {
      expect(authCookie?.value.length ?? 0).toBeGreaterThan(10);
      expect(authCookie?.domain ?? '').toContain('chavesnamao.com.br');
    }

    await page.reload();

    const cookiesAfterReload = await page.context().cookies();
    const sessionAfterReload = cookiesAfterReload.find(c => c.name === TEST_DATA.auth.cookies.sessionId);

    // WebKit em alguns contextos pode perder cookies após reload em storageState
    // Validar que o usuário permanece logado pela UI é o mais importante
    const isWebKitProject = /webkit/i.test(testInfo.project.name);
    
    if (!isWebKitProject) {
      // Em Chromium, esperamos que a sessão persista
      expect(sessionAfterReload).toBeDefined();
      expect(sessionAfterReload?.value).toBe(sessionCookie?.value);
    } else {
      // WebKit pode ter perda de cookies - anotar isso
      if (!sessionAfterReload) {
        testInfo.annotations.push({
          type: 'info',
          description: 'WebKit: Cookie de sessão não persiste após reload com storageState. Validando por UI.',
        });
      }
    }

    // Link "Entrar" deve continuar oculto após reload - validação principal
    await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeHidden();
  });
});
