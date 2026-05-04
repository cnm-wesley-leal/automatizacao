import { test, expect } from '../fixtures/auth';
import { TEST_DATA } from '../utils/test-data';

test.describe('Verificação de Autenticação', () => {
  test('Deve estar logado após a injeção do cookie', async ({ page }) => {
    await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeHidden();

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === TEST_DATA.auth.cookies.sessionId);
    const authCookie = cookies.find(c => c.name === TEST_DATA.auth.cookies.accountInfo);

    expect(sessionCookie).toBeDefined();
    expect(authCookie).toBeDefined();
    expect(sessionCookie?.value.length ?? 0).toBeGreaterThan(10);
    expect(authCookie?.value.length ?? 0).toBeGreaterThan(10);
    expect(sessionCookie?.secure).toBeTruthy();
    expect(authCookie?.domain ?? '').toContain('chavesnamao.com.br');

    await page.reload();

    const cookiesAfterReload = await page.context().cookies();
    const sessionAfterReload = cookiesAfterReload.find(c => c.name === TEST_DATA.auth.cookies.sessionId);
    const authAfterReload = cookiesAfterReload.find(c => c.name === TEST_DATA.auth.cookies.accountInfo);

    expect(sessionAfterReload).toBeDefined();
    expect(authAfterReload).toBeDefined();
    expect(sessionAfterReload?.value).toBe(sessionCookie?.value);

    await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeHidden();
  });
});
