# Projeto de Automatização E2E - Chaves na Mão

Suíte de testes End-to-End para a plataforma **Chaves na Mão**, cobrindo autenticação, cadastro e navegação no ambiente de staging.

## 🚀 Tecnologias

| Biblioteca | Uso |
|---|---|
| [Playwright](https://playwright.dev/) | Framework de testes E2E |
| [TypeScript](https://www.typescriptlang.org/) | Linguagem principal |
| [Faker.js](https://fakerjs.dev/) | Geração de dados randômicos |
| [Dotenv](https://github.com/motdotla/dotenv) | Variáveis de ambiente |
| [tdpw](https://npmjs.com/package/tdpw) | Integração TestDino |

---

## 🛠️ Configuração Inicial

### Pré-requisitos
```bash
node --version    # v18 ou superior
npm --version     # v8 ou superior
```

### Instalação
```bash
cd "c:\Automatização"
npm install
npx playwright install
```

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz (use `.env.example` como referência):
```env
# Credenciais de teste
USER_EMAIL_WEBUSER=seu_email@example.com
USER_PASSWORD=sua_senha
BASE_URL=https://staging.chavesnamao.com.br

# Integração TestDino (opcional)
TESTDINO_URL=https://app.testdino.com
TESTDINO_API_KEY=sk_test_xxxxx
TESTDINO_PROJECT_ID=project_69f8d13e2ddbbf162897e7c9
TESTDINO_ORG_ID=org_69f8d13c2ddbbf162897e7ae
```

> ⚠️ **Nunca commite o arquivo `.env`** — ele está no `.gitignore`.

---

## 🔐 Estratégia de Autenticação

O projeto usa **Injeção de Cookies** para evitar logins repetidos a cada teste:

1. **`auth.setup.ts`** — Faz login via UI uma única vez e salva o estado em `.auth/user.json`.
2. **Reuso de Sessão** — Todos os testes carregam esse estado automaticamente.
3. **Validação** — A fixture `e2e/fixtures/auth.ts` verifica a validade da sessão antes de cada teste.

---

## 📁 Estrutura do Projeto

```
e2e/
├── auth.setup.ts              ← Setup de autenticação (roda 1x)
├── fixtures/
│   ├── auth.ts                ← Fixture com injeção de sessão
│   └── fakerUser.ts           ← Gerador de usuários fake
├── pages/
│   ├── HeaderPage.ts          ← Page Object do header
│   ├── LocationSearchPage.ts  ← Page Object de busca
│   └── RegisterPage.ts        ← Page Object de cadastro
├── tests/
│   ├── AuthCheck.spec.ts      ← Verificação de sessão (1 teste)
│   ├── Header.spec.ts         ← Testes de navegação
│   ├── Home.spec.ts           ← Testes da home
│   ├── Login.spec.ts          ← Login com email e social (10 testes)
│   ├── RealtySearch.spec.ts   ← Busca de imóveis
│   └── Register.spec.ts       ← Cadastro de usuários (7 testes)
├── fuzz/
│   └── RealtySearchFuzz.spec.ts ← Testes fuzz de busca
└── utils/
    ├── config.ts              ← Configurações centralizadas
    ├── test-data.ts           ← URLs, locators e cookies
    └── helpers.ts             ← Funções utilitárias
```

**Centralização de dados** — `e2e/utils/test-data.ts` contém todos os seletores, URLs e nomes de cookies. Evite hardcode nos spec files.

---

## 🏃 Executando os Testes

### Comandos principais

| Comando | Descrição |
|---|---|
| `npm test` | Todos os testes (headless) — padrão CI |
| `npm run test:e2e:headed` | Com navegador visível (debug local) |
| `npm run test:e2e:ui` | Interface interativa Playwright |
| `npm run test:with-testdino` | Testes + envio automático ao TestDino |

### Comandos avançados
```bash
# Teste específico por arquivo
npx playwright test Login.spec.ts
npx playwright test Register.spec.ts

# Teste específico por nome
npx playwright test -g "CT01"

# Com retries (para testes flaky)
npx playwright test --retries=2

# Modo debug com inspetor
npx playwright test --debug

# Trace completo (para análise de falhas)
npx playwright test --trace=on

# Paralelização customizada
npx playwright test --workers=4
```

### Relatórios
```bash
# Abrir último relatório HTML
npx playwright show-report

# Gerar relatório JSON
npx playwright test --reporter=json > results.json
```

---

## 🧪 Suites de Teste

### Suite 1 — Login com Email (2 testes)
| ID | Caso de Teste | Status |
|---|---|---|
| CT01 | Login com credenciais válidas | ✅ |
| CT02 | Erro ao login com senha inválida | ✅ |

### Suite 2 — Login Social (7 testes)
| ID | Caso de Teste | Status |
|---|---|---|
| CT04 | Exibir opções de login social | ✅ |
| CT05 | Google — mock sucesso | ⚠️ flaky |
| CT06 | Google — mock erro | ✅ |
| CT07 | Facebook — mock sucesso | ⚠️ flaky |
| CT08 | Facebook — mock erro | ✅ |
| CT09 | Apple — mock sucesso | ✅ |
| CT10 | Apple — mock erro | ✅ |

### Suite 3 — Cadastro de Usuários (7 testes)
| ID | Caso de Teste | Status |
|---|---|---|
| CT03 | Abrir fluxo de cadastro | ✅ |
| CT11 | Cadastro com dados válidos | ✅ |
| CT12 | Erro com email duplicado | ✅ |
| CT13 | Validação de força de senha | ✅ |
| CT14 | Senhas não coincidentes | ✅ |
| CT15 | Validação de formato de email | ❌ |
| CT16 | Consentimento de Termos | ✅ |

### Suite 4 — Verificação de Autenticação (1 teste)
| Caso de Teste | Status |
|---|---|
| Persistência de sessão após injeção de cookies | ✅ |

---

## 🔧 Solução de Problemas

| Problema | Causa provável | Solução |
|---|---|---|
| `USER_EMAIL_WEBUSER não definido` | Arquivo `.env` ausente | Criar `.env` com as variáveis |
| Testes em timeout | Staging lento | Aumentar `actionTimeout` em `playwright.config.ts` |
| Cookies não persistidos | Setup falhou | Rodar `--headed` e verificar o login manualmente |
| Teste flaky aleatório | Timing / ambiente | `npx playwright test --retries=2` |
| Erro 401 TestDino | API Key inválida | Verificar `TESTDINO_API_KEY` no `.env` |

---

## 📊 Relatórios

Os relatórios HTML ficam em `playwright-report/index.html` após cada execução.

| Ícone | Significado |
|---|---|
| 🟢 PASSED | Teste passou |
| 🔴 FAILED | Teste falhou com erro |
| 🟡 FLAKY | Resultado inconsistente |
| ⏭️ SKIPPED | Teste pulado |

---

## 💡 Boas Práticas

- Usar dados do `.env` para credenciais — nunca hardcode
- Usar Faker para dados dinâmicos de usuário
- Centralizar locators em `test-data.ts`
- Não usar `sleep` fixo — preferir `waitFor` / polling do Playwright
- Manter testes independentes entre si

---

## 📋 Checklist Antes de Commitar

- [ ] Todos os testes passam localmente
- [ ] Sem `console.log` acidentais
- [ ] Credenciais não incluídas no commit
- [ ] `.env.example` reflete todas as variáveis necessárias
- [ ] Documentação atualizada se houver mudança de comportamento

---

## 🔗 Referências

- [FLUXOS_VISUAIS.md](FLUXOS_VISUAIS.md) — Diagramas de cobertura por fluxo
- [TESTDINO.md](TESTDINO.md) — Configuração da integração TestDino
- [Playwright Docs](https://playwright.dev)
- [Faker.js Docs](https://fakerjs.dev)

---

**Última atualização:** 15/05/2026 | **Status:** ✅ Pronto para Produção
