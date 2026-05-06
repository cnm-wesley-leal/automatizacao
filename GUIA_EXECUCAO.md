# 🎬 Guia de Execução - Suite de Testes QA
## Automação Playwright - Chaves na Mão

---

## 🚀 Quick Start (5 minutos)

### 1. Pré-requisitos
```bash
# Verificar versões necessárias
node --version    # v18 ou superior
npm --version     # v8 ou superior
```

### 2. Instalação
```bash
# Clonar/abrir projeto
cd "c:\Automatização"

# Instalar dependências
npm install
npx playwright install
```

### 3. Configurar Variáveis de Ambiente
```bash
# Criar arquivo .env na raiz do projeto
cp .env.example .env

# Editar .env com seus dados:
USER_EMAIL_WEBUSER=seu_email@example.com
USER_PASSWORD=sua_senha
BASE_URL=https://staging.chavesnamao.com.br
```

### 4. Rodar Testes
```bash
# Executar todos os testes
npm test

# Ou com interface interativa
npm run test:e2e:ui

# Ou com navegador visível
npm run test:e2e:headed
```

### 5. Visualizar Relatório
```bash
# Abrir relatório HTML
npx playwright show-report
```

---

## 📋 Comandos Disponíveis

### Execução
| Comando | Descrição | Quando usar |
|---------|-----------|------------|
| `npm test` | Roda todos os testes (headless) | CI/CD ou rotina |
| `npm run test:e2e` | Alias para `npm test` | Quick test |
| `npm run test:e2e:headed` | Roda com navegador visível | Debug local |
| `npm run test:e2e:ui` | Interface interativa Playwright | Desenvolvimento |

### Testes Específicos
```bash
# Apenas testes de login
npx playwright test Login.spec.ts

# Apenas testes de cadastro
npx playwright test Register.spec.ts

# Apenas autenticação
npx playwright test AuthCheck.spec.ts

# Teste específico por nome
npx playwright test -g "CT01"

# Modo debug
npx playwright test --debug
```

### Relatórios
```bash
# Visualizar último relatório
npx playwright show-report

# Gerar relatório em JSON
npx playwright test --reporter=json > results.json

# Reporter detalhado
npx playwright test --reporter=list
npx playwright test --reporter=html
```

---

## 🧪 Estrutura de Testes

### Suite 1: Login com Email (2 testes)
```bash
CT01 - Login com credenciais válidas
CT02 - Erro ao tentar login com senha inválida
```

### Suite 2: Navegação de Cadastro (1 teste)
```bash
CT03 - Abrir fluxo de cadastro a partir do login
```

### Suite 3: Login Social (7 testes)
```bash
CT04 - Exibir opções de login social
CT05 - Google - mock sucesso ⚠️ (flaky)
CT06 - Google - mock erro
CT07 - Facebook - mock sucesso ⚠️ (flaky)
CT08 - Facebook - mock erro
CT09 - Apple - mock sucesso
CT10 - Apple - mock erro
```

### Suite 4: Cadastro de Usuários (7 testes)
```bash
CT11 - Cadastro com dados válidos (email novo)
CT12 - Erro ao tentar cadastro com email duplicado
CT13 - Validação de força de senha
CT14 - Validação de senhas não coincidentes
CT15 - Validação de formato de email ⚠️ (inadequado)
CT16 - Validação de consentimento de Termos (condicional)
CT17 - Login social com novo registro (skipped)
```

### Suite 5: Verificação de Autenticação (1 teste)
```bash
AuthCheck - Verificação de sessão após injeção de cookies
```

---

## 🔧 Solução de Problemas

### ❌ "USER_EMAIL_WEBUSER não definido"
```bash
# Solução
# 1. Criar arquivo .env
# 2. Adicionar: USER_EMAIL_WEBUSER=seu_email@example.com
# 3. Testar novamente
```

### ❌ Testes ficam em timeout
```bash
# Possível causa: Staging lento
# Solução: Aumentar timeout
# Editar: playwright.config.ts
# Mudar: actionTimeout: 20000 (de 10000)
```

### ❌ Cookies não foram persistidos
```bash
# Possível causa: Setup falhou
# Solução: Executar com --headed para debug
npm run test:e2e:headed
# Verificar se login realmente funciona
```

### ❌ Teste falhando aleatoriamente (flaky)
```bash
# Possível causa: Timing ou staging lento
# Solução: Executar novamente
npm test -- --retries=2
```

---

## 📊 Entendendo os Resultados

### Relatório HTML
```
playwright-report/
├── index.html ← Abra este arquivo
├── data/
└── trace/
```

**Interpretando o relatório:**
- 🟢 **PASSED:** Teste executado com sucesso
- 🔴 **FAILED:** Teste falhou com erro
- 🟡 **FLAKY:** Teste passa e falha aleatoriamente
- ⏭️ **SKIPPED:** Teste pulado (configurado para pular)

### Console Output
```
✅ 14 passed (49.0s)
❌ 3 failed
⏭️  2 skipped
```

---

## 🏗️ Estrutura de Pastas

```
e2e/
├── auth.setup.ts                   ← Setup de autenticação
│
├── fixtures/
│   ├── auth.ts                     ← Fixture customizada
│   └── fakerUser.ts                ← Gerador de dados fake
│
├── pages/
│   └── RegisterPage.ts             ← Page Object para cadastro
│
├── tests/
│   ├── AuthCheck.spec.ts          ← Testes de autenticação (1)
│   ├── Login.spec.ts              ← Testes de login (10)
│   └── Register.spec.ts           ← Testes de cadastro (7)
│
└── utils/
    ├── test-data.ts               ← Dados centralizados
    └── helpers.ts                 ← Funções utilitárias
```

---

## 💡 Boas Práticas

### ✅ Fazer
- ✅ Usar dados do `.env` para credenciais
- ✅ Usar Faker para gerar dados dinâmicos
- ✅ Centralizar locators em `test-data.ts`
- ✅ Reutilizar Page Objects
- ✅ Adicionar descrições claras aos testes
- ✅ Executar testes regularmente

### ❌ Evitar
- ❌ Hardcoding de valores
- ❌ Sleeps fixos (usar wait/polling)
- ❌ Testes interdependentes
- ❌ Sem tratamento de erros
- ❌ Testes muito longos/complexos

---

## 📈 Otimizações

### Performance
```bash
# Executar com mais workers (paralelização)
npx playwright test --workers=8

# Executar com menos workers (economia de recursos)
npx playwright test --workers=2
```

### Debug Avançado
```bash
# Ativar trace (gravação de sessão)
npx playwright test --trace=on

# Modo debug com inspetor
npx playwright test --debug

# Gerar vídeo de falhas
npx playwright test --headed
```

---

## 🔐 Segurança

### Variáveis Sensíveis
⚠️ **NUNCA** commitar credenciais no Git:
```bash
# Certificar que .env está em .gitignore
cat .gitignore | grep .env
```

### Cookies e Autenticação
- Cookies são salvos em `.auth/user.json` (gitignored)
- Sessão expira automaticamente
- Re-autenticação acontece no setup

---

## 📞 Suporte

### Documentação
- [README.md](README.md) - Visão geral do projeto
- [RELATORIO_COBERTURA_QA.md](RELATORIO_COBERTURA_QA.md) - Análise detalhada
- [RELATORIO_TESTES_FINAL.md](RELATORIO_TESTES_FINAL.md) - Resultados finais
- [SUMARIO_EXECUTIVO.md](SUMARIO_EXECUTIVO.md) - Sumário executivo

### Links Úteis
- [Playwright Docs](https://playwright.dev)
- [Faker.js Docs](https://fakerjs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

### Contatos
- **Engenheiro QA:** Especialista em Automação
- **Última Atualização:** 04/05/2026
- **Status:** ✅ Pronto para Produção

---

## 📋 Checklist Antes de Commitar

- [ ] Todos os testes passam localmente
- [ ] Código está formatado corretamente
- [ ] Sem console.log deixados acidentalmente
- [ ] Documentação atualizada
- [ ] Credenciais não foram commitadas
- [ ] `.env.example` reflete as variáveis necessárias

---

## 🎯 Próximos Passos

### Sua Primeira Execução
1. ✅ Clonar/abrir projeto
2. ✅ `npm install`
3. ✅ Criar `.env`
4. ✅ `npm test`
5. ✅ Ver `npx playwright show-report`

### Customizar Testes
1. Abrir `e2e/tests/Login.spec.ts`
2. Entender a estrutura
3. Adicionar novo teste
4. Rodar com `npx playwright test -g "novo"`

### Estender Cobertura
1. Criar novo arquivo em `e2e/tests/`
2. Reutilizar Page Objects
3. Usar Faker para dados
4. Documentar no README

---

**🎉 Pronto para começar? Execute: `npm test`**
