export const TEST_DATA = {
  urls: {
    base: process.env.BASE_URL || 'https://staging.chavesnamao.com.br',
    login: '/login', // se houver uma URL direta
    dashboard: '/dashboard',
  },
  auth: {
    statePath: '.auth/user.json',
    cookies: {
      sessionId: '__Secure-cnm_session_id',
      accountInfo: 'cnm_ac',
    },
  },
  locators: {
    common: {
      cookieConsent: 'Entendi',
    },
    login: {
      entrarLink: 'Entrar',
      entrarComAppleBtn: 'Entrar com Apple',
      entrarComGoogleBtn: 'Entrar com Google',
      entrarComFacebookBtn: 'Entrar com Facebook',
      entrarComEmailBtn: 'Entrar com email',
      emailInput: 'Email cadastrado',
      passwordInput: 'Senha cadastrada',
      submitBtn: 'Entrar',
      cadastreSeLink: 'Cadastre-se aqui',
      criarContaBtn: 'Criar conta',
    },
    registration: {
      fullNameInput: 'Nome completo',
      emailInput: 'Email',
      phoneInput: 'Telefone/whatsapp',
      passwordInput: 'Senha',
      repeatPasswordInput: 'Repetir senha',
    }
  }
};
