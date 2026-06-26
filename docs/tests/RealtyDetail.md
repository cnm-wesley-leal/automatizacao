# Casos de Teste — Detalhes de Imóvel (RealtyDetail)

**Arquivo de automação:** `e2e/tests/RealtyDetail.spec.ts`
**Arquivo de fuzz:** `e2e/fuzz/RealtyDetailFuzz.spec.ts`
**Total de testes:** 40 (10 Renderização + 10 Funcionalidades + 16 Veracidade + 4 Mobile Exclusivos)
**Status:** ✅ Implementado e automatizado

## Pré-condições Gerais

- `BASE_URL` apontando para staging (`https://staging.chavesnamao.com.br`)
- Dados centralizados em `REALTY_DETAIL_DATA` (test-data.ts)
- Suite A e B: navegam dinamicamente ao primeiro imóvel disponível na lista (sem slug fixo)
- Suite C (Veracidade): cada CT aplica um filtro na lista, clica no 1º card e valida o detalhe
- CT11 e CT12 exigem autenticação (fixture `auth.ts`)

## Observações de Staging

- Estado de "0 resultados": não há componente dedicado — o h1 exibe `"0 Imóveis..."` e a página continua mostrando sugestões. A detecção usa `/^0\s/i` no texto do h1.
- Tabs de navegação no detalhe são `<button>` dentro de `<nav>` (não `role="tab"`): "N Fotos", "Mapa", "Street View", "Nas proximidades".
- Preço fica em `<table>` com célula "Aluguel" (ou "Venda") + célula de valor.
- Condomínio e IPTU aparecem apenas em imóveis para aluguel (segunda linha da tabela de preço).
- Botões de contato fixos no rodapé: "Ver telefones" e "Contatar".
- Formulário de perguntas rápidas: `textbox "Escreva sua pergunta..."` + `button "Enviar"`.

---

## Suite A — Renderização dos Blocos (CT01–CT10)

**beforeEach:** navega ao primeiro imóvel de aluguel disponível via `navigateToFirstResult`.

### CT01 — Galeria de fotos presente com ao menos 1 imagem

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que a galeria de fotos renderiza com imagens |
| **Passos** | 1. Acessar detalhe via lista de aluguel |
| **Validações** | • Ao menos 1 `img[alt]` dentro do `article` está visível |
| **Plataformas** | ✅ Desktop e Mobile |

### CT02 — Preço principal visível com valor numérico

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que o preço está presente e é um número válido |
| **Passos** | 1. Acessar detalhe |
| **Validações** | • `table` com célula contendo "R$" está visível; valor extraído > 0 |
| **Plataformas** | ✅ Desktop e Mobile |

### CT03 — Endereço presente (bairro e/ou cidade)

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que o endereço do imóvel está visível |
| **Passos** | 1. Acessar detalhe |
| **Validações** | • `h2` com endereço está visível e contém texto |
| **Plataformas** | ✅ Desktop e Mobile |

### CT04 — Características presentes (quartos, banheiros, área, garagens)

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que os atributos do imóvel aparecem |
| **Passos** | 1. Acessar detalhe |
| **Validações** | • `li` com "Quartos" visível; `li` com "Banheiros" visível; `li` com "Área" visível |
| **Plataformas** | ✅ Desktop e Mobile |

### CT05 — Descrição do imóvel presente

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que a seção de descrição existe |
| **Passos** | 1. Acessar detalhe |
| **Validações** | • Parágrafo com texto "Descrição" visível; texto descritivo não vazio |
| **Plataformas** | ✅ Desktop e Mobile |

### CT06 — Seção de mapa/proximidades presente

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que a seção de proximidades existe |
| **Passos** | 1. Acessar detalhe |
| **Validações** | • `h2` com "Proximidades" visível |
| **Plataformas** | ✅ Desktop e Mobile |

### CT07 — Botões de contato do anunciante presentes

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que o anunciante é acessível |
| **Passos** | 1. Acessar detalhe |
| **Validações** | • Botão de contato visível (`"Mensagem"` / `"Solicitar visita"` no desktop; `"Contatar"` no mobile); `textbox "Escreva sua pergunta..."` visível |
| **Plataformas** | ✅ Desktop e Mobile |
| **Observação** | No desktop o botão "Contatar" fica no React Portal `#portal-bottom-sticky` (mobile-only); o sidebar exibe "Mensagem" e "Solicitar visita" |

### CT08 — Imóvel de aluguel exibe condomínio e/ou IPTU

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar campos exclusivos de locação |
| **Passos** | 1. Acessar detalhe de imóvel de aluguel |
| **Validações** | • Pelo menos um de: texto `/condomínio/i` ou `/iptu/i` visível na tabela de preços |
| **Plataformas** | ✅ Desktop e Mobile |

### CT09 — Imóvel de venda não exibe "Aluguel" no preço

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar variação condicional aluguel vs. venda |
| **Passos** | 1. Navegar ao primeiro imóvel de venda; 2. Verificar tabela de preço |
| **Validações** | • Tabela de preço não contém texto "Aluguel" |
| **Plataformas** | ✅ Desktop e Mobile |

### CT10 — Responsividade: elementos-chave visíveis em viewport mobile (375px)

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que a página não quebra em tela pequena |
| **Passos** | 1. Acessar detalhe em viewport 375x667 |
| **Validações** | • h1 visível; tabela de preço visível; botão "Contatar" visível |
| **Plataformas** | ✅ Mobile only |
| **Observação** | `test.skip(!isMobile)` — validação de responsividade mobile |

---

## Suite B — Funcionalidades (CT11–CT20)

**beforeEach:** navega ao primeiro imóvel de aluguel disponível via `navigateToFirstResult`.

### CT11 — Favoritar imóvel (logado) — botão muda estado visual

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que o botão de favoritar responde ao clique |
| **Passos** | 1. Acessar detalhe (autenticado); 2. Clicar em "Favoritar" |
| **Validações** | • Após clique, botão muda aria-label ou classe visual |
| **Auth** | ✅ Logado (fixture auth) |

### CT12 — Desfavoritar imóvel (logado) — toggle reverte estado

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que o favoritar é toggle |
| **Passos** | 1. Clicar favoritar; 2. Clicar novamente |
| **Validações** | • Estado reverte ao original |
| **Auth** | ✅ Logado (fixture auth) |

### CT13 — Favoritar (deslogado) — botão presente e ação tratada sem crash

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que o botão de favoritar existe e que a ação não causa crash para usuário anônimo |
| **Passos** | 1. Criar contexto anônimo (`browser.newContext()` sem storageState); 2. Acessar detalhe; 3. Clicar "Favoritar"; 4. Aguardar 2s |
| **Validações** | • Botão "Favoritar" visível; sem erros de JS; URL não é página de erro |
| **Auth** | Anônimo |
| **Observação** | O app permite favoriting anônimo (armazena localmente). Não exige login no clique — a proteção de rota ocorre apenas ao acessar `/favoritos`. Modal/redirect não é garantido neste fluxo. |

### CT14 — Tab "Fotos" ativa por padrão com galeria visível

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar estado inicial das tabs |
| **Passos** | 1. Acessar detalhe |
| **Validações** | • Botão "N Fotos" na nav está presente; imagens da galeria visíveis |
| **Auth** | Anônimo |

### CT15 — Tab "Mapa" exibe seção de proximidades ao clicar

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar navegação via tabs |
| **Passos** | 1. Clicar botão "Mapa" na nav; 2. Aguardar 1s |
| **Validações** | • `h2` contendo `/proximidades/i` está presente no DOM (count > 0) |
| **Auth** | Anônimo |
| **Observação** | Usa `locator('h2').filter({ hasText: /proximidades/i }).count()` — mais robusto que `toBeVisible()` após troca de tab |

### CT16 — Botão de telefone do anunciante presente

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar presença do contato por telefone |
| **Passos** | 1. Acessar detalhe |
| **Validações** | • Botão de telefone visível — `"Ver telefones"` no mobile (portal) ou botão com número `(XX) XXXX...` no desktop (sidebar) |
| **Auth** | Anônimo |
| **Observação** | O rodapé fixo (`#portal-bottom-sticky`) é mobile-only; no desktop o número aparece no sidebar com texto `"(XX) XXXX… Ver"` |

### CT17 — Botão de contato com o anunciante presente

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar CTA de contato com o anunciante |
| **Passos** | 1. Acessar detalhe |
| **Validações** | • Botão de contato visível — `"Mensagem"` / `"Solicitar visita"` no desktop (sidebar) ou `"Contatar"` no mobile (portal) |
| **Auth** | Anônimo |
| **Observação** | O rodapé fixo (`#portal-bottom-sticky`) é mobile-only; no desktop o CTA fica no sidebar |

### CT18 — Formulário de perguntas rápidas presente

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar presença do formulário de contato |
| **Passos** | 1. Acessar detalhe |
| **Validações** | • `textbox "Escreva sua pergunta..."` visível; `button "Enviar"` visível |
| **Auth** | Anônimo |

### CT19 — Pergunta rápida dispara ação ao clicar (sem crash)

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que clicar em pergunta rápida executa uma ação sem erro |
| **Passos** | 1. Clicar em `button "Eu posso visitar?"`; 2. Aguardar 1,5s |
| **Validações** | • Sem erros de JS; URL não é página de erro |
| **Auth** | Anônimo |
| **Observação** | O botão envia a mensagem diretamente (não pré-preenche o textbox). Qualquer resposta válida (envio, toast, pré-preenchimento) é aceita — o critério é ausência de crash. |

### CT20 — Formulário de contato não causa erro ao enviar sem autenticação

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que o envio do formulário de contato não causa crash |
| **Passos** | 1. Preencher textbox com mensagem; 2. Clicar `button "Enviar"`; 3. Aguardar 1,5s |
| **Validações** | • Sem erros de JS; URL não é página de erro (`/404`, `/error`, `/not-found`) |
| **Auth** | Anônimo |
| **Observação** | O botão "Enviar" não fica desabilitado com campo vazio e não há validação inline no staging. O teste valida robustez do envio, não validação de campo. |

---

## Suite C — Veracidade dos Detalhes Filtrados (CT21–CT36)

**Objetivo:** Para cada CT, a spec aplica um filtro na lista, clica no primeiro card disponível e valida que a página de detalhe é coerente com o filtro aplicado — provando que a lista não exibe dados falsos ou quebrados.

**Padrão de cada CT:**
1. Navegar para URL de listagem com filtro
2. Dispensar cookie consent
3. Validar que há ao menos 1 card
4. Clicar no primeiro card e aguardar carregamento
5. Validar dado específico na página de detalhe

### CT21 — Aluguel: detalhe indica tipo locação

| Campo | Valor |
|---|---|
| **Filtro** | `/imoveis-para-alugar/brasil/` |
| **Validação no detalhe** | Tabela de preço contém texto `/aluguel/i` |

### CT22 — Venda: detalhe indica tipo venda

| Campo | Valor |
|---|---|
| **Filtro** | `/imoveis-a-venda/brasil/` |
| **Validação no detalhe** | Tabela de preço NÃO contém texto "Aluguel" |

### CT23 — 2 quartos: detalhe exibe ≥ 2 quartos

| Campo | Valor |
|---|---|
| **Filtro** | `/imoveis/brasil/2-quartos/` |
| **Validação no detalhe** | `li[Quartos]` exibe número ≥ 2 |

### CT24 — 3 quartos: detalhe exibe ≥ 3 quartos

| Campo | Valor |
|---|---|
| **Filtro** | `/imoveis/brasil/3-quartos/` |
| **Validação no detalhe** | `li[Quartos]` exibe número ≥ 3 |

### CT25 — Preço mínimo: detalhe exibe preço ≥ R$ 500.000

| Campo | Valor |
|---|---|
| **Filtro** | `/imoveis/brasil/?filtro=pmin:500000` |
| **Validação no detalhe** | Preço extraído da tabela ≥ 500.000 |

### CT26 — Preço máximo: detalhe exibe preço ≤ R$ 800.000

| Campo | Valor |
|---|---|
| **Filtro** | `/imoveis/brasil/?filtro=pmax:800000` |
| **Validação no detalhe** | Preço extraído da tabela ≤ 800.000 |

### CT27 — Banheiros: detalhe exibe ≥ 2 banheiros

| Campo | Valor |
|---|---|
| **Filtro** | `/imoveis/brasil/?filtro=ban:2` |
| **Validação no detalhe** | `li[Banheiros]` exibe número ≥ 2 |

### CT28 — Garagem: detalhe exibe ≥ 1 vaga

| Campo | Valor |
|---|---|
| **Filtro** | `/imoveis/brasil/?filtro=gar:1` |
| **Validação no detalhe** | `li[Garagens]` exibe número ≥ 1 |

### CT29 — Feature piscina: detalhe menciona "piscina"

| Campo | Valor |
|---|---|
| **Filtro** | `/imoveis/brasil/?filtro=are:[5]` |
| **Validação no detalhe** | Lista de amenidades ou texto contém `/piscina/i` |

### CT30 — Feature elevador: detalhe menciona "elevador"

| Campo | Valor |
|---|---|
| **Filtro** | `/imoveis/brasil/?filtro=are:[12]` |
| **Validação no detalhe** | Lista de amenidades ou texto contém `/elevador/i` |

### CT31 — Ordenação menor preço: 1º card tem preço ≤ 2º card na lista

| Campo | Valor |
|---|---|
| **Filtro** | `/imoveis/brasil/?filtro=or:1` |
| **Validação na lista** | Extrai preço do 1º e 2º cards (data-attribute ou text); preço1 ≤ preço2 |
| **Observação** | Não navega para o detalhe — valida ordenação na própria lista |

### CT32 — Combinado (aluguel + 2q + ban:1): detalhe satisfaz todos

| Campo | Valor |
|---|---|
| **Filtro** | `/imoveis-para-alugar/brasil/2-quartos/?filtro=ban:1` |
| **Validação no detalhe** | Tabela contém "aluguel"; quartos ≥ 2; banheiros ≥ 1 |

### CT33 — Zero resultados (preço absurdo): h1 mostra "0 Imóveis"

| Campo | Valor |
|---|---|
| **URL** | `/imoveis-para-alugar/brasil/?filtro=pmin:9000000000,pmax:10000000000` |
| **Validação** | h1 começa com "0 "; sem erros de JS; página não quebra |

### CT34 — Zero resultados (filtros contraditórios pmin > pmax): página não quebra

| Campo | Valor |
|---|---|
| **URL** | `/imoveis-a-venda/brasil/?filtro=pmin:5000000,pmax:1000` |
| **Validação** | h1 visível; sem erro 500; sem erros de JS |

### CT35 — Zero resultados (combinação impossível): estado vazio consistente

| Campo | Valor |
|---|---|
| **URL** | `/imoveis-para-alugar/sp-campinas/?filtro=pmin:9000000000,pmax:10000000000` |
| **Validação** | h1 começa com "0 " OU contém "nenhum"; sem erros de JS |

### CT36 — URL com parâmetros UTM: detalhe carrega normalmente

| Campo | Valor |
|---|---|
| **Cenário** | Acessar um detalhe real via lista + appender `?utm_source=test&utm_medium=e2e` |
| **Validação** | h1 visível; preço visível; sem erros de JS; URL não muda para /404 |

---

## Suite D — Mobile Exclusivos (CT37–CT40)

**Configuração:** `test.use({ ...devices['iPhone 14'] })` — viewport 390×844, `isMobile: true`, `hasTouch: true`, sem forçar WebKit (roda em Chromium com emulação de mobile).

**beforeEach:** navega ao primeiro imóvel de aluguel disponível via `navigateToFirstResult`.

**Contexto:** O React Portal `#portal-bottom-sticky` é exibido apenas em viewports mobile via media query CSS. No desktop ele existe no DOM mas fica oculto, por isso esses CTs não são cobertos pelas suites A–C.

### CT37 — Portal fixo: botão "Ver telefones" visível no rodapé (mobile)

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que o CTA de telefone do rodapé fixo é acessível no mobile |
| **Passos** | 1. Scrollar 300px; 2. Aguardar animação (400ms) |
| **Validações** | • `#portal-bottom-sticky button` contendo `"Ver telefones"` está visível |
| **Plataformas** | ✅ Mobile only |

### CT38 — Portal fixo: botão "Contatar" visível no rodapé (mobile)

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que o CTA de contato do rodapé fixo é acessível no mobile |
| **Passos** | 1. Scrollar 300px; 2. Aguardar animação (400ms) |
| **Validações** | • `#portal-bottom-sticky button` contendo `"Contatar"` está visível |
| **Plataformas** | ✅ Mobile only |

### CT39 — Clicar "Contatar" no portal leva ao formulário de contato (mobile)

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que o CTA de contato do rodapé aciona o formulário de pergunta |
| **Passos** | 1. Scrollar 300px; 2. Clicar `button "Contatar"` no portal; 3. Aguardar 1s |
| **Validações** | • `textbox "Escreva sua pergunta..."` fica visível (scroll automático ou abertura de painel) |
| **Plataformas** | ✅ Mobile only |

### CT40 — Layout mobile sem overflow horizontal

| Campo | Valor |
|---|---|
| **Objetivo** | Verificar que a página não tem scroll horizontal no viewport mobile |
| **Passos** | 1. Acessar detalhe |
| **Validações** | • `document.documentElement.scrollWidth <= window.innerWidth + 5px` |
| **Plataformas** | ✅ Mobile only |

---

## Como Executar

```bash
# Suite completa
yarn playwright test e2e/tests/RealtyDetail.spec.ts

# Apenas Suite C (veracidade)
yarn playwright test e2e/tests/RealtyDetail.spec.ts --grep "CT2[1-9]|CT3[0-6]"

# Apenas Suite D (mobile exclusivos)
yarn playwright test e2e/tests/RealtyDetail.spec.ts --grep "CT3[7-9]|CT40"

# Fuzz (seed determinístico)
FUZZ_ITERATIONS=20 FUZZ_SEED=42 \
  yarn playwright test --config playwright.fuzz.config.ts e2e/fuzz/RealtyDetailFuzz.spec.ts

# Reproduzir falha com mesmo seed
FUZZ_ITERATIONS=20 FUZZ_SEED=99 \
  yarn playwright test --config playwright.fuzz.config.ts RealtyDetailFuzz --reporter=list

# Relatório HTML
yarn playwright show-report
```
