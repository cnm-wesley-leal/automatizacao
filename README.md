# Projeto de Automatização E2E - Chaves na Mão

Este projeto contém a suíte de testes automatizados End-to-End (E2E) para a plataforma Chaves na Mão, utilizando **Playwright** e **TypeScript**.

## 🚀 Tecnologias
- [Playwright](https://playwright.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Faker](https://fakerjs.dev/) (para dados randômicos)
- [Dotenv](https://github.com/motdotla/dotenv) (variáveis de ambiente)

## 🛠️ Configuração Inicial

### 1. Pré-requisitos
- Node.js (versão LTS recomendada)
- NPM ou Yarn

### 2. Instalação
Clone o repositório e instale as dependências:
```bash
npm install
npx playwright install
```

### 3. Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto (use o `.env.example` como referência):
```env
USER_EMAIL_WEBUSER=seu_email
USER_PASSWORD=sua_senha
BASE_URL=https://staging.chavesnamao.com.br
```

## 🔐 Estratégia de Autenticação

O projeto utiliza uma estratégia de **Injeção de Cookies** para otimizar o tempo de execução e estabilidade:

1. **Setup de Autenticação (`auth.setup.ts`)**: Realiza o login via UI apenas uma vez por execução (ou quando o estado expira) e salva os cookies e local storage em `.auth/user.json`.
2. **Reuso de Sessão**: Todos os testes subsequentes injetam automaticamente esse estado no navegador, iniciando já autenticados.
3. **Validação Automática**: A fixture customizada em `e2e/fixtures/auth.ts` verifica se a sessão ainda é válida antes de iniciar cada teste.

## 📁 Estrutura de Dados Centralizada

Para evitar hardcode e facilitar a manutenção, utilizamos o arquivo `e2e/utils/test-data.ts`:
- **URLs**: URLs base e caminhos específicos.
- **Locators**: Seletores de elementos centralizados (botões, inputs, etc.).
- **Cookies**: Nomes de cookies de sessão e informações de conta.

## 🏃 Executando os Testes

Utilize os scripts configurados no `package.json`:

- **Headless (Padrão CI)**:
  ```bash
  npm run test:e2e
  ```
- **Modo Visível (Headed)**:
  ```bash
  npm run test:e2e:headed
  ```
- **Interface Gráfica (UI Mode)**:
  ```bash
  npm run test:e2e:ui
  ```

## 📊 Relatórios
Após a execução dos testes, o relatório HTML será gerado automaticamente. Para visualizar o último relatório:
```bash
npx playwright show-report
```
