# Casos de Teste — Busca de Imóveis (RealtySearch)

**Módulo:** Busca e Filtros de Imóveis  
**Arquivo de automação:** `e2e/tests/RealtySearch.spec.ts`  
**US de referência:** [T4] Implementar testes E2E nos Filtros (imóvel)

---

## Pré-condições

- Usuário autenticado (estado de sessão injetado via `storageState`)
- BASE_URL apontando para o ambiente de staging
- Dados de teste centralizados em `REALTY_SEARCH_DATA` (`e2e/utils/test-data.ts`)

---

## CT01 — Exibir imóveis para alugar via URL

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que a URL `/imoveis-para-alugar/brasil/` exibe imóveis para alugar |
| **Pré-condições** | Nenhuma |
| **Passos** | 1. Navegar para `/imoveis-para-alugar/brasil/` |
| **Resultado esperado** | h1 contém "para alugar"; ao menos um link de imóvel visível |

---

## CT02 — Exibir imóveis à venda via URL

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que a URL `/imoveis-a-venda/brasil/` exibe imóveis à venda |
| **Passos** | 1. Navegar para `/imoveis-a-venda/brasil/` |
| **Resultado esperado** | h1 contém "à venda" |

---

## CT03 — Exibir lançamentos via URL

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que a URL `/lancamentos-imoveis/brasil/` exibe lançamentos |
| **Passos** | 1. Navegar para `/lancamentos-imoveis/brasil/` |
| **Resultado esperado** | h1 contém "lançamento(s)"; links de item usam `/lancamento/` |

---

## CT04 — Exibir apartamentos via URL

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que a URL `/apartamentos/brasil/` exibe apartamentos |
| **Passos** | 1. Navegar para `/apartamentos/brasil/` |
| **Resultado esperado** | h1 contém "apartamento"; ao menos um imóvel visível |

---

## CT05 — Filtrar por 3 quartos via URL

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que o path `3-quartos/` aplica o filtro de quartos |
| **Passos** | 1. Navegar para `/imoveis/brasil/3-quartos/` |
| **Resultado esperado** | h1 contém "3 quartos" |

---

## CT06 — Filtrar por quartos via painel de filtros

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que clicar no botão "+ 2" no painel aplica o filtro |
| **Passos** | 1. Abrir painel de filtros; 2. Clicar "+ 2"; 3. Aplicar filtros |
| **Resultado esperado** | URL contém `/2-quartos/` |

---

## CT07 — Reidratação do botão de quartos (5.a)

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que o botão "+ 2" aparece como ativo ao carregar URL com `/2-quartos/` |
| **Passos** | 1. Navegar para `/imoveis/brasil/2-quartos/`; 2. Verificar estado do botão |
| **Resultado esperado** | Botão "+ 2" (quartos) tem classe `style_outline` (estado ativo) |
| **Critério de aceite** | A UI reflete o filtro da URL sem interação adicional |

---

## CT08 — Filtrar banheiros e garagens via URL

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que `?filtro=ban:2,gar:1` aplica os filtros |
| **Passos** | 1. Navegar com `?filtro=ban:2,gar:1` |
| **Resultado esperado** | URL mantém `ban:2,gar:1`; h1 visível |

---

## CT09 — Filtrar por preço via painel de filtros

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que preencher pmin/pmax no painel aplica o filtro |
| **Plataformas** | Desktop (skip iOS — limitação do Safari com inputs controlados) |
| **Passos** | 1. Abrir painel; 2. Preencher pmin=300000, pmax=800000; 3. Aplicar |
| **Resultado esperado** | URL contém `pmin:300000` e `pmax:800000` |

---

## CT10 — Filtrar por preço via URL

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que `?filtro=pmin:300000,pmax:800000` aplica o filtro |
| **Passos** | 1. Navegar com o parâmetro filtro |
| **Resultado esperado** | URL mantém `pmin:300000,pmax:800000`; h1 visível |

---

## CT11 — Reidratação dos inputs de preço (5.a)

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que pmin/pmax da URL são pré-preenchidos nos inputs do painel |
| **Plataformas** | Desktop (skip iOS) |
| **Passos** | 1. Navegar com `?filtro=pmin:300000,pmax:800000`; 2. Verificar inputs |
| **Resultado esperado** | `#pmin-input` exibe valor com "300"; `#pmax-input` exibe valor com "800" |
| **Critério de aceite** | A UI reflete os valores da URL sem interação adicional |

---

## CT12 — Filtrar por área útil via painel de filtros

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que preencher amin/amax no painel aplica o filtro |
| **Passos** | 1. Abrir painel; 2. Preencher amin=80, amax=150; 3. Aplicar |
| **Resultado esperado** | URL contém `amin:80,amax:150` |

---

## CT13 — Reidratação dos inputs de área (5.a)

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que amin/amax da URL são pré-preenchidos nos inputs do painel |
| **Plataformas** | Desktop (skip iOS) |
| **Passos** | 1. Navegar com `?filtro=amin:80,amax:150`; 2. Verificar inputs |
| **Resultado esperado** | `#amin-input` exibe "80"; `#amax-input` exibe "150" |
| **Critério de aceite** | A UI reflete os valores da URL sem interação adicional |

---

## CT14 — Filtrar por feature (Piscina) via URL

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que `?filtro=are:[5]` aplica o filtro de Piscina |
| **Passos** | 1. Navegar com `?filtro=are:[5]` |
| **Resultado esperado** | URL mantém `are:[5]`; h1 visível |

---

## CT15 — Reidratação do botão de feature no painel (5.a)

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que o botão "Piscina" aparece como ativo ao carregar URL com are:[5] |
| **Plataformas** | Desktop (acordeão de features colapsado no mobile por padrão) |
| **Passos** | 1. Navegar com `?filtro=are:[5]`; 2. Verificar botão "Piscina" |
| **Resultado esperado** | Botão "Piscina" tem classe `style_outline` (estado ativo) |

---

## CT16 — Ordenação "Mais recentes" via UI

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que selecionar "Mais recentes" atualiza a URL |
| **Plataformas** | Desktop (sort UI não disponível no layout mobile) |
| **Passos** | 1. Clicar "Ordernar por"; 2. Selecionar "Mais recentes" |
| **Resultado esperado** | URL contém `filtro=or:6` |

---

## CT17 — Ordenação "Menor preço" via UI

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que selecionar "Menor preço" atualiza a URL |
| **Plataformas** | Desktop |
| **Passos** | 1. Clicar "Ordernar por"; 2. Selecionar "Menor preço R$" |
| **Resultado esperado** | URL contém `filtro=or:1` |

---

## CT18 — Ordenação "Maior preço" via UI

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que selecionar "Maior preço" atualiza a URL |
| **Plataformas** | Desktop |
| **Passos** | 1. Clicar "Ordernar por"; 2. Selecionar "Maior preço R$" |
| **Resultado esperado** | URL contém `filtro=or:2` |

---

## CT19 — Navegar para página 2

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que `?pg=2` navega para a segunda página |
| **Passos** | 1. Navegar com `?pg=2` |
| **Resultado esperado** | URL contém `pg=2`; h1 visível |

---

## CT20 — Exibir link para próxima página

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que a página 1 exibe link para página 2 |
| **Passos** | 1. Carregar página de listagem |
| **Resultado esperado** | Link com `href` contendo `?pg=2` visível |

---

## CT21 — Imóveis direto com proprietário

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar a URL de proprietário direto com filtro tve:[0] |
| **Passos** | 1. Navegar para URL de proprietário com `?filtro=tve:[0]` |
| **Resultado esperado** | h1 contém "proprietário" |

---

## CT22 — Navegar para lançamentos via painel

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que selecionar "Lançamentos" no painel navega para a URL correta |
| **Passos** | 1. Abrir painel; 2. Clicar "Lançamentos"; 3. Aplicar |
| **Resultado esperado** | URL contém `lancamentos-imoveis` |

---

## CT23 — Zero resultados com filtros impossíveis

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que filtros impossíveis retornam "0 Imóveis" |
| **Passos** | 1. Navegar com `pmin:9000000000,pmax:10000000000,ban:4,gar:4` |
| **Resultado esperado** | h1 contém "0 Imóveis" |

---

## CT24 — Listagens sugeridas com 0 resultados

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que a página de 0 resultados exibe listagens sugeridas (fallback) |
| **Passos** | 1. Navegar para URL de zero resultados |
| **Resultado esperado** | h1 = "0 Imóveis"; ao menos um imóvel sugerido visível |

---

## CT25 — Botão Limpar visível com filtros ativos

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que o botão "Limpar" aparece quando há filtros aplicados |
| **Passos** | 1. Navegar com `?filtro=ban:2` |
| **Resultado esperado** | Botão "Limpar" visível |

---

## CT26 — API navigationFilters retorna dados válidos

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que a API retorna lista de tipos de imóvel com contagens |
| **Passos** | 1. Interceptar resposta da API ao carregar a listagem |
| **Resultado esperado** | Array com itens contendo propriedade `realtyID` |

---

## CT27 — API extraFilters retorna features válidas

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que a API retorna lista de features incluindo Piscina (ID=5) |
| **Passos** | 1. Fazer GET em `/api/realestate/listing/filters/getExtraFilters/` |
| **Resultado esperado** | Array inclui `{ id: 5, name: "Piscina" }` |

---

## CT28 — Filtros combinados via URL persistem na navegação

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que múltiplos filtros combinados se preservam na URL |
| **Passos** | 1. Navegar com quartos + ban + gar + pmin + pmax + ordenação |
| **Resultado esperado** | URL contém todos os filtros aplicados |

---

## CT29 — Limpar todos os filtros ao clicar em Limpar

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que o botão "Limpar" remove todos os filtros da URL |
| **Passos** | 1. Navegar com filtros; 2. Clicar "Limpar" |
| **Resultado esperado** | URL não contém mais os parâmetros de filtro |

---

## CT30 — Contagem no h1 atualiza ao aplicar filtro (5.b)

| Campo | Descrição |
|---|---|
| **Objetivo** | Verificar que a contagem de resultados no h1 muda ao aplicar um filtro |
| **Passos** | 1. Capturar texto do h1 sem filtro; 2. Navegar com filtro de 4 quartos; 3. Comparar h1 |
| **Resultado esperado** | h1 contém "4 quartos"; texto difere do estado inicial |
| **Critério de aceite** | A contagem de resultados reflete o estado do filtro ativo |
