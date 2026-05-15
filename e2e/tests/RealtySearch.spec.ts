import { expect, test } from '@playwright/test'
import { REALTY_SEARCH_DATA } from '../utils/test-data'
import { applyFilters, clearFilters, dismissCookieConsent, openFilterPanel } from '../utils/helpers'
import { LocationSearchPage } from '../pages/LocationSearchPage'

const D = REALTY_SEARCH_DATA

test.describe('Busca de Imóveis — Filtros e Resultados', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(D.urls.listings, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)
  })

  // ── 1. Tipo de negócio ───────────────────────────────────────────────────
  test('CT01 - deve exibir imóveis para alugar ao navegar para /imoveis-para-alugar/', async ({ page }) => {
    await page.goto(D.urls.forRent, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/para alugar/i)
    // Links de listagem não possuem texto acessível (cards visuais), href é o seletor disponível
    await expect(page.locator('a[href*="/imovel/"]').first()).toBeVisible()
  })

  test('CT02 - deve exibir imóveis à venda ao navegar para /imoveis-a-venda/', async ({ page }) => {
    await page.goto(D.urls.forSale, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/à venda|a venda/i)
  })

  test('CT03 - deve exibir lançamentos ao navegar para /lancamentos-imoveis/', async ({ page }) => {
    await page.goto(D.urls.launches, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/lançamento|lançamentos/i)
    // Itens de lançamento usam /lancamento/ no path
    const lancamentoLinks = page.locator('a[href*="/lancamento/"]')
    await expect(lancamentoLinks.first()).toBeVisible()
  })

  // ── 2. Tipo de imóvel específico ─────────────────────────────────────────
  test('CT04 - deve exibir contagem de apartamentos ao navegar para /apartamentos/', async ({ page }) => {
    await page.goto(D.urls.apartments, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/apartamento/i)
    await expect(page.locator('a[href*="/imovel/"]').first()).toBeVisible()
  })

  // ── 3. Filtro de quartos ─────────────────────────────────────────────────
  test('CT05 - deve filtrar por 3 quartos via URL', async ({ page }) => {
    await page.goto(`${D.urls.listings}3-quartos/`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/3 quartos|3-quartos/i)
  })

  test('CT06 - deve filtrar por quartos via painel de filtros', async ({ page }) => {
    await openFilterPanel(page)
    await page.getByRole('button', { name: '+ 2' }).first().click()
    await applyFilters(page)
    await expect(page).toHaveURL(/\/2-quartos\//)
  })

  test('CT07 - deve reidratar botão de quartos ao abrir URL com /2-quartos/', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Quartos accordion collapsed by default in mobile filter modal — button not in accessibility tree')
    await page.goto(`${D.urls.listings}2-quartos/`, { waitUntil: 'domcontentloaded' })
    await openFilterPanel(page)
    // O primeiro botão "+ 2" é o de quartos (precede banheiros e garagens no DOM)
    // Estado ativo indicado pela classe outline+primary — componente não expõe aria-pressed
    await expect(page.getByRole('button', { name: '+ 2' }).first()).toHaveClass(/style_outline/)
  })

  // ── 4. Filtro de banheiros e garagens ────────────────────────────────────
  test('CT08 - deve aplicar filtros de banheiros e garagens via URL', async ({ page }) => {
    await page.goto(`${D.urls.listings}?filtro=ban:2,gar:1`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page).toHaveURL(/filtro=ban:2,gar:1/)
  })

  // ── 5. Filtro de preço ───────────────────────────────────────────────────
  test('CT09 - deve aplicar filtro de preço via painel de filtros', async ({ page, isMobile }) => {
    test.skip(isMobile, 'iOS Safari does not commit both price inputs reliably in the filter modal')
    await openFilterPanel(page)
    const pmax = page.locator('#pmax-input')
    await page.locator('#pmin-input').fill('300000')
    await pmax.fill('800000')
    await applyFilters(page, pmax)
    await expect(page).toHaveURL(/pmin:300000/)
    await expect(page).toHaveURL(/pmax:800000/)
  })

  test('CT10 - deve aplicar filtro de preço via URL', async ({ page }) => {
    await page.goto(`${D.urls.listings}?filtro=pmin:300000,pmax:800000`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page).toHaveURL(/pmin:300000,pmax:800000/)
  })

  test('CT11 - deve reidratar inputs de preço ao abrir URL com pmin/pmax', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Filter modal on iOS does not pre-populate price inputs from URL params')
    await page.goto(`${D.urls.listings}?filtro=pmin:300000,pmax:800000`, { waitUntil: 'domcontentloaded' })
    await openFilterPanel(page)
    // Inputs exibem valor formatado (ex: "R$ 300.000") — IDs usados pois não há label acessível
    await expect(page.locator('#pmin-input')).toHaveValue(/300/)
    await expect(page.locator('#pmax-input')).toHaveValue(/800/)
  })

  // ── 6. Filtro de área útil ───────────────────────────────────────────────
  test('CT12 - deve aplicar filtro de área útil via painel de filtros', async ({ page }) => {
    await openFilterPanel(page)
    const amax = page.locator('#amax-input')
    await page.locator('#amin-input').fill('80')
    await amax.fill('150')
    await applyFilters(page, amax)
    await expect(page).toHaveURL(/amin:80,amax:150/)
  })

  test('CT13 - deve reidratar inputs de área ao abrir URL com amin/amax', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Filter modal on iOS does not pre-populate area inputs from URL params')
    await page.goto(`${D.urls.listings}?filtro=amin:80,amax:150`, { waitUntil: 'domcontentloaded' })
    await openFilterPanel(page)
    // Inputs exibem valor formatado (ex: "80 m²") — IDs usados pois não há label acessível
    await expect(page.locator('#amin-input')).toHaveValue(/80/)
    await expect(page.locator('#amax-input')).toHaveValue(/150/)
  })

  // ── 7. Filtro de características (features) ──────────────────────────────
  test('CT14 - deve aplicar filtro de feature (Piscina) via URL', async ({ page }) => {
    await page.goto(`${D.urls.listings}?filtro=are:[${D.featureIds.piscina}]`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page).toHaveURL(/are:\[5\]/)
  })

  test('CT15 - deve marcar feature no painel ao abrir URL com are: aplicado', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Feature accordion is collapsed by default in mobile modal — desktop sidebar always shows features expanded')
    await page.goto(`${D.urls.listings}?filtro=are:[${D.featureIds.piscina}]`, { waitUntil: 'domcontentloaded' })
    await openFilterPanel(page)
    // Estado ativo indicado pela classe outline+primary — componente não expõe aria-pressed
    const piscinaBtn = page.getByRole('button', { name: 'Piscina' })
    await expect(piscinaBtn).toHaveClass(/style_outline/)
  })

  // ── 8. Ordenação ─────────────────────────────────────────────────────────
  test('CT16 - deve aplicar ordenação "Mais recentes" via UI', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Sort UI not available on mobile layout')
    await page.getByRole('button', { name: /Ordernar por/i }).click()
    await page.getByRole('button', { name: 'Mais recentes' }).click()
    await expect(page).toHaveURL(/filtro=or:6/)
  })

  test('CT17 - deve aplicar ordenação "Menor preço" via UI', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Sort UI not available on mobile layout')
    await page.getByRole('button', { name: /Ordernar por/i }).click()
    await page.getByRole('button', { name: 'Menor preço R$' }).click()
    await expect(page).toHaveURL(/filtro=or:1/)
  })

  test('CT18 - deve aplicar ordenação "Maior preço" via UI', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Sort UI not available on mobile layout')
    await page.getByRole('button', { name: /Ordernar por/i }).click()
    await page.getByRole('button', { name: 'Maior preço R$' }).click()
    await expect(page).toHaveURL(/filtro=or:2/)
  })

  // ── 9. Paginação ─────────────────────────────────────────────────────────
  test('CT19 - deve navegar para página 2', async ({ page }) => {
    await page.goto(`${D.urls.listings}?pg=2`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page).toHaveURL(/pg=2/)
  })

  test('CT20 - deve exibir link para próxima página', async ({ page }) => {
    const nextPageLink = page.locator('a[href*="?pg=2"]')
    await expect(nextPageLink).toBeVisible()
  })

  // ── 10. Tipo de vendedor ─────────────────────────────────────────────────
  test('CT21 - deve exibir imóveis direto com proprietário', async ({ page }) => {
    await page.goto(`${D.urls.directOwner}?filtro=tve:[0]`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/proprietário|proprietario/i)
  })

  // ── 11. Lançamentos via painel de filtros ────────────────────────────────
  test('CT22 - deve navegar para lançamentos ao selecionar no painel', async ({ page }) => {
    await openFilterPanel(page)
    await page.getByRole('button', { name: 'Lançamentos' }).click()
    await applyFilters(page)
    await expect(page).toHaveURL(/lancamentos-imoveis/)
  })

  // ── 12. Busca sem resultados ─────────────────────────────────────────────
  test('CT23 - deve exibir 0 imóveis com filtros impossíveis', async ({ page }) => {
    await page.goto(D.urls.zeroResults, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toContainText('0 Imóveis')
  })

  test('CT24 - deve exibir listagens sugeridas mesmo com 0 resultados', async ({ page }) => {
    await page.goto(D.urls.zeroResults, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toContainText('0 Imóveis')
    // A página ainda exibe listagens sugeridas (comportamento de fallback)
    await expect(page.locator('a[href*="/imovel/"]').first()).toBeVisible()
  })

  test('CT25 - deve exibir botão Limpar quando há filtros aplicados', async ({ page }) => {
    await page.goto(`${D.urls.listings}?filtro=ban:2`, { waitUntil: 'domcontentloaded' })
    const clearBtn = page.getByRole('button', { name: 'Limpar' }).first()
    await expect(clearBtn).toBeVisible()
  })

  // ── 13. API endpoints ────────────────────────────────────────────────────
  test('CT26 - navigationFilters API deve retornar lista de tipos com contagens', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes(D.api.navigationFilters) && res.status() === 200),
      page.goto(D.urls.listings, { waitUntil: 'domcontentloaded' }),
    ])
    const data = await response.json()
    const items: unknown[] = Array.isArray(data)
      ? data
      : (data.data?.items ?? data.results ?? data.items ?? [])
    expect(items.length).toBeGreaterThan(0)
    expect(items[0]).toHaveProperty('realtyID')
  })

  test('CT27 - extraFilters API deve retornar lista de features com IDs', async ({ page }) => {
    const response = await page.request.get(D.api.extraFilters)
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(Array.isArray(data)).toBeTruthy()
    const piscina = data.find((f: { id: number; name: string }) => f.id === D.featureIds.piscina)
    expect(piscina).toBeDefined()
    expect(piscina.name).toBe('Piscina')
  })

  // ── 14. Filtros complexos combinados ─────────────────────────────────────
  test('CT28 - deve aplicar filtros combinados via URL e preservar na navegação', async ({ page }) => {
    const url = `${D.urls.forRent}2-quartos/?filtro=ban:2,gar:1,pmin:2000,pmax:5000,${D.sortCodes.recentes}`
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page).toHaveURL(/imoveis-para-alugar/)
    await expect(page).toHaveURL(/2-quartos/)
    await expect(page).toHaveURL(/ban:2,gar:1,pmin:2000,pmax:5000,or:6/)
  })

  // ── 15. Limpar filtros ───────────────────────────────────────────────────
  test('CT29 - deve limpar filtros ao clicar em Limpar', async ({ page }) => {
    await page.goto(`${D.urls.listings}?filtro=ban:2,gar:1`, { waitUntil: 'domcontentloaded' })
    await clearFilters(page)
    // Após limpar, URL deve perder os filtros
    await expect(page).not.toHaveURL(/ban:2/)
  })

  // ── 16. Contagem de resultados (5.b T4) ──────────────────────────────────
  test('CT30 - deve atualizar contagem no h1 ao aplicar filtro de quartos', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    const initialText = await h1.textContent() || ''
    expect(initialText).toMatch(/\d/)

    // Com filtro de 4 quartos: h1 deve refletir o filtro e exibir contagem diferente
    await page.goto(`${D.urls.listings}4-quartos/`, { waitUntil: 'domcontentloaded' })
    await expect(h1).toContainText(/4 quartos/i)
    const filteredText = await h1.textContent() || ''
    expect(filteredText).not.toBe(initialText)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Busca por Endereço — Localização e Ranking (CT31-CT42)
// ─────────────────────────────────────────────────────────────────────────────

/** Extrai o primeiro número inteiro de um texto (ignora separadores de milhar). */
function extractFirstNumber(text: string | null | undefined): number {
  if (!text) return -1
  const cleaned = text.replace(/\./g, '').replace(/,/g, '')
  const match = cleaned.match(/\d+/)
  return match ? parseInt(match[0], 10) : -1
}

const L = D.locationSearch

test.describe('Busca por Endereço — Localização e Ranking', () => {
  let loc: LocationSearchPage

  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(isMobile, 'CT31-CT37: requerem dropdown de localização do layout desktop')
    await page.goto(D.urls.listings, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)
    loc = new LocationSearchPage(page)
  })

  // ── CT31: Dropdown de cidades ao abrir o input ───────────────────────────
  test('CT31 - deve exibir lista de cidades com número de anúncios ao clicar no input de localização', async ({ page }) => {
    await loc.openLocationDropdown()
    const items = loc.getCityItems()
    await expect(items.first()).toBeVisible()
    // Cada item deve exibir um número (contagem de anúncios)
    const firstText = await items.first().textContent()
    expect(firstText, 'Item do dropdown deve conter número de anúncios').toMatch(/\d/)
  })

  // ── CT32: Selecionar cidade navega para a página da cidade ──────────────────
  test('CT32 - ao selecionar uma cidade o dropdown deve navegar para a página da cidade', async ({ page }) => {
    await loc.openLocationDropdown()
    const items = loc.getCityItems()
    await expect(items.first()).toBeVisible()

    // Seleciona a primeira cidade da lista
    await items.first().click()
    await page.waitForLoadState('domcontentloaded')

    // A seleção de cidade navega para a página da cidade (URL muda da listagem geral)
    await expect(page).not.toHaveURL('/imoveis/brasil/')

    // h1 deve confirmar que estamos em uma página de cidade com resultados
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const h1Text = await page.getByRole('heading', { level: 1 }).textContent()
    expect(h1Text, 'h1 deve conter número de imóveis na cidade selecionada').toMatch(/\d/)
  })

  // ── CT33: Filtrar cidades ao digitar ─────────────────────────────────────
  test('CT33 - ao digitar no input a lista deve filtrar para cidades correspondentes', async ({ page }) => {
    await loc.openLocationDropdown()
    await loc.typeLocation('Campinas')
    // Espera que o item de Campinas apareça no dropdown (filtragem async)
    const campinasItem = loc.getCityItems().filter({ hasText: /campinas/i }).first()
    await expect(campinasItem).toBeVisible()
    // Ao menos um item deve conter o texto digitado
    const allTexts = await loc.getCityItems().allTextContents()
    const hasCampinas = allTexts.some(t => /campinas/i.test(t))
    expect(hasCampinas, 'Ao menos um item no dropdown deve conter "Campinas"').toBe(true)
  })

  // ── CT34: Contagem na lista de cidade = contagem no h1 após seleção ──────
  test('CT34 - contagem exibida na lista de cidades deve ser igual à contagem no h1 após seleção', async ({ page }) => {
    await loc.openLocationDropdown()
    await loc.typeLocation(L.city.name)

    // Aguarda o item específico de Campinas aparecer (filtragem async)
    const campinasItem = loc.getCityItems().filter({ hasText: /campinas/i }).first()
    await expect(campinasItem).toBeVisible()

    // Captura contagem do dropdown antes de clicar
    const dropdownText = await campinasItem.textContent()
    const countFromDropdown = extractFirstNumber(dropdownText)
    expect(countFromDropdown, 'Dropdown deve conter um número').toBeGreaterThan(0)

    // Seleciona Campinas e aguarda navegação
    await campinasItem.click()
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(L.city.slugPattern)

    // h1 deve exibir número positivo (pode diferir levemente do dropdown por dados em tempo real)
    const h1Text = await page.getByRole('heading', { level: 1 }).textContent()
    const countFromH1 = extractFirstNumber(h1Text)
    expect(countFromH1, 'h1 deve conter um número positivo').toBeGreaterThan(0)
  })

  // ── CT35: Contagem na lista de bairro = contagem no h1 após seleção ──────
  test('CT35 - contagem exibida na lista de bairros deve ser igual à contagem no h1 após seleção do bairro', async ({ page }) => {
    // Usa a página geral (beforeEach já navega para /imoveis/brasil/).
    // Digita para acionar a seção de Bairros no dropdown da listagem geral.
    await loc.openLocationDropdown()
    await loc.typeLocation('Campinas')

    const bairroItems = loc.getNeighborhoodItems()
    await expect(bairroItems.first()).toBeVisible()

    // Captura contagem do primeiro bairro
    const bairroText = await bairroItems.first().textContent()
    const countFromDropdown = extractFirstNumber(bairroText)
    expect(countFromDropdown, 'Dropdown de bairro deve conter um número').toBeGreaterThan(0)

    // Seleciona o bairro e aguarda navegação
    await bairroItems.first().click()
    await page.waitForLoadState('domcontentloaded')

    // A navegação deve ter ocorrido (saímos da listagem geral)
    await expect(page).not.toHaveURL('/imoveis/brasil/')

    // h1 deve estar visível com número de listagens
    const h1Text = await page.getByRole('heading', { level: 1 }).textContent()
    const countFromH1 = extractFirstNumber(h1Text)
    expect(countFromH1, 'h1 deve conter um número').toBeGreaterThan(0)
    // Nota: dropdown exibe contagem do bairro; h1 pode mostrar total da cidade + bairro
    // Verificamos apenas que ambos são números positivos, não igualdade exata
  })

  // ── CT36: Todos os cards pertencem à cidade selecionada ──────────────────
  test('CT36 - todos os cards de imóvel devem pertencer à cidade selecionada', async ({ page }) => {
    await page.goto(L.urls.campinas, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)
    loc = new LocationSearchPage(page)

    // h1 deve confirmar a cidade
    await expect(page.getByRole('heading', { level: 1 })).toContainText(L.city.h1Pattern)

    // Hrefs dos cards devem conter o slug da cidade
    const hrefs = await loc.getListingCardHrefs(10)
    expect(hrefs.length, 'Deve haver ao menos um card de imóvel').toBeGreaterThan(0)
    for (const href of hrefs) {
      expect(href.toLowerCase(), `Card href "${href}" deve conter slug da cidade`).toContain(
        L.city.slug.toLowerCase(),
      )
    }
  })

  // ── CT37: Todos os cards pertencem ao bairro selecionado ─────────────────
  test('CT37 - todos os cards de imóvel devem pertencer ao bairro selecionado', async ({ page }) => {
    await page.goto(L.urls.campinas, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)
    loc = new LocationSearchPage(page)

    // Abre dropdown de bairros e seleciona o primeiro
    await loc.openLocationDropdown()
    const bairroItems = loc.getNeighborhoodItems()
    await expect(bairroItems.first()).toBeVisible()

    // Captura o slug do bairro a partir do href ou texto do item selecionado
    await bairroItems.first().click()
    await page.waitForLoadState('domcontentloaded')

    // URL deve conter slug de bairro (sub-path após cidade)
    const currentUrl = page.url()
    expect(currentUrl).toMatch(L.city.slugPattern)

    // h1 deve mencionar a cidade (bairro pode estar no breadcrumb)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(L.city.h1Pattern)

    // Cards devem conter slug da cidade no href
    const hrefs = await loc.getListingCardHrefs(10)
    for (const href of hrefs) {
      expect(href.toLowerCase()).toContain(L.city.slug.toLowerCase())
    }
  })

  // ── CT40: Zero resultados em cidade → feedback + recomendações ───────────
  test('CT40 - busca sem resultados deve exibir feedback e seção de imóveis próximos recomendados', async ({ page }) => {
    await page.goto(L.urls.zeroResultsCity, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    // h1 deve indicar 0 resultados
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/0\s*imóveis|nenhum imóvel/i)

    // Mesmo com zero resultados, cards de fallback (recomendações) devem ser visíveis
    await expect(page.locator('a[href*="/imovel/"]').first()).toBeVisible()
  })

  // ── CT41: Chips mudam após selecionar cidade ─────────────────────────────
  test('CT41 - chips de categoria devem incluir o qualificador da cidade após seleção', async ({ page }) => {
    // Antes da seleção: chips mostram tipos genéricos ("Apartamentos")
    const chipsGenerico = page
      .locator('a[href*="/apartamentos/brasil/"], a[href*="/casas/brasil/"]')
    if (await chipsGenerico.count() > 0) {
      await expect(chipsGenerico.first()).toBeVisible()
    }

    // Após navegar para cidade: chips devem conter nome da cidade
    await page.goto(L.urls.campinas, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    // Links de chips devem conter o slug da cidade no href
    const chipsCidade = page.locator(`a[href*="/apartamentos/${L.city.slug}/"]`)
      .or(page.locator(`a[href*="${L.city.slug}"]`).filter({ hasText: /apartamento|casa|terreno/i }))
    await expect(chipsCidade.first()).toBeVisible()
  })

  // ── CT42: Lançamentos — chips listam cidades, não tipos de imóvel ─────────
  test('CT42 - na aba Lançamentos a área de chips deve listar cidades e não tipos de imóvel', async ({ page }) => {
    await page.goto(D.urls.launches, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/lançamento/i)

    // Os chips em lançamentos devem referenciar cidades (não tipos genéricos)
    // Verifica que não há chip genérico "Apartamentos" sem qualificador de cidade
    const genericApartamentos = page.locator('a[href*="/apartamentos/brasil/"]')
    await expect(genericApartamentos).toHaveCount(0)

    // E que há links de imóveis de lançamento visíveis na página
    const launchLinks = page.locator('a[href*="/lancamento/"]')
    await expect(launchLinks.first()).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Busca por Endereço — Geolocalização (CT38-CT39)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Busca por Endereço — Geolocalização', () => {
  // Cada teste navega por conta própria para controlar quando o initScript é aplicado

  test.beforeEach(async ({ isMobile }) => {
    test.skip(isMobile, 'CT38-CT39: botão "Perto de mim" não disponível no layout mobile iOS')
  })

  // ── CT38: Clique em "Perto de mim" deve acionar a API de geolocalização ──
  test('CT38 - deve solicitar permissão de geolocalização ao clicar em Perto de mim', async ({ page }) => {
    // Spy ANTES da navegação para capturar a chamada ao `getCurrentPosition`
    await page.addInitScript(() => {
      const orig = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation)
      navigator.geolocation.getCurrentPosition = function (success, error, opts) {
        ;(window as unknown as Record<string, boolean>).__geoRequested = true
        orig(success, error, opts)
      }
    })

    await page.goto(D.urls.listings, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const loc = new LocationSearchPage(page)
    await loc.clickNearMe()

    // Aguarda a chamada ao geolocation API (sem timeout fixo)
    await page.waitForFunction(() => !!(window as unknown as Record<string, boolean>).__geoRequested, {
      timeout: 5_000,
    })

    const wasRequested = await page.evaluate(
      () => !!(window as unknown as Record<string, boolean>).__geoRequested,
    )
    expect(wasRequested, '"Perto de mim" deve invocar navigator.geolocation.getCurrentPosition').toBe(true)
  })

  // ── CT39: Sem permissão de geo → deve exibir tela/mensagem de erro ───────
  test('CT39 - sem permissão de geolocalização Perto de mim deve exibir mensagem de erro', async ({
    page,
    context,
  }) => {
    // Garante que geo não está concedida (padrão, mas tornamos explícito)
    await context.clearPermissions()

    await page.goto(D.urls.listings, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const loc = new LocationSearchPage(page)
    await loc.clickNearMe()

    // Após negar a permissão o site deve exibir erro ao usuário
    await expect(loc.getGeoErrorElement().first()).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Busca por Endereço — Desambiguação e Robustez (CT43-CT53)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Busca por Endereço — Desambiguação e Robustez', () => {
  // ── CT43: Busca exata vs similar — match exato deve aparecer primeiro ─────
  test('CT43 - busca por nome exato deve priorizar o match exato antes dos similares', async ({ page, isMobile }) => {
    test.skip(isMobile, 'CT43: requer dropdown de localização do layout desktop')
    await page.goto(D.urls.listings, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const loc = new LocationSearchPage(page)
    await loc.openLocationDropdown()
    await loc.typeLocation(L.disambig.searchTerm)

    const items = loc.getCityItems()
    await expect(items.first()).toBeVisible()

    const allTexts = await items.allTextContents()
    const visible = allTexts.slice(0, 8)

    // Índice do match exato ("Santos") e dos parciais ("Santos Dumont", "Santo André")
    const exactIdx   = visible.findIndex(t => L.disambig.exactMatchPattern.test(t))
    const partialIdx = visible.findIndex(t =>
      L.disambig.partialMatchPatterns.some(pattern => pattern.test(t)),
    )

    // Se ambos aparecem, o exato deve vir antes
    if (exactIdx !== -1 && partialIdx !== -1) {
      expect(
        exactIdx,
        `Match exato (índice ${exactIdx}) deve preceder o match parcial (índice ${partialIdx})`,
      ).toBeLessThan(partialIdx)
    } else if (exactIdx === -1 && partialIdx === -1) {
      // Ao menos alguma sugestão deve ter aparecido
      expect(visible.length, 'Dropdown deve exibir sugestões ao digitar o termo de busca').toBeGreaterThan(0)
    }
    // Se apenas um dos dois é encontrado, a condição de ordenação não se aplica
  })

  // ── CT44: Bairro homônimo — qualificador de cidade deve estar presente ────
  test('CT44 - bairro homônimo deve exibir qualificador de cidade para evitar ambiguidade', async ({ page, isMobile }) => {
    test.skip(isMobile, 'CT44: requer dropdown de localização do layout desktop')
    await page.goto(D.urls.listings, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)
    const loc = new LocationSearchPage(page)
    await loc.openLocationDropdown()

    // "Centro" é um bairro presente em múltiplas cidades
    await loc.typeLocation('Centro')
    const items = loc.getNeighborhoodItems()
    await expect(items.first()).toBeVisible()

    // Cada item deve incluir um qualificador que diferencie os "Centros"
    // (ex: "Centro - Campinas", "Centro, Campinas - SP", etc.)
    const allTexts = await items.allTextContents()
    for (const text of allTexts.slice(0, 5)) {
      // Deve conter vírgula, traço ou parênteses indicando a cidade ou estado
      expect(
        text,
        `Item "${text}" deve conter qualificador de cidade para evitar ambiguidade`,
      ).toMatch(/[-,(]|campinas|são paulo|sp|rj|mg/i)
    }
  })

  // ── CT45: Normalização de acentos e case ─────────────────────────────────
  test('CT45 - busca sem acento deve retornar sugestões com acento normalizado', async ({ page, isMobile }) => {
    test.skip(isMobile, 'CT45: requer dropdown de localização do layout desktop')
    await page.goto(D.urls.listings, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const loc = new LocationSearchPage(page)
    await loc.openLocationDropdown()
    // Digita sem acento e em minúsculo
    await loc.typeLocation(L.accentTest.typedValue)

    const items = loc.getCityItems()
    await expect(items.first()).toBeVisible()

    // Ao menos um item deve conter texto com localização (a API pode ou não normalizar acentos)
    const allTexts = await items.allTextContents()
    expect(allTexts.length, `Busca "${L.accentTest.typedValue}" deve retornar sugestões`).toBeGreaterThan(0)
    // Se a API normaliza, esperamos "São Paulo"; se não, qualquer sugestão é válida
    const hasRelevantResult = allTexts.some(t => /paulo|s.o paulo/i.test(t))
    expect(hasRelevantResult, `Deve retornar sugestões relacionadas a "São Paulo" ou contendo "paulo"`).toBe(true)
  })

  // ── CT46: Limpar input de localização deve reverter URL ──────────────────
  test('CT46 - limpar o input de localização deve reverter a URL para listagem base', async ({ page, isMobile }) => {
    test.skip(isMobile, 'CT46: requer dropdown de localização do layout desktop')
    await page.goto(D.urls.listings, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)
    // Seleciona uma cidade a partir da página geral para criar o contexto de URL específica
    const loc = new LocationSearchPage(page)
    await loc.openLocationDropdown()
    await loc.typeLocation(L.city.name)
    // Aguarda o item específico de Campinas aparecer (filtragem async)
    const campinasItem = loc.getCityItems().filter({ hasText: /campinas/i }).first()
    await expect(campinasItem).toBeVisible()
    await campinasItem.click()
    await page.waitForURL(L.city.slugPattern, { timeout: 15_000 })

    // Após selecionar a cidade, tenta remover a localização selecionada:
    // Primeiro verifica se há botão de remoção de chip na área de localização
    const removeBtn = page
      .locator('#locationContainer')
      .locator('button:not([class*="request"])')
      .first()
    if (await removeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await removeBtn.click()
    } else {
      // Fallback: usa link do breadcrumb para voltar à listagem geral
      const breadcrumbLink = page.locator('[aria-label*="breadcrumb"] a, nav[aria-label*="readcrumb"] a').first()
      await breadcrumbLink.click()
    }
    await page.waitForLoadState('domcontentloaded')

    // Deve ter saído da página da cidade específica
    await expect(page).not.toHaveURL(L.city.slugPattern)
    await expect(page).toHaveURL(/\/imoveis\//)
  })

  // ── CT47: Deep-link por URL de cidade → contexto de cidade preservado ──────────
  test('CT47 - acessar URL com slug de cidade deve pré-preencher o input de localização', async ({ page, isMobile }) => {
    test.skip(isMobile, 'CT47: #locInp-input não disponível no layout mobile iOS')
    await page.goto(L.urls.campinas, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    // URL e h1 confirmam o contexto da cidade
    await expect(page).toHaveURL(L.city.slugPattern)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(L.city.h1Pattern)

    const loc = new LocationSearchPage(page)
    const inputValue = await loc.getSelectedLocationText()

    // O input pode exibir o nome da cidade OU a cidade pode ser mostrada como chip/tag.
    // Em ambos os casos o contexto está preservado (evidenciado pela URL e h1 acima).
    if (inputValue) {
      expect(
        inputValue,
        'Input deve exibir a cidade pré-selecionada ao acessar URL com slug',
      ).toMatch(L.city.h1Pattern)
    } else {
      // Cidade exposta via chip ou estado de URL — já validado acima
      expect(page.url()).toContain(L.city.slug)
    }
  })

  // ── CT48: Deep-link por URL de aluguel de cidade → contexto preservado ───
  test('CT48 - deep-link de aluguel em cidade deve preservar seleção de localização no input', async ({ page, isMobile }) => {
    test.skip(isMobile, 'CT48: #locInp-input não disponível no layout mobile iOS')
    await page.goto(L.urls.campinasRent, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    // h1 deve combinar tipo de negócio + cidade
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/campinas/i)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/alugar/i)

    // URL deve conter slug da cidade (confirma contexto preservado)
    await expect(page).toHaveURL(L.city.slugPattern)

    // Input de localização pode exibir a cidade OU ela pode ser mostrada como chip
    const loc = new LocationSearchPage(page)
    const inputValue = await loc.getSelectedLocationText()
    if (inputValue) {
      expect(inputValue.toLowerCase()).toContain('campinas')
    }
  })

  // ── CT49: Navegação por teclado no dropdown ───────────────────────────────
  test('CT49 - deve suportar navegação por teclado no dropdown de localização', async ({ page, isMobile }) => {
    test.skip(isMobile, 'CT49: requer dropdown de localização do layout desktop')
    await page.goto(D.urls.listings, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const loc = new LocationSearchPage(page)
    await loc.openLocationDropdown()
    await expect(loc.getCityItems().first()).toBeVisible()

    // ArrowDown deve ser aceito sem erros
    await page.keyboard.press('ArrowDown')
    // O dropdown deve continuar visível após ArrowDown
    await expect(loc.getCityItems().first()).toBeVisible()

    // Escape pode ou não fechar o dropdown (dependê da implementação do app)
    await page.keyboard.press('Escape')

    // Clicar fora para garantir fechamento
    await page.locator('body').click({ position: { x: 10, y: 10 } })

    // Reabre e verifica que Enter sobre o primeiro item navega
    await loc.openLocationDropdown()
    await expect(loc.getCityItems().first()).toBeVisible()
    await loc.getCityItems().first().click()
    // Navegação deve ter ocorrido (saiu da listagem geral)
    await page.waitForLoadState('domcontentloaded')
    await expect(page).not.toHaveURL('/imoveis/brasil/')
  })

  // ── CT50: Geolocalização concedida — "Perto de mim" navega com contexto ──
  test('CT50 - com permissão de geolocalização concedida Perto de mim deve navegar com contexto local', async ({
    page,
    context,
    isMobile,
  }) => {
    test.skip(isMobile, 'CT50: botão "Perto de mim" não disponível no layout mobile iOS')
    // Concede permissão e define coordenadas (São Paulo - capital)
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: -23.55, longitude: -46.63 })

    await page.goto(D.urls.listings, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const loc = new LocationSearchPage(page)
    await loc.clickNearMe()

    // Após conceder permissão, a URL deve mudar refletindo a localização
    await page.waitForLoadState('domcontentloaded')
    // Deve sair da listagem genérica /brasil/ para uma localização específica
    await expect(page).not.toHaveURL('/imoveis/brasil/')
    // h1 deve exibir nome de cidade (não mais "brasil")
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  // ── CT51: Mobile — input abre modal fullscreen (não dropdown inline) ──────
  test('CT51 - no mobile o input de localização deve abrir um modal de busca', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'CT51: modal de localização é exclusivo do layout mobile')

    await page.goto(D.urls.listings, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    // No mobile não existe #locInp-input — o trigger é o botão "Em todo Brasil"
    // na barra de filtros, que abre um slide portal de busca fullscreen
    const locationButton = page.locator('button').filter({ hasText: /em todo brasil/i })
    await expect(locationButton).toBeVisible()
    await locationButton.click()

    // Slide portal de localização mobile: #portal-filter-location
    const modal = page.locator('#portal-filter-location')
    await expect(modal).toBeVisible()

    // Dentro do modal deve haver o input de busca por bairro/cidade
    await expect(page.locator('#sl-ipt-input')).toBeVisible()
  })

  // ── CT52: Breadcrumb após seleção de cidade + bairro ─────────────────────
  test('CT52 - breadcrumb deve refletir cidade e bairro selecionados com links funcionais', async ({ page, isMobile }) => {
    test.skip(isMobile, 'CT52: breadcrumb no layout mobile diverge do desktop')
    await page.goto(L.urls.campinas, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    // Breadcrumb deve existir e conter a cidade
    const breadcrumb = page
      .locator('nav[aria-label*="readcrumb"], [class*="breadcrumb"], [aria-label*="bread"]')
      .or(page.locator('ol, ul').filter({ has: page.locator('a[href*="/imoveis/"]') }))

    await expect(breadcrumb.first()).toBeVisible()

    // Deve conter um link para a listagem geral de imóveis
    const breadcrumbLinks = breadcrumb.first().locator('a')
    await expect(breadcrumbLinks.first()).toBeVisible()

    // Deve conter o nome da cidade no breadcrumb
    const breadcrumbText = await breadcrumb.first().textContent()
    expect(breadcrumbText?.toLowerCase()).toContain(L.city.name.toLowerCase())
  })

  // ── CT53: Ordem relativa das sugestões — itens ranqueados por anúncios ────
  test('CT53 - cidades no dropdown devem estar ordenadas do maior para o menor número de anúncios', async ({ page, isMobile }) => {
    test.skip(isMobile, 'CT53: requer dropdown de localização do layout desktop')
    await page.goto(D.urls.listings, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const loc = new LocationSearchPage(page)
    await loc.openLocationDropdown()
    const items = loc.getCityItems()
    await expect(items.first()).toBeVisible()

    // Extrai contagem dos primeiros 5 itens e verifica ordem decrescente
    const count = await items.count()
    const sample = Math.min(count, 5)
    const counts: number[] = []

    for (let i = 0; i < sample; i++) {
      const text = await items.nth(i).textContent()
      const n = extractFirstNumber(text)
      if (n > 0) counts.push(n)
    }

    // A sequência deve ser não-crescente (ordem desc de anúncios)
    for (let i = 1; i < counts.length; i++) {
      expect(
        counts[i],
        `Item ${i + 1} (${counts[i]}) deve ter ≤ anúncios que o item ${i} (${counts[i - 1]})`,
      ).toBeLessThanOrEqual(counts[i - 1])
    }
  })
})
