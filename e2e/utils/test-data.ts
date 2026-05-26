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

  // ── Busca por endereço ─────────────────────────────────────────────────────
  locationSearch: {
    urls: {
      campinas:        '/imoveis/sp-campinas/',
      campinasRent:    '/imoveis-para-alugar/sp-campinas/',
      campinasLaunches:'/lancamentos-imoveis/sp-campinas/',
      // URL que produz zero resultados dentro de uma cidade para CT40
      zeroResultsCity: '/imoveis/sp-campinas/?filtro=pmin:9000000000,pmax:10000000000,ban:4,gar:4',
    },

    // Cidade-alvo usada nos testes de integração
    city: {
      name:        'Campinas',
      state:       'SP',
      slug:        'sp-campinas',
      slugPattern: /sp-campinas/,
      h1Pattern:   /campinas/i,
    },

    // Dados para desambiguação (CT43): termo ambíguo + padrões de match exato e parcial
    disambig: {
      searchTerm:           'Santos',
      exactMatchPattern:    /^santos[\s,\-–]/i,
      partialMatchPatterns: [/santos dumont/i, /santo andr/i],
    },

    // Dados para normalização de acentos (CT45)
    accentTest: {
      typedValue:      'sao paulo',
      expectedPattern: /são paulo/i,
    },

    // Pools de dados para o fuzz de endereço (CT54)
    fuzz: {
      cities: [
        'sp-sao-paulo',
        'rj-rio-de-janeiro',
        'sp-campinas',
        'pr-curitiba',
        'mg-belo-horizonte',
        'ce-fortaleza',
        'ba-salvador',
        'df-brasilia',
        'go-goiania',
        'pe-recife',
      ],
      transactionPrefixes: [
        '/imoveis/',
        '/imoveis-para-alugar/',
        '/imoveis-a-venda/',
        '/lancamentos-imoveis/',
      ],
    },
  },
}

export const HOME_DATA = {
  h1: 'Encontre milhões de imóveis, carros e motos',
  tabs: {
    realty: '/?segment=realty',
    vehicle: '/?segment=vehicle',
  },
  realty: {
    locationInputId: 'locationInput-input',
    locationPlaceholder: 'Digite cidade, bairro ou rua',
    buscarHref: '/imoveis/brasil/',
    redirectPattern: /\/imoveis\//,
  },
  vehicle: {
    brandInputId: 'bmv-select-input-d-i-input',
    brandPlaceholder: 'Digite marca ou modelo',
    cityInputId: 'cityInput-input',
    cityPlaceholder: 'Digite uma cidade',
    buscarHref: '/carros-usados/brasil/',
    redirectPattern: /\/carros-usados\//,
  },
  sections: {
    realtyH2: /próximo imóvel/i,
    realtyH3Type: /procure por tipo de imóvel/i,
    realtyH3Amenity: /comodidade que mais importa/i,
    vehicleH2: /carros, motos e utilitários/i,
    vehicleH3Type: /procure por tipo de carroceria/i,
  },
  navLinks: {
    forRent: '/imoveis-para-alugar/brasil/',
    forSale: '/imoveis-a-venda/brasil/',
    vehicles: '/carros-usados/brasil/',
    motorcycles: '/motos-usadas/brasil/',
    advertise: '/anunciar-imoveis-carros-e-motos/',
  },
  quickLinks: {
    realty: {
      apartment: '/apartamentos/brasil/',
      house: '/casas/brasil/',
    },
    vehicle: {
      sedan: '/carros-sedas/brasil/?filtro=car:[6]',
      hatchback: '/carros-hatchback/brasil/?filtro=car:[4]',
    },
  },
}

export const IDWALL_DATA = {
  urls: {
    createFlowPf: '/anunciar-gratis-imoveis-casas-apartamentos/pessoa-fisica/?started=true',
    steps: {
      informacoes: '?etapa=informacoes',
      escolhaPlano: '?etapa=escolha-plano',
      preco: '?etapa=preco',
      caracteristicas: '?etapa=caracteristicas',
      areaCondominio: '?etapa=area-condominio',
      fotosVideo: '?etapa=fotos-e-video',
      tituloDescricao: '?etapa=titulo-e-descricao',
      contato: '?etapa=contato',
      dadosPessoais: '?etapa=dados-pessoais',
      verificacaoIdentidade: '?etapa=verificacao-identidade',
    },
  },
  api: {
    identityStart: '**/account/identity-verification/start',
    identityStatus: '**/account/identity-verification/status**',
  },
  locators: {
    consentCheckboxText: /autorizo|consentimento|uso da minha imagem/i,
    photoBtn: /tirar foto/i,
    continuarBtn: 'Continuar',
    voltarBtn: 'Voltar',
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
