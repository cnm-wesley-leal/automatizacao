# 🔗 Integração TestDino - Guia Rápido

## ✅ Configuração Finalizada!

Seus dados TestDino já estão configurados:

```
✅ TESTDINO_URL: https://app.testdino.com
✅ TESTDINO_PROJECT_ID: project_69f8d13e2ddbbf162897e7c9
✅ TESTDINO_ORG_ID: org_69f8d13c2ddbbf162897e7ae
❌ TESTDINO_API_KEY: ⚠️ FALTA ADICIONAR
```

---

## 🔑 Falta 1 Coisa: API Key

### Passo 1: Gerar API Key no TestDino

1. Acesse: https://app.testdino.com
2. Clique em **Settings** → **API Keys**
3. Clique em **Generate New Key**
4. Nomeie: `Chaves na Mão Automation`
5. Copie a chave gerada

### Passo 2: Adicionar ao `.env`

Crie arquivo `.env` na raiz do projeto:

```bash
# Copie do .env.example
cp .env.example .env
```

Edite `.env` e substitua:

```env
USER_EMAIL_WEBUSER=seu_email@example.com
USER_PASSWORD=sua_senha
BASE_URL=https://staging.chavesnamao.com.br

TESTDINO_URL=https://app.testdino.com
TESTDINO_API_KEY=sk_test_xxxxx_COLE_SUA_CHAVE_AQUI
TESTDINO_PROJECT_ID=project_69f8d13e2ddbbf162897e7c9
TESTDINO_ORG_ID=org_69f8d13c2ddbbf162897e7ae
```

---

## 🚀 Usar (Depois de Configurar)

### Executar testes e enviar para TestDino

```bash
npm run test:with-testdino
```

**Isso vai:**
1. ✅ Rodar todos os 19 testes
2. ✅ Gerar relatório Playwright
3. ✅ Enviar automaticamente para TestDino
4. ✅ Exibir link do relatório

### Ou enviar resultados existentes

```bash
npm run testdino:report
```

---

## 📊 O Que Você Verá

Após enviar, acesse seu dashboard:

🔗 **https://app.testdino.com/org_69f8d13c2ddbbf162897e7ae/projects/project_69f8d13e2ddbbf162897e7c9/test-runs**

E você verá:
- ✅ **Histórico de Execuções:** Todas as rodadas
- ✅ **Gráficos:** Taxa de sucesso ao longo do tempo
- ✅ **Detalhes:** Qual teste falhou e por quê
- ✅ **Trending:** Padrões de falha
- ✅ **Reports:** Exportar em PDF/Excel

---

## ✨ Exemplo de Saída

```
🚀 Conectando com TestDino...

📤 Enviando relatório para TestDino...
   URL: https://app.testdino.com
   Projeto: project_69f8d13e2ddbbf162897e7c9
   Org: org_69f8d13c2ddbbf162897e7ae
   Testes: 19 (14✅ 3❌ 2⏭️)

   Endpoint: https://app.testdino.com/api/v1/projects/project_69f8d13e2ddbbf162897e7c9/test-results

✅ Relatório enviado com sucesso!
   ID do Relatório: run_69f8d13e2ddbbf162897e7d0
   Link: https://app.testdino.com/org_69f8d13c2ddbbf162897e7ae/projects/project_69f8d13e2ddbbf162897e7c9/test-runs/run_69f8d13e2ddbbf162897e7d0

✨ Integração com TestDino concluída!
```

---

## 🎯 Checklist

- [ ] Gerar API Key em TestDino
- [ ] Copiar `.env.example` para `.env`
- [ ] Adicionar API Key no `.env`
- [ ] Executar `npm run test:with-testdino`
- [ ] Acessar dashboard TestDino
- [ ] Verificar resultados aparecem

---

## 📞 Suporte

- **Dashboard:** https://app.testdino.com
- **Documentação:** https://docs.testdino.com
- **API Docs:** https://docs.testdino.com/api

---

**Próximo passo:** Adicione a API Key no `.env` e execute `npm run test:with-testdino` 🚀
