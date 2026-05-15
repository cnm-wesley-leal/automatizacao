# Integração TestDino

Envio automático de resultados Playwright para o dashboard [TestDino](https://app.testdino.com).

---

## ✅ Status da Configuração

```
✅ TESTDINO_URL:        https://app.testdino.com
✅ TESTDINO_PROJECT_ID: project_69f8d13e2ddbbf162897e7c9
✅ TESTDINO_ORG_ID:     org_69f8d13c2ddbbf162897e7ae
❌ TESTDINO_API_KEY:    ⚠️ Precisa ser adicionada
```

---

## 🔑 Como Gerar a API Key

1. Acesse **https://app.testdino.com**
2. Vá em **Settings → API Keys → Generate New Key**
3. Nomeie: `Chaves na Mão Automation`
4. Copie a chave gerada

---

## 📋 Variáveis de Ambiente

Adicione ao arquivo `.env`:

```env
# Obrigatória
TESTDINO_API_KEY=sk_test_COLE_SUA_CHAVE_AQUI

# Opcionais (usadas pelo script send-to-testdino.ts)
TESTDINO_TARGET_ENV=staging          # padrão: staging
TESTDINO_RUN_TAGS=e2e,staging        # padrão: e2e,staging

# Referência (não lidas pelo script, mas úteis para o .env.example)
TESTDINO_URL=https://app.testdino.com
TESTDINO_PROJECT_ID=project_69f8d13e2ddbbf162897e7c9
TESTDINO_ORG_ID=org_69f8d13c2ddbbf162897e7ae
```

> Onde encontrar cada valor:
>
> | Variável | Obrigatória | Onde encontrar |
> |---|---|---|
> | `TESTDINO_API_KEY` | ✅ Sim | Settings → API Keys → Generate New |
> | `TESTDINO_TARGET_ENV` | ❌ Não | Definir conforme o ambiente alvo |
> | `TESTDINO_RUN_TAGS` | ❌ Não | Tags livres separadas por vírgula |
> | `TESTDINO_PROJECT_ID` | ❌ Não | Project Settings → Identificador |
> | `TESTDINO_ORG_ID` | ❌ Não | Organization Settings → ID |

---

## 🚀 Como Usar

### Executar testes e enviar automaticamente
```bash
npm run test:with-testdino
# ou equivalente:
npm run testdino:sync
```

### Enviar resultados de uma execução anterior
```bash
npm run testdino:report
```

### Em CI/CD
```bash
npm test
npx ts-node scripts/send-to-testdino.ts
```

> O script invoca `npx tdpw upload` internamente, enviando o HTML report (`playwright-report/`) e o JSON report (`playwright-results.json`) para o TestDino.

---

## 📊 O Que É Enviado

O upload é feito pela CLI `tdpw` (pacote [`tdpw`](https://www.npmjs.com/package/tdpw)), que lê e envia automaticamente:

| Artefato | Caminho |
|---|---|
| HTML Report | `playwright-report/` |
| JSON Report | `playwright-results.json` |

Parâmetros adicionais passados pelo script:

```
--token          TESTDINO_API_KEY
--environment    TESTDINO_TARGET_ENV  (padrão: staging)
--tag            TESTDINO_RUN_TAGS    (padrão: e2e,staging)
```

---

## 📈 Dashboard

Após enviar, acesse:

🔗 **https://app.testdino.com/org_69f8d13c2ddbbf162897e7ae/projects/project_69f8d13e2ddbbf162897e7c9/test-runs**

O dashboard mostra:
- Histórico de execuções
- Gráficos de taxa de sucesso ao longo do tempo
- Detalhes de cada falha
- Alertas quando testes começam a falhar
- Exportação em PDF/Excel

---

## 🔧 Solução de Problemas

| Erro | Causa | Solução |
|---|---|---|
| `Variáveis de ambiente não configuradas` | `.env` incompleto | Verificar `TESTDINO_URL`, `API_KEY` e `PROJECT_ID` |
| `HTTP 401: Unauthorized` | API Key inválida/expirada | Gerar nova key em Settings → API Keys |
| `HTTP 404: Not Found` | URL ou Project ID incorreto | Confirmar valores no dashboard TestDino |

### Verificar variáveis (Windows)
```bash
echo %TESTDINO_API_KEY%
echo %TESTDINO_TARGET_ENV%
echo %TESTDINO_RUN_TAGS%
```

---

## ✅ Checklist

- [ ] Gerar API Key no TestDino
- [ ] Adicionar `TESTDINO_API_KEY` no `.env`
- [ ] Executar `npm run test:with-testdino`
- [ ] Verificar resultados no dashboard

---

**Última atualização:** 15/05/2026 | [Docs TestDino](https://docs.testdino.com)
