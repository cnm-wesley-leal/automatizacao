import { test, expect } from '../fixtures/auth';
import { TEST_DATA } from '../utils/test-data';

test.describe('Verificação de Autenticação', () => {
  test('Deve estar logado após a injeção do cookie', async ({ page }) => {
    // Verifica se os cookies de sessão estão presentes
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === TEST_DATA.auth.cookies.sessionId);
    const authCookie = cookies.find(c => c.name === TEST_DATA.auth.cookies.accountInfo);
    
    expect(sessionCookie).toBeDefined();
    expect(authCookie).toBeDefined();

    console.log('Autenticação confirmada e sessão validada!');
  });
});
