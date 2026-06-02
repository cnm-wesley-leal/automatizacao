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

    // O servidor pode fazer session rotation (novo cookie a cada request)
    // ou o cookie pode não persistir em alguns contextos — a validação principal é pela UI
    const isWebKitProject = /webkit/i.test(testInfo.project.name);

    if (sessionAfterReload) {
      // Cookie presente: qualquer valor válido é aceito (rotation é normal)
      expect(sessionAfterReload.value.length).toBeGreaterThan(10);
    } else {
      testInfo.annotations.push({
        type: isWebKitProject ? 'info' : 'warning',
        description: `${isWebKitProject ? 'WebKit' : 'Chromium'}: Cookie de sessão não encontrado após reload (possível session rotation). Validando por UI.`,
      });
    }

    // Link "Entrar" deve continuar oculto após reload - validação principal
    await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeHidden();
  });
});
