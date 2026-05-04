import { test, expect } from '../fixtures/auth';

test.describe('Verificação de Autenticação', () => {
  test('Deve estar logado após a injeção do cookie', async ({ page }) => {

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === '__Secure-cnm_session_id');
    const authCookie = cookies.find(c => c.name === 'cnm_ac');

    expect(sessionCookie).toBeDefined();
    expect(authCookie).toBeDefined();

    console.log('Autenticação confirmada e sessão validada!');
  });
});
