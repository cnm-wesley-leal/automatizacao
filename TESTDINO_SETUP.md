# Configuração TestDino Integration

## 🎯 Pré-requisitos

1. **Conta no TestDino:** https://testdino.example.com
2. **API Key:** Gerar em Settings > API
3. **Project ID:** Encontrar em Project Settings

---

## 📋 Variáveis de Ambiente

Adicione ao arquivo `.env`:

```env
# TestDino Configuration
TESTDINO_URL=https://testdino.example.com
TESTDINO_API_KEY=your_api_key_here
TESTDINO_PROJECT_ID=your_project_id_here
```

### Onde encontrar?

| Variável | Onde encontrar |
|----------|---|
| `TESTDINO_URL` | URL da sua instância TestDino |
| `TESTDINO_API_KEY` | Settings → API Keys → Generate New |
| `TESTDINO_PROJECT_ID` | Project Settings → Identificador do Projeto |

---

## 🚀 Como Usar

### Opção 1: Manual

```bash
# 1. Executar testes
npm test

# 2. Enviar resultados para TestDino
npx ts-node scripts/send-to-testdino.ts
```

### Opção 2: Automático (Recomendado)

```bash
# Executa testes E envia para TestDino automaticamente
npm run test:with-testdino
```

### Opção 3: CI/CD Pipeline

```bash
# No seu arquivo de CI/CD (GitHub Actions, GitLab CI, etc)
npm test
npx ts-node scripts/send-to-testdino.ts
```

---

## 📊 O Que é Enviado

```json
{
  "project_id": "projeto-123",
  "test_suite": "Chaves na Mão - Login e Cadastro",
  "execution_date": "2026-05-04T10:30:00Z",
  "environment": "staging",
  "total_tests": 19,
  "passed": 14,
  "failed": 3,
  "skipped": 2,
  "duration": 84000,
  "browser": "chromium",
  "base_url": "https://staging.chavesnamao.com.br",
  "results": [
    {
      "title": "CT01 - Login com credenciais válidas",
      "status": "passed",
      "duration": 2300
    },
    {
      "title": "CT02 - Erro ao tentar login",
      "status": "passed",
      "duration": 2100
    }
  ]
}
```

---

## 🔗 Dashboard TestDino

Após enviar, você pode visualizar:

- **Histórico de Execuções:** Todas as rodadas de testes
- **Tendências:** Gráficos de sucesso/falha ao longo do tempo
- **Detalhes por Teste:** Qual teste falhou e por quê
- **Alerts:** Notificações quando testes começam a falhar
- **Reports:** Relatórios em PDF/Excel

---

## 🔧 Solução de Problemas

### Erro: "Variáveis de ambiente não configuradas"

```bash
# Verificar se estão definidas
echo %TESTDINO_URL%
echo %TESTDINO_API_KEY%
echo %TESTDINO_PROJECT_ID%

# Se estiverem vazias, adicionar ao .env
```

### Erro: "HTTP 401: Unauthorized"

```
Possíveis causas:
- API Key inválida
- API Key expirada
- Permissões insuficientes

Solução:
1. Gerar novo API Key em TestDino
2. Verificar permissões do projeto
3. Testar com curl primeiro
```

### Erro: "HTTP 404: Not Found"

```
Possível causa:
- URL do TestDino incorreta
- Project ID inválido

Solução:
1. Verificar URL (sem trailing slash)
2. Confirmar Project ID
3. Testar conectividade: curl https://url/api/health
```

---

## 📝 Exemplo de Integração Completa

### package.json

```json
{
  "scripts": {
    "test": "playwright test",
    "test:with-testdino": "playwright test && npx ts-node scripts/send-to-testdino.ts",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui"
  }
}
```

### GitHub Actions

```yaml
name: E2E Tests with TestDino

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
      
      - name: Send to TestDino
        env:
          TESTDINO_URL: ${{ secrets.TESTDINO_URL }}
          TESTDINO_API_KEY: ${{ secrets.TESTDINO_API_KEY }}
          TESTDINO_PROJECT_ID: ${{ secrets.TESTDINO_PROJECT_ID }}
        run: npx ts-node scripts/send-to-testdino.ts
```

---

## 📞 Suporte

- **Documentação TestDino:** https://docs.testdino.example.com
- **API Reference:** https://docs.testdino.example.com/api
- **Status:** https://status.testdino.example.com

---

**Pronto! Após configurar, seus testes estarão centralizados no TestDino.** ✨
