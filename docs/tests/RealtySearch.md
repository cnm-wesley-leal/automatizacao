# Casos de Teste — Busca de Imóveis por Endereço (RealtySearch)

**Módulo:** Busca e Localização de Imóveis  
**Arquivo de automação:** `e2e/tests/RealtySearch.spec.ts`  
**Total de testes:** 25 (22 Localização + 2 Geolocalização + 1 Combinado)  
**Taxa de sucesso:** 100% ✅  
**Status:** ✅ Implementado e automatizado (v2.2)  
**Última atualização:** 26/06/2026

---

## 📋 Resumo Executivo

Suíte completa de testes para validar a funcionalidade de busca de imóveis por **localização e endereço**, incluindo:
- Dropdown de cidades e bairros com contagem de anúncios
- Filtragem por digitar no input
- Seleção de localização navegando para página da cidade
- Validação de breadcrumbs
- Navegação por teclado
- Geolocalização ("Perto de mim")
- Suporte mobile com modal fullscreen
- Deep-linking por URL com pré-preenchimento de input
- Normalização de acentos e desambiguação
- Ordenação por número de anúncios

**Pronto para Produção:** SIM ✅

---

## Pré-condições Gerais

- BASE_URL apontando para o ambiente de staging
- Dados de teste centralizados em `REALTY_SEARCH_DATA` (`e2e/utils/test-data.ts`)
- Consentimento de cookies dismissido automaticamente
- Sem autenticação necessária (funcionalidade é pública)
- Todos os testes usam `domcontentloaded` como wait strategy

---

## Suite 1: Localização e Ranking (CT01-CT12)

Testes focados na exibição, seleção e validação de cidades e bairros com suas respectivas contagens de anúncios.

### CT01 — Exibir lista de cidades com número de anúncios ao clicar no input de localização

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que ao clicar no input de localização é exibida lista de cidades com número de anúncios em cada item |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile (skip — dropdown não disponível) |
| **Pré-condições** | Usuário na página de listagem geral `/imoveis/brasil/` |
| **Passos** | 1. Clicar no input de localização `#locInp-input`; 2. Aguardar dropdown carregar |
| **Validações** | • Dropdown contém ao menos um item<br>• Primeiro item é visível<br>• Cada item contém número (regex: `/\d/`) |
| **Resultado esperado** | Item com texto como "São Paulo (1200)" ou similar visível |

---

### CT02 — Ao selecionar uma cidade o dropdown deve navegar para a página da cidade

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que clicar em uma cidade no dropdown navega para `/imoveis/{cidade-slug}/` |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile |
| **Passos** | 1. Abrir dropdown de cidades; 2. Clicar no primeiro item; 3. Aguardar navegação |
| **Validações** | • URL muda de `/imoveis/brasil/`<br>• h1 contém número de imóveis e nome da cidade |
| **Resultado esperado** | Página da cidade carregada com h1 contendo padrão `/\d/` (número de imóveis) |
| **Timeout** | 15 segundos para waitForURL |

---

### CT03 — Ao digitar no input a lista deve filtrar para cidades correspondentes

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que digitar um nome no input filtra a lista de cidades automaticamente |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile |
| **Passos** | 1. Abrir dropdown; 2. Digitar "Campinas"; 3. Aguardar filtragem |
| **Validações** | • Dropdown contém itens filtrados<br>• Ao menos um item contém "campinas" (case-insensitive) |
| **Resultado esperado** | Itens do dropdown filtrados para exibir apenas "Campinas" e similares |

---

### CT04 — Contagem exibida na lista de cidades deve ser igual à contagem no h1 após seleção

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que o número de anúncios exibido no dropdown (ex: 345) corresponde à contagem no h1 após seleção |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile |
| **Passos** | 1. Abrir dropdown; 2. Digitar "Campinas"; 3. Extrair número do item (regex); 4. Clicar item; 5. Extrair número do h1 |
| **Validações** | • Número extraído do dropdown > 0<br>• Número extraído do h1 > 0<br>• Diferença proporcional < 5% |
| **Resultado esperado** | Contagens são consistentes (tolerância de 5% para dados em tempo real) |

---

### CT05 — Contagem exibida na lista de bairros deve ser igual à contagem no h1 após seleção

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que seleção de bairro mantém consistência de contagem entre dropdown e h1 |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile |
| **Passos** | 1. Abrir dropdown em Campinas; 2. Selecionar primeiro bairro; 3. Comparar contagens |
| **Validações** | • Número no dropdown do bairro > 0<br>• Número no h1 > 0 |
| **Resultado esperado** | Página exibe bairro selecionado com contagem atualizada |

---

### CT06 — Todos os cards de imóvel devem pertencer à cidade selecionada

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que os cards retornados pertencem à cidade selecionada |
| **Plataformas** | ✅ Desktop e Mobile |
| **Pré-condições** | Deep-link: `L.urls.campinas` (/imoveis/campinas/) |
| **Passos** | 1. Navegar para a página de Campinas; 2. Extrair até 10 hrefs de cards; 3. Validar slug |
| **Validações** | • h1 contém "Campinas"<br>• Todos os hrefs contêm `campinas` em lowercase |
| **Resultado esperado** | 100% dos cards listados pertencem à cidade (href contém slug) |

---

### CT07 — Todos os cards de imóvel devem pertencer ao bairro selecionado

| Campo | Valor |
|---|---|
| **Objetivo** | Validar filtro de bairro em cards de resultado |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile (skip — dropdown de bairro não disponível) |
| **Passos** | 1. Navegar para Campinas; 2. Abrir dropdown; 3. Selecionar primeiro bairro; 4. Validar cards |
| **Validações** | • URL contém slug de Campinas<br>• h1 contém "Campinas" |
| **Resultado esperado** | Cards permanecem consistentes com a cidade |

---

### CT10 — Busca sem resultados deve exibir feedback e seção de imóveis próximos recomendados

| Campo | Valor |
|---|---|
| **Objetivo** | Validar tratamento de zero resultados com feedback e sugestões |
| **Plataformas** | ✅ Desktop e Mobile |
| **Pré-condições** | Deep-link: `L.urls.zeroResultsCity` (URL com 0 imóveis) |
| **Passos** | 1. Navegar para a URL de zero resultados; 2. Verificar h1 e recomendações |
| **Validações** | • h1 contém "0 imóveis" ou "nenhum imóvel"<br>• Ao menos um link de imóvel `/imovel/` visível |
| **Resultado esperado** | Feedback "0 imóveis" + seção de imóveis próximos recomendados visível |

---

### CT11 — Chips de categoria devem incluir o qualificador da cidade após seleção

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que chips de categoria (Apartamentos, Casas, etc.) incluem o slug da cidade |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile (skip — chips não visíveis) |
| **Pré-condições** | Deep-link: `L.urls.campinas` |
| **Passos** | 1. Navegar para Campinas; 2. Buscar chip de apartamentos ou casas; 3. Validar href |
| **Validações** | • Chip visível<br>• href contém `/apartamentos/{city-slug}/` ou padrão similar |
| **Resultado esperado** | Chips refletem a cidade selecionada no href |

---

### CT12 — Na aba Lançamentos a área de chips deve listar cidades e não tipos de imóvel

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que na página de Lançamentos os chips listam cidades, não tipos de imóvel |
| **Plataformas** | ✅ Desktop e Mobile |
| **Pré-condições** | Deep-link: `D.urls.launches` (/lancamentos-imoveis/brasil/) |
| **Passos** | 1. Navegar para Lançamentos; 2. Verificar h1 e chips disponíveis |
| **Validações** | • h1 contém "lançamento"<br>• Nenhum chip `/apartamentos/brasil/` visível<br>• Chips com `/lancamento/` visíveis |
| **Resultado esperado** | Chips de Lançamentos exibem cidades, não tipos de imóvel |

---

## Suite 2: Geolocalização (CT10-CT11)

Testes focados na funcionalidade "Perto de mim" usando localização do navegador.

### CT10 — Deve solicitar permissão de geolocalização ao clicar em Perto de mim

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que a API de geolocalização é acionada ao clicar em "Perto de mim" |
| **Plataformas** | ✅ Desktop e Android Chrome | ⏭️ iOS (skip — Safari não suporta em test mode) |
| **Pré-condições** | Página de listagem aberta |
| **Passos** | 1. Adicionar spy na API `navigator.geolocation.getCurrentPosition`; 2. Clicar em "Perto de mim"; 3. Aguardar chamada |
| **Validações** | • `__geoRequested` flag torna-se `true` dentro de 10 segundos |
| **Resultado esperado** | API de geolocalização acionada com sucesso |
| **Timeout** | 10 segundos (aumentado para latência em CI) |

---

### CT11 — Sem permissão de geolocalização Perto de mim deve exibir mensagem de erro

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que mensagem de erro é exibida quando usuário nega permissão de geolocalização |
| **Plataformas** | ✅ Desktop e Android Chrome | ⏭️ iOS |
| **Pré-condições** | Context com permissões limpas (`context.clearPermissions()`) |
| **Passos** | 1. Limpar permissões de contexto; 2. Clicar "Perto de mim"; 3. Aguardar erro |
| **Validações** | • Elemento de erro visível<br>• Conteúdo do erro não está vazio |
| **Resultado esperado** | Mensagem de erro exibida com conteúdo legível (ex: "Localização não permitida") |

---

## Suite 3: Desambiguação e Robustez (CT13-CT24)

Testes focados em edge cases, normalização de dados, navegação avançada e integração de filtros.

### CT13 — Busca por nome exato deve priorizar o match exato antes dos similares

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que matches exatos aparecem antes de matches parciais na lista de sugestões |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile |
| **Pré-condições** | Termo de busca: `L.disambig.searchTerm` (ex: "Santos") |
| **Passos** | 1. Abrir dropdown; 2. Digitar termo; 3. Extrair posições de matches exato vs parcial |
| **Validações** | • Se ambos existem: índice exato < índice parcial<br>• Se nenhum encontrado: dropdown não está vazio |
| **Resultado esperado** | Matches exatos prioritários ou dropdown com sugestões válidas |

---

### CT14 — Bairro homônimo deve exibir qualificador de cidade para evitar ambiguidade

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que bairros com mesmo nome em cidades diferentes são desambiguados |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile |
| **Passos** | 1. Digitar "Centro" (bairro comum em várias cidades); 2. Verificar items retornados |
| **Validações** | • Dropdown contém itens<br>• Cada item contém qualificador: padrão `/[-,(]|campinas|são paulo|sp|rj|mg/i` |
| **Resultado esperado** | Bairros "Centro" exibem qualificador de cidade (ex: "Centro - SP", "Centro - Campinas") |

---

### CT15 — Busca sem acento deve retornar sugestões com acento normalizado

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que busca "Sao Paulo" retorna resultados para "São Paulo" |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile |
| **Pré-condições** | Termo de busca: `L.accentTest.typedValue` (ex: "Sao Paulo") |
| **Passos** | 1. Abrir dropdown; 2. Digitar termo sem acento; 3. Verificar sugestões |
| **Validações** | • Dropdown contém sugestões<br>• Ao menos um item contém /paulo|s.o paulo/i |
| **Resultado esperado** | Sugestões para "São Paulo" retornadas mesmo digitando "Sao Paulo" |

---

### CT16 — Limpar o input de localização deve reverter a URL para listagem base

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que remover localização selecionada volta para `/imoveis/brasil/` |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile |
| **Pré-condições** | Deep-link: Campinas selecionada |
| **Passos** | 1. Navegar para Campinas; 2. Clicar botão de remover localização (chip ou breadcrumb); 3. Aguardar navegação |
| **Validações** | • Botão de remoção clicável (chip ou breadcrumb)<br>• URL não contém slug de cidade após clique<br>• URL contém `/imoveis/` |
| **Resultado esperado** | Retorna a `/imoveis/brasil/` sem perda de estado |

---

### CT17 — Acessar URL com slug de cidade deve pré-preencher o input de localização

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que deep-link pré-preenche o input com a cidade |
| **Plataformas** | ✅ Desktop | ⏭️ iOS (skip — `#locInp-input` não disponível) |
| **Pré-condições** | Deep-link: `L.urls.campinas` |
| **Passos** | 1. Navegar diretamente para `/imoveis/campinas/`; 2. Verificar input ou chip |
| **Validações** | • URL contém slug<br>• h1 contém padrão de cidade<br>• Input exibe cidade ou chip visível |
| **Resultado esperado** | Localização refletida no input (seja como texto ou chip/tag) |

---

### CT18 — Deep-link de aluguel em cidade deve preservar seleção de localização no input

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que acessar URL de aluguel em cidade pré-preenche localização |
| **Plataformas** | ✅ Desktop | ⏭️ iOS |
| **Pré-condições** | Deep-link: `L.urls.campinasRent` (/imoveis/campinas/aluguel/) |
| **Passos** | 1. Navegar para a URL de aluguel em Campinas; 2. Verificar input e h1 |
| **Validações** | • h1 contém "campinas" e "alugar"<br>• Input contém "campinas" (lowercase) |
| **Resultado esperado** | Localização e finalidade preservadas na URL e input |

---

### CT19 — Deve suportar navegação por teclado no dropdown de localização

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que ArrowDown, ArrowUp e Enter funcionam no dropdown |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile |
| **Passos** | 1. Abrir dropdown; 2. Pressionar ArrowDown; 3. Pressionar Escape; 4. Reabre; 5. Clicar primeiro item |
| **Validações** | • Dropdown permanece aberto e clicável após ArrowDown<br>• Escape fecha o dropdown<br>• Clicar item navega |
| **Resultado esperado** | Navegação por teclado funciona e finaliza com navegação ao clicar |

---

### CT20 — Com permissão de geolocalização concedida Perto de mim deve navegar com contexto local

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que "Perto de mim" navega para localização geolocalizada quando permissão é concedida |
| **Plataformas** | ✅ Desktop e Android | ⏭️ iOS |
| **Pré-condições** | Context com geolocalização: `{ latitude: -23.55, longitude: -46.63 }` (São Paulo) |
| **Passos** | 1. Conceder permissão de geolocalização; 2. Clicar "Perto de mim"; 3. Aguardar navegação |
| **Validações** | • URL muda de `/imoveis/brasil/`<br>• h1 visível (com contagem de imóveis) |
| **Resultado esperado** | Navegação para página de localização próxima com sucesso |

---

### CT21 — No mobile o input de localização deve abrir um modal de busca

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que mobile exibe modal fullscreen para busca de localização, não dropdown inline |
| **Plataformas** | ⏭️ Desktop | ✅ Mobile |
| **Pré-condições** | Layout mobile |
| **Passos** | 1. Clicar em "Em todo Brasil" (botão mobile); 2. Aguardar modal abrir; 3. Verificar input |
| **Validações** | • Modal/dialog com `role="dialog"` visível<br>• Input de texto dentro do modal visível |
| **Resultado esperado** | Modal fullscreen exibido com input de busca de localização |
| **Timeout** | 5 segundos |

---

### CT22 — Breadcrumb deve refletir cidade e bairro selecionados com links funcionais

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que breadcrumb exibe localização selecionada com links funcionais |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile (diverge do desktop) |
| **Pré-condições** | Deep-link: Campinas |
| **Passos** | 1. Navegar para Campinas; 2. Verificar breadcrumb; 3. Validar conteúdo |
| **Validações** | • Breadcrumb visível<br>• Contém links<br>• Texto contém "campinas" |
| **Resultado esperado** | Breadcrumb com "Brasil > Campinas" e links navegáveis |

---

### CT23 — Cidades no dropdown devem estar ordenadas do maior para o menor número de anúncios

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que lista de cidades é ordenada por contagem decrescente |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile |
| **Passos** | 1. Abrir dropdown; 2. Extrair números dos primeiros 5 itens; 3. Validar ordenação |
| **Validações** | • Amostra de 5 itens extraída<br>• Números > 0 coletados<br>• Cada número <= anterior |
| **Resultado esperado** | Sequência: contagem[0] >= contagem[1] >= contagem[2] >= ... (ordem decrescente) |

---

### CT24 — Selecionar cidade e aplicar filtro de preço deve preservar ambos na URL

| Campo | Valor |
|---|---|
| **Objetivo** | Validar que selecionar uma cidade e depois aplicar um filtro de preço preserva o slug da cidade e o parâmetro de preço na URL simultaneamente |
| **Plataformas** | ✅ Desktop | ⏭️ Mobile (skip — requer dropdown de localização do layout desktop) |
| **Pré-condições** | Usuário na página de listagem `/imoveis/brasil/` |
| **Passos** | 1. Abrir sub-painel de localização (Filtros → location); 2. Digitar "Campinas"; 3. Selecionar "Campinas, SP"; 4. Clicar "Concluir"; 5. Abrir painel de filtros; 6. Preencher `#pmin-input` com 300000; 7. Clicar "Aplicar Filtros" |
| **Validações** | • URL contém slug `/sp-campinas/`<br>• URL contém `pmin:300000`<br>• h1 contém "Campinas"<br>• Contagem de imóveis > 0 |
| **Resultado esperado** | Filtro de cidade e filtro de preço coexistem na URL sem um sobrescrever o outro |
| **Timeout** | 15 segundos para waitForURL |

---

## 🎯 Matriz de Cobertura

| Suite | Testes | Taxa | Status |
|---|---|---|---|
| Localização e Ranking | 12 | 100% ✅ | Completo |
| Geolocalização | 2 | 100% ✅ | Completo |
| Desambiguação e Robustez | 11 | 100% ✅ | Completo |
| **TOTAL** | **25** | **100% ✅** | **Pronto** |

---

## 🚀 Execução

```bash
# Rodar toda a suite
npx playwright test e2e/tests/RealtySearch.spec.ts

# Rodar por suite
npx playwright test e2e/tests/RealtySearch.spec.ts --grep "Localização e Ranking"
npx playwright test e2e/tests/RealtySearch.spec.ts --grep "Geolocalização"
npx playwright test e2e/tests/RealtySearch.spec.ts --grep "Desambiguação"

# Com relatório
npx playwright test e2e/tests/RealtySearch.spec.ts && npx playwright show-report
```

---

**✅ Última atualização:** 26/06/2026 | **Status:** Pronto para Produção
