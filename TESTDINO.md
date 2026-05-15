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
TESTDINO_URL=https://app.testdino.com
TESTDINO_API_KEY=sk_test_COLE_SUA_CHAVE_AQUI
TESTDINO_PROJECT_ID=project_69f8d13e2ddbbf162897e7c9
TESTDINO_ORG_ID=org_69f8d13c2ddbbf162897e7ae
```

> Onde encontrar cada valor:
>
> | Variável | Onde encontrar |
> |---|---|
> | `TESTDINO_API_KEY` | Settings → API Keys → Generate New |
> | `TESTDINO_PROJECT_ID` | Project Settings → Identificador |
> | `TESTDINO_ORG_ID` | Organization Settings → ID |

---

## 🚀 Como Usar

### Executar testes e enviar automaticamente
```bash
npm run test:with-testdino
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

---

## 📊 O Que É Enviado

```json
{
  "project_id": "project_69f8d13e2ddbbf162897e7c9",
  "test_suite": "Chaves na Mão - Login e Cadastro",
  "environment": "staging",
  "total_tests": 19,
  "passed": 14,
  "failed": 3,
  "skipped": 2,
  "results": [
    { "title": "CT01 - Login com credenciais válidas", "status": "passed" },
    { "title": "CT02 - Erro ao tentar login", "status": "passed" }
  ]
}
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
echo %TESTDINO_URL%
echo %TESTDINO_API_KEY%
echo %TESTDINO_PROJECT_ID%
```

---

## ✅ Checklist

- [ ] Gerar API Key no TestDino
- [ ] Adicionar `TESTDINO_API_KEY` no `.env`
- [ ] Executar `npm run test:with-testdino`
- [ ] Verificar resultados no dashboard

---

**Última atualização:** 15/05/2026 | [Docs TestDino](https://docs.testdino.com)
