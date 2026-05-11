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

export const REALTY_SEARCH_DATA = {
  urls: {
    listings: '/imoveis/brasil/',
    forRent: '/imoveis-para-alugar/brasil/',
    forSale: '/imoveis-a-venda/brasil/',
    launches: '/lancamentos-imoveis/brasil/',
    apartments: '/apartamentos/brasil/',
    zeroResults: '/imoveis-para-alugar/brasil/?filtro=pmin:9000000000,pmax:10000000000,ban:4,gar:4',
    directOwner: '/imoveis-para-alugar-direto-com-o-proprietario/brasil/',
  },
  api: {
    navigationFilters: '/api/realestate/aggregations/navigationFilters/',
    extraFilters: '/api/realestate/listing/filters/getExtraFilters/',
  },
  featureIds: {
    piscina: 5,
    elevador: 12,
    churrasqueira: 3,
    playground: 6,
    varanda: 13,
    interfone: 30,
  },
  sortCodes: {
    relevantes: 'or:0',
    menorPreco: 'or:1',
    maiorPreco: 'or:2',
    menorArea: 'or:3',
    maiorArea: 'or:4',
    recentes: 'or:6',
  },
  filterPanel: {
    triggerBtn: 'Filtros',
    applyBtn: 'Aplicar Filtros',
    clearBtn: 'Limpar',
    priceMinId: 'pmin-input',
    priceMaxId: 'pmax-input',
    areaMinId: 'amin-input',
    areaMaxId: 'amax-input',
  },
  transactionTypes: {
    comprar: 'Comprar',
    alugar: 'Alugar',
    lancamentos: 'Lançamentos',
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
