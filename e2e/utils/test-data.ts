export const SSR_DATA = {
  baseUrl: process.env.SSR_BASE_URL || 'https://qa.chavesnamao.com',
  urls: {
    realtyListings: '/imoveis-a-venda/',
    vehicleListings: '/carros-usados/',
  },
  users: {
    webuser: {
      email: process.env.SSR_USER_EMAIL_WEBUSER || process.env.USER_EMAIL_WEBUSER || '',
      password: process.env.SSR_USER_PASSWORD || process.env.USER_PASSWORD || '',
    },
    pf: {
      email: process.env.SSR_USER_EMAIL_PF || '',
      password: process.env.SSR_USER_PASSWORD_PF || process.env.USER_PASSWORD || '',
    },
    pj: {
      email: process.env.SSR_USER_EMAIL_PJ || '',
      password: process.env.SSR_USER_PASSWORD_PJ || process.env.USER_PASSWORD || '',
    },
  },
  authPaths: {
    webuserChrome: '.auth/ssr-webuser-chrome.json',
    webuserIos: '.auth/ssr-webuser-ios.json',
    pfChrome: '.auth/ssr-pf-chrome.json',
    pfIos: '.auth/ssr-pf-ios.json',
    pjChrome: '.auth/ssr-pj-chrome.json',
    pjIos: '.auth/ssr-pj-ios.json',
  },
}

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
