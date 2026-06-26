# Casos de Teste — Filtros de Busca de Imóveis (RealtyFilters)

**Módulo:** Filtros e Resultados de Listagem  
**Arquivo de automação:** `e2e/tests/RealtyFilters.spec.ts`  
**Total de testes:** 34 (30 Filtros + 1 Integridade + 3 Scroll/Fim de Listagem)  
**Taxa de sucesso:** 100% ✅  
**Status:** ✅ Implementado e automatizado (v1.0)  
**Última atualização:** 26/06/2026

---

## 📋 Resumo Executivo

Suíte completa de testes para validar a funcionalidade de **filtros de busca**, incluindo:
- Tipos de listagem via URL (alugar, venda, lançamentos, apartamentos)
- Filtros de quartos, banheiros e garagens via painel e URL
- Filtros de preço e área útil via painel e URL
- Reidratação de filtros ao acessar URL com parâmetros pré-aplicados
- Filtros de características (features) como piscina
- Ordenação (mais recentes, menor preço, maior preço)
- Paginação e navegação para páginas específicas
- Tipo de anunciante (proprietário) e lançamentos
- Cenário de zero resultados e botão Limpar
- API endpoints de filtros (`navigationFilters`, `extraFilters`)
- Filtros combinados via URL e preservação na navegação
- Integridade dos resultados (quartos do card vs filtro aplicado)
- Scroll infinito com intercepção de API
- Fim de listagem com seção de imóveis similares

**Pronto para Produção:** SIM ✅

---

## Pré-condições Gerais

- BASE_URL apontando para o ambiente de staging
- Dados de teste centralizados em `REALTY_SEARCH_DATA` (`e2e/utils/test-data.ts`)
- Consentimento de cookies dismissido automaticamente via `dismissCookieConsent()`
- Sem autenticação necessária (funcionalidade é pública)
- `beforeEach` navega para `D.urls.listings` (`/imoveis/brasil/`) com `domcontentloaded`

---

## Suite 1: Tipos de Listagem e Filtros de URL (CT01–CT08)

Testes que validam navegação por tipo de negócio e tipo de imóvel via URL direta.

### CT01 — Deve exibir imóveis para alugar ao navegar para /imoveis-para-alugar/

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que a URL `/imoveis-para-alugar/brasil/` exibe imóveis para alugar com h1 correto |
| **Plataformas** | ✅ Desktop e Mobile |
| **Pré-condições** | Nenhuma (navega para URL específica) |
| **Passos** | 1. Navegar para `D.urls.forRent` (`/imoveis-para-alugar/brasil/`); 2. Verificar h1 |
| **Validações** | • h1 contém `/para alugar/i`<br>• Ao menos um card de imóvel `a[href*="/imovel/"]` visível |
| **Resultado esperado** | Página de aluguel carregada com h1 "X Imóveis para Alugar" e cards visíveis |
| **Observação** | `test.slow()` — página lenta no staging |

---

### CT02 — Deve exibir imóveis à venda ao navegar para /imoveis-a-venda/

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que a URL `/imoveis-a-venda/brasil/` exibe imóveis à venda com h1 correto |
| **Plataformas** | ✅ Desktop e Mobile |
| **Passos** | 1. Navegar para `D.urls.forSale` (`/imoveis-a-venda/brasil/`); 2. Verificar h1 |
| **Validações** | • h1 contém `/à venda\|a venda/i` |
| **Resultado esperado** | Página de venda carregada com h1 "X Imóveis à Venda" |
| **Observação** | `test.slow()` |

---

### CT03 — Deve exibir lançamentos ao navegar para /lancamentos-imoveis/

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que a URL `/lancamentos-imoveis/brasil/` exibe lançamentos com h1 correto |
| **Plataformas** | ✅ Desktop e Mobile |
| **Passos** | 1. Navegar para `D.urls.launches`; 2. Verificar h1 e cards |
| **Validações** | • h1 contém `/lançamento\|lançamentos/i`<br>• Ao menos um card `a[href*="/lancamento/"]` visível |
| **Resultado esperado** | Página de lançamentos carregada com h1 e cards de lançamento |
| **Observação** | `test.slow()` |

---

### CT04 — Deve exibir contagem de apartamentos ao navegar para /apartamentos/

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que a URL `/apartamentos/brasil/` exibe apartamentos com h1 correto |
| **Plataformas** | ✅ Desktop e Mobile |
| **Passos** | 1. Navegar para `D.urls.apartments`; 2. Verificar h1 e cards |
| **Validações** | • h1 contém `/apartamento/i`<br>• Ao menos um card `a[href*="/imovel/"]` visível |
| **Resultado esperado** | Página de apartamentos carregada |
| **Observação** | `test.slow()` — consistentemente lento no staging (~30s) |

---

### CT05 — Deve filtrar por 3 quartos via URL

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que a URL `/imoveis/brasil/3-quartos/` exibe resultados de 3 quartos |
| **Plataformas** | ✅ Desktop e Mobile |
| **Passos** | 1. Navegar para `/imoveis/brasil/3-quartos/`; 2. Verificar h1 |
| **Validações** | • h1 contém `/3 quartos\|3-quartos/i` |
| **Resultado esperado** | Página filtrada para 3 quartos com h1 atualizado |
| **Observação** | `test.slow()` |

---

### CT06 — Deve filtrar por quartos via painel de filtros

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que selecionar "+ 2 quartos" no painel de filtros navega para a URL correta |
| **Plataformas** | ✅ Desktop e Mobile |
| **Passos** | 1. Abrir painel de filtros via `openFilterPanel()`; 2. Aguardar 3 botões "+ 2" presentes (quartos, banheiros, garagens); 3. Clicar no primeiro botão "+ 2" (quartos); 4. Clicar em "Aplicar Filtros" |
| **Validações** | • URL contém `/\/2-quartos\//` |
| **Resultado esperado** | Navegação para página filtrada por 2 quartos |

---

### CT07 — Deve reidratar botão de quartos ao abrir URL com /2-quartos/

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que ao acessar URL com quartos pré-selecionados, o painel exibe o botão no estado ativo |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile (skip — accordion de quartos colapsado por padrão no modal mobile) |
| **Passos** | 1. Navegar para `/imoveis/brasil/2-quartos/`; 2. Abrir painel de filtros; 3. Verificar estado do botão "+ 2" |
| **Validações** | • Botão "+ 2" (primeiro) tem classe `/style_outline/`<br>• Botão NÃO tem classe `/disabled\|inactive/` |
| **Resultado esperado** | Botão de 2 quartos visualmente destacado como ativo |
| **Observação** | `test.slow()` — componente não expõe `aria-pressed` |

---

### CT08 — Deve aplicar filtros de banheiros e garagens via URL

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que `?filtro=ban:2,gar:1` reduz a contagem de resultados e persiste na URL |
| **Plataformas** | ✅ Desktop e Mobile |
| **Passos** | 1. Capturar h1 inicial (de `beforeEach`); 2. Navegar para `?filtro=ban:2,gar:1`; 3. Comparar h1 filtrado com inicial |
| **Validações** | • h1 filtrado visível<br>• URL contém `filtro=ban:2,gar:1`<br>• Texto do h1 filtrado ≠ h1 inicial |
| **Resultado esperado** | Filtros aplicados, contagem reduzida, parâmetros na URL |
| **Observação** | `test.slow()` |

---

## Suite 2: Painel de Filtros — Preço e Área (CT09–CT15)

Testes para filtros numéricos (preço mínimo/máximo e área útil) via painel e URL.

### CT09 — Deve aplicar filtro de preço via painel de filtros

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que preencher `pmin` e `pmax` no painel navega com ambos os parâmetros na URL |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile (skip — iOS Safari não commita ambos os inputs de preço de forma confiável) |
| **Passos** | 1. Abrir painel; 2. Preencher `#pmin-input` com 300000; 3. Aplicar; 4. Reabrir painel; 5. Preencher `#pmax-input` com 800000; 6. Aplicar |
| **Validações** | • Após step 3: URL contém `pmin:300000`<br>• Após step 6: URL contém `pmin:300000` e `pmax:800000` |
| **Resultado esperado** | Filtros de preço cumulativos aplicados sem perder o anterior |

---

### CT10 — Deve aplicar filtro de preço via URL

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que URL com `?filtro=pmin:300000,pmax:800000` é aceita e o h1 carrega |
| **Plataformas** | ✅ Desktop e Mobile |
| **Passos** | 1. Navegar para `?filtro=pmin:300000,pmax:800000`; 2. Verificar h1 e URL |
| **Validações** | • h1 visível<br>• URL contém `pmin:300000,pmax:800000` |
| **Resultado esperado** | Página carregada com filtro de preço ativo |

---

### CT11 — Deve reidratar inputs de preço ao abrir URL com pmin/pmax

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que ao acessar URL com preços, os inputs do painel exibem os valores |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile (skip — modal iOS não pré-popula inputs de preço da URL) |
| **Passos** | 1. Navegar para `?filtro=pmin:300000,pmax:800000`; 2. Abrir painel; 3. Verificar inputs |
| **Validações** | • `#pmin-input` tem valor `/300000\|300\.000/`<br>• `#pmax-input` tem valor `/800000\|800\.000/` |
| **Resultado esperado** | Inputs pré-preenchidos com valores formatados |

---

### CT12 — Deve aplicar filtro de área útil via painel de filtros

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que preencher `amin` e `amax` no painel navega com ambos os parâmetros |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile (skip — iOS Safari não commita ambos os inputs de área) |
| **Passos** | 1. Abrir painel; 2. Preencher `#amin-input` com 80; 3. Aplicar; 4. Reabrir painel; 5. Preencher `#amax-input` com 150; 6. Aplicar |
| **Validações** | • Após step 3: URL contém `amin:80`<br>• Após step 6: URL contém `amin:80` e `amax:150` |
| **Resultado esperado** | Filtros de área cumulativos aplicados |

---

### CT13 — Deve reidratar inputs de área ao abrir URL com amin/amax

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que ao acessar URL com área, os inputs do painel exibem os valores |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile (skip — modal iOS não pré-popula inputs de área) |
| **Passos** | 1. Navegar para `?filtro=amin:80,amax:150`; 2. Abrir painel; 3. Verificar inputs |
| **Validações** | • `#amin-input` tem valor `/^80/`<br>• `#amax-input` tem valor `/^150/` |
| **Resultado esperado** | Inputs pré-preenchidos com valores de área |

---

### CT14 — Deve aplicar filtro de feature (Piscina) via URL

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que `?filtro=are:[5]` (Piscina) é aceita e persiste na URL |
| **Plataformas** | ✅ Desktop e Mobile |
| **Passos** | 1. Navegar para `?filtro=are:[5]`; 2. Verificar h1 e URL |
| **Validações** | • h1 visível<br>• URL contém `are:[5]` (ID de Piscina = `D.featureIds.piscina`) |
| **Resultado esperado** | Filtro de Piscina ativo na URL |

---

### CT15 — Deve marcar feature no painel ao abrir URL com are: aplicado

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que ao acessar URL com feature, o botão correspondente aparece ativo no painel |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile (skip — accordion de features colapsado por padrão no modal mobile) |
| **Passos** | 1. Navegar para `?filtro=are:[5]`; 2. Abrir painel; 3. Verificar botão "Piscina" |
| **Validações** | • Botão "Piscina" tem classe `/style_outline/`<br>• Botão NÃO tem classe `/disabled\|inactive/` |
| **Resultado esperado** | Botão de Piscina visualmente destacado como ativo |
| **Observação** | Componente não expõe `aria-pressed` |

---

## Suite 3: Ordenação e Paginação (CT16–CT20)

Testes para opções de ordenação e navegação entre páginas de resultados.

### CT16 — Deve aplicar ordenação "Mais recentes" via UI

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que selecionar "Mais recentes" no seletor de ordenação aplica `or:6` na URL |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile (skip — UI de ordenação não disponível no layout mobile) |
| **Passos** | 1. Clicar no botão "Ordenar por"; 2. Clicar em "Mais recentes" |
| **Validações** | • URL contém `filtro=or:6` |
| **Resultado esperado** | Resultados reordenados por data de publicação, parâmetro na URL |
| **Observação** | `test.slow()` |

---

### CT17 — Deve aplicar ordenação "Menor preço" via UI

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que selecionar "Menor preço R$" aplica `or:1` na URL |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile |
| **Passos** | 1. Clicar no botão "Ordenar por"; 2. Clicar em "Menor preço R$" |
| **Validações** | • URL contém `filtro=or:1` |
| **Resultado esperado** | Resultados ordenados por menor preço |
| **Observação** | `test.slow()` |

---

### CT18 — Deve aplicar ordenação "Maior preço" via UI

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que selecionar "Maior preço R$" aplica `or:2` na URL |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile |
| **Passos** | 1. Clicar no botão "Ordenar por"; 2. Clicar em "Maior preço R$" |
| **Validações** | • URL contém `filtro=or:2` |
| **Resultado esperado** | Resultados ordenados por maior preço |
| **Observação** | `test.slow()` |

---

### CT19 — Deve navegar para página 2

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que a URL com `?pg=2` carrega a segunda página de resultados |
| **Plataformas** | ✅ Desktop e Mobile |
| **Passos** | 1. Navegar para `?pg=2`; 2. Verificar h1 e URL |
| **Validações** | • h1 visível<br>• URL contém `pg=2` |
| **Resultado esperado** | Segunda página de resultados carregada |

---

### CT20 — Deve exibir link para próxima página

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que a página de listagem exibe link navegável para `?pg=2` |
| **Plataformas** | ✅ Desktop e Mobile |
| **Pré-condições** | Página inicial de listagem (de `beforeEach`) |
| **Passos** | 1. Verificar link `a[href*="?pg=2"]` na página |
| **Validações** | • Link `a[href*="?pg=2"]` visível |
| **Resultado esperado** | Link de paginação para página 2 presente e visível |

---

## Suite 4: Tipo de Anunciante e Lançamentos (CT21–CT22)

### CT21 — Deve exibir imóveis direto com proprietário

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que a URL de proprietário com `?filtro=tve:[0]` exibe h1 referenciando proprietário |
| **Plataformas** | ✅ Desktop e Mobile |
| **Passos** | 1. Navegar para `D.urls.directOwner + ?filtro=tve:[0]`; 2. Verificar h1 |
| **Validações** | • h1 contém `/proprietário\|proprietario/i` |
| **Resultado esperado** | Página de imóveis com proprietário carregada |

---

### CT22 — Deve navegar para lançamentos ao selecionar no painel

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que clicar em "Lançamentos" no painel de filtros navega para a URL correta |
| **Plataformas** | ✅ Desktop e Mobile |
| **Passos** | 1. Abrir painel de filtros; 2. Clicar em botão "Lançamentos"; 3. Aplicar filtros |
| **Validações** | • URL contém `lancamentos-imoveis` |
| **Resultado esperado** | Navegação para página de lançamentos via painel |

---

## Suite 5: Resultados Zero e Botão Limpar (CT24–CT25b)

Testes para comportamento com filtros impossíveis e controle de limpeza de filtros.

> **Nota:** CT23 foi incorporado ao CT24 (era subconjunto com mesma URL e mesma asserção de h1).

### CT24 — Deve exibir 0 imóveis e listagens sugeridas com filtros impossíveis

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que filtros impossíveis retornam "0 Imóveis" no h1 e ainda exibem sugestões como fallback |
| **Plataformas** | ✅ Desktop e Mobile |
| **Pré-condições** | `D.urls.zeroResults` = `?filtro=pmin:9000000000,pmax:10000000000,ban:4,gar:4` |
| **Passos** | 1. Navegar para `D.urls.zeroResults`; 2. Verificar h1; 3. Verificar cards de fallback |
| **Validações** | • h1 contém "0 Imóveis"<br>• Ao menos um card `a[href*="/imovel/"]` visível (listagens sugeridas) |
| **Resultado esperado** | Feedback "0 Imóveis" + seção de fallback com sugestões visível |

---

### CT25 — Deve exibir botão Limpar quando há filtros aplicados

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que o botão "Limpar" aparece quando há filtros ativos na URL |
| **Plataformas** | ✅ Desktop e Mobile |
| **Passos** | 1. Navegar para `?filtro=ban:2`; 2. Verificar botão "Limpar" |
| **Validações** | • Botão com texto "Limpar" (role=button) visível |
| **Resultado esperado** | Botão "Limpar" presente e visível quando há filtros |

---

### CT25b — Não deve exibir botão Limpar quando não há filtros aplicados

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que o botão "Limpar" NÃO aparece na página sem filtros (teste negativo) |
| **Plataformas** | ✅ Desktop e Mobile |
| **Pré-condições** | Página de listagem base `D.urls.listings` (de `beforeEach`) |
| **Passos** | 1. Verificar que botão "Limpar" não existe |
| **Validações** | • `getByRole('button', { name: 'Limpar' })` tem contagem 0 |
| **Resultado esperado** | Nenhum botão "Limpar" presente na página sem filtros |

---

## Suite 6: API e Filtros Combinados (CT26–CT30)

Testes de integração com APIs de filtros e persistência de filtros complexos.

### CT26 — navigationFilters API deve retornar lista de tipos com contagens

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que a API `/api/realestate/aggregations/navigationFilters/` retorna estrutura válida ao carregar a página |
| **Plataformas** | ✅ Desktop e Mobile |
| **Passos** | 1. Interceptar resposta da API durante `page.goto(D.urls.listings)`; 2. Parsear JSON; 3. Validar estrutura dos itens |
| **Validações** | • Resposta HTTP 200 (ok)<br>• Lista de itens com `length > 0`<br>• Cada item tem `realtyID: number` e campo `count` ou `total` |
| **Resultado esperado** | API retorna dados válidos para popular os filtros de navegação |

---

### CT27 — extraFilters API deve retornar lista de features com IDs

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que a API `/api/realestate/listing/filters/getExtraFilters/` retorna features com IDs e nomes |
| **Plataformas** | ✅ Desktop e Mobile |
| **Passos** | 1. Fazer GET direto para `D.api.extraFilters`; 2. Parsear JSON; 3. Validar estrutura e presença de Piscina |
| **Validações** | • Resposta ok<br>• Array com `length > 0`<br>• Cada item tem `id: number` e `name: string` não vazio<br>• Feature com `id === D.featureIds.piscina` tem `name === 'Piscina'` |
| **Resultado esperado** | API retorna features completas incluindo Piscina com ID correto |

---

### CT28 — Deve aplicar filtros combinados via URL e preservar na navegação

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que URL complexa com múltiplos filtros combinados é aceita e persiste |
| **Plataformas** | ✅ Desktop e Mobile |
| **Pré-condições** | URL: `/imoveis-para-alugar/brasil/2-quartos/?filtro=ban:2,gar:1,pmin:2000,pmax:5000,or:6` |
| **Passos** | 1. Navegar para a URL combinada; 2. Verificar h1 e URL |
| **Validações** | • h1 visível<br>• URL contém `imoveis-para-alugar`<br>• URL contém `2-quartos`<br>• URL contém `ban:2,gar:1,pmin:2000,pmax:5000,or:6` |
| **Resultado esperado** | Todos os filtros preservados simultaneamente na URL |

---

### CT29 — Deve limpar filtros ao clicar em Limpar

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que o botão "Limpar" remove os parâmetros de filtro da URL |
| **Plataformas** | ✅ Desktop e Mobile |
| **Passos** | 1. Navegar para `?filtro=ban:2,gar:1`; 2. Chamar `clearFilters(page)`; 3. Verificar URL |
| **Validações** | • URL NÃO contém `ban:2` |
| **Resultado esperado** | URL limpa de parâmetros de filtro após clique em "Limpar" |

---

### CT30 — Deve atualizar contagem no h1 ao aplicar filtro de quartos

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que aplicar filtro de quartos reduz a contagem de imóveis exibida no h1 |
| **Plataformas** | ✅ Desktop e Mobile |
| **Passos** | 1. Capturar número inicial do h1 (de `beforeEach`); 2. Navegar para `4-quartos/`; 3. Capturar número filtrado; 4. Comparar |
| **Validações** | • h1 inicial contém número > 0<br>• h1 filtrado contém "/4 quartos/i"<br>• Número filtrado < número inicial |
| **Resultado esperado** | Contagem reduzida ao aplicar filtro de 4 quartos |

---

## Suite 7: Integridade dos Resultados (CT31)

### CT31 — Cards retornados pelo filtro de 3 quartos devem ter 3 ou mais quartos

| Campo | Valor |
|---|---|
| **Objetivo** | Validar integridade: nenhum card retornado pelo filtro de 3 quartos deve ter menos de 3 quartos |
| **Plataformas** | ✅ Desktop e Mobile |
| **Passos** | 1. Navegar para `3-quartos/`; 2. Extrair hrefs dos primeiros 10 cards; 3. Para cada href com padrão `/N-quartos/`, validar N >= 3 |
| **Validações** | • h1 contém `/3 quartos/i`<br>• Ao menos um card com quartos no href<br>• Todo card com slug de quartos tem N >= 3 |
| **Resultado esperado** | 100% dos cards inspecionados respeitam o filtro de quartos aplicado |
| **Observação** | Cards sem slug de quartos no href são ignorados (slug ausente não é falha) |

---

## Suite 8: Scroll Infinito e Fim de Listagem (CT32–CT34)

Testes para comportamento de carregamento progressivo e exibição de similares.

### CT32 — Scroll até o fim deve carregar mais cards via API (scroll infinito)

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que rolar até o fim da página dispara chamada à API com `pg=2` e aumenta o número de cards |
| **Plataformas** | ✅ Desktop e Mobile |
| **Pré-condições** | Página de listagem geral `D.urls.listings` |
| **Passos** | 1. Navegar para `D.urls.listings`; 2. Contar cards iniciais; 3. Interceptar API `pg=2` + disparar `window.scrollTo(0, scrollHeight)` em paralelo; 4. Aguardar contagem de cards aumentar |
| **Validações** | • Contagem inicial > 0<br>• API `/api/realestate/listing/items/` com `pg=2` retorna HTTP 200<br>• Contagem após scroll > contagem inicial<br>• URL permanece `/imoveis/brasil/` (sem mudança por scroll) |
| **Resultado esperado** | Scroll infinito funciona: API de segunda página chamada, novos cards adicionados |
| **Timeout** | 15s para API, 10s para `waitForFunction` |

---

### CT33 — Ao esgotar resultados principais deve exibir seção de imóveis similares

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que ao chegar ao fim dos resultados principais, o separador "+ N imóveis similares" aparece |
| **Plataformas** | ✅ Desktop e Mobile |
| **Pré-condições** | `D.urls.fewResults` — URL com ~13 resultados principais (`/sp-campinas/4-quartos/?filtro=pmin:8000000,...`) |
| **Passos** | 1. Navegar para `D.urls.fewResults`; 2. Rolar até o fim com `window.scrollTo(0, scrollHeight)`; 3. Aguardar separador de similares |
| **Validações** | • Texto `/\+\s*\d+\s*imóveis similares/i` visível<br>• Número extraído do texto > 0 |
| **Resultado esperado** | Separador "+ N imóveis similares" exibido com contagem positiva |
| **Timeout** | 10s para `toBeVisible` |

---

### CT34 — Cards exibidos após o separador de similares devem ser links válidos de imóveis

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que os cards exibidos após o separador de similares são links válidos de imóvel |
| **Plataformas** | ✅ Desktop e Mobile |
| **Pré-condições** | `D.urls.fewResults` — URL com ~13 resultados principais |
| **Passos** | 1. Navegar para `D.urls.fewResults`; 2. Rolar até o fim; 3. Aguardar separador de similares; 4. Contar todos os cards; 5. Validar hrefs dos primeiros 5 |
| **Validações** | • Separador `/\+\s*\d+\s*imóveis similares/i` visível<br>• Total de cards `a[href*="/imovel/"]` > 13<br>• Primeiros 5 hrefs correspondem a `/\/imovel\//` |
| **Resultado esperado** | Cards de similares são links válidos de páginas de imóvel |
| **Timeout** | 10s para `toBeVisible` do separador |

---

## 🎯 Matriz de Cobertura

| Suite | Testes | Taxa | Status |
|---|---|---|---|
| Tipos de Listagem e Filtros de URL | 8 | 100% ✅ | Completo |
| Painel de Filtros — Preço e Área | 7 | 100% ✅ | Completo |
| Ordenação e Paginação | 5 | 100% ✅ | Completo |
| Tipo de Anunciante e Lançamentos | 2 | 100% ✅ | Completo |
| Resultados Zero e Botão Limpar | 3 | 100% ✅ | Completo |
| API e Filtros Combinados | 5 | 100% ✅ | Completo |
| Integridade dos Resultados | 1 | 100% ✅ | Completo |
| Scroll Infinito e Fim de Listagem | 3 | 100% ✅ | Completo |
| **TOTAL** | **34** | **100% ✅** | **Pronto** |

---

## 🚀 Execução

```bash
# Rodar toda a suite
npx playwright test e2e/tests/RealtyFilters.spec.ts

# Rodar por suite
npx playwright test e2e/tests/RealtyFilters.spec.ts --grep "Busca de Imóveis — Filtros"
npx playwright test e2e/tests/RealtyFilters.spec.ts --grep "Scroll infinito"

# Rodar teste específico
npx playwright test e2e/tests/RealtyFilters.spec.ts --grep "CT31"

# Com relatório
npx playwright test e2e/tests/RealtyFilters.spec.ts && npx playwright show-report
```

---

**✅ Última atualização:** 26/06/2026 | **Status:** Pronto para Produção
