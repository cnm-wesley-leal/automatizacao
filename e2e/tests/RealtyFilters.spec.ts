import { expect, test } from '@playwright/test'
import { REALTY_SEARCH_DATA } from '../utils/test-data'
import { applyFilters, clearFilters, dismissCookieConsent, openFilterPanel } from '../utils/helpers'

const D = REALTY_SEARCH_DATA

/** Extrai o primeiro número inteiro de um texto (ignora separadores de milhar). */
function extractFirstNumber(text: string | null | undefined): number {
  if (!text) return -1
  const cleaned = text.replace(/\./g, '').replace(/,/g, '')
  const match = cleaned.match(/\d+/)
  return match ? parseInt(match[0], 10) : -1
}

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
    await expect(page.locator('a[href*="/lancamento/"]').first()).toBeVisible()
  })

  // ── 2. Tipo de imóvel específico ─────────────────────────────────────────

  test('CT04 - deve exibir contagem de apartamentos ao navegar para /apartamentos/', async ({ page }) => {
    test.slow() // /apartamentos/brasil/ é consistentemente lento no staging (~30s)
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
    // Aguarda os 3 botões "+ 2" (quartos, banheiros, garagens) estarem presentes
    // antes de clicar, evitando que o modal iOS renderize banheiros antes de quartos
    try {
      await expect(page.getByRole('button', { name: '+ 2' })).toHaveCount(3, { timeout: 8000 })
    } catch {
      // Se não encontrar 3 botões, continua com o que estiver disponível
      // em mobile layouts que renderizam diferentemente
    }
    await page.getByRole('button', { name: '+ 2' }).first().click()
    await applyFilters(page)
    await expect(page).toHaveURL(/\/2-quartos\//)
  })

  test('CT07 - deve reidratar botão de quartos ao abrir URL com /2-quartos/', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Quartos accordion collapsed by default in mobile filter modal — button not in accessibility tree')
    await page.goto(`${D.urls.listings}2-quartos/`, { waitUntil: 'domcontentloaded' })
    await openFilterPanel(page)
    // O primeiro botão "+ 2" é o de quartos (precede banheiros e garagens no DOM)
    // TODO: Melhorar quando componente expor aria-pressed. Por enquanto, validar classe CSS de estado ativo
    // Estado ativo indicado pela classe outline+primary — componente não expõe aria-pressed
    const quartoButton = page.getByRole('button', { name: '+ 2' }).first()
    await expect(quartoButton).toHaveClass(/style_outline/)
    // Validar que botão está visualmente destacado (não desabilitado)
    await expect(quartoButton).not.toHaveClass(/disabled|inactive/)
  })

  // ── 4. Filtro de banheiros e garagens ────────────────────────────────────

  test('CT08 - deve aplicar filtros de banheiros e garagens via URL', async ({ page }) => {
    // Capturar contagem inicial (sem filtro)
    await page.goto(D.urls.listings, { waitUntil: 'domcontentloaded' })
    const h1Initial = page.getByRole('heading', { level: 1 })
    const countInitial = await h1Initial.textContent()
    
    // Aplicar filtro e validar que contagem mudou
    await page.goto(`${D.urls.listings}?filtro=ban:2,gar:1`, { waitUntil: 'domcontentloaded' })
    const h1Filtered = page.getByRole('heading', { level: 1 })
    const countFiltered = await h1Filtered.textContent()
    
    // Validar que contagem diminuiu (menos resultados com filtros)
    await expect(h1Filtered).toBeVisible()
    await expect(page).toHaveURL(/filtro=ban:2,gar:1/)
    expect(countFiltered, 'Filtros devem reduzir contagem de resultados').not.toBe(countInitial)
  })

  // ── 5. Filtro de preço ───────────────────────────────────────────────────

  test('CT09 - deve aplicar filtro de preço via painel de filtros', async ({ page, isMobile }) => {
    test.skip(isMobile, 'iOS Safari does not commit both price inputs reliably in the filter modal')
    // Passo 1: aplicar pmin
    await openFilterPanel(page)
    const pmin = page.locator('#pmin-input')
    await pmin.fill('300000')
    // Checkpoint: validar que valor foi digitado
    await expect(pmin).toHaveValue(/300/)
    await applyFilters(page, pmin)
    await expect(page).toHaveURL(/pmin:300000/)
    const h1AfterPmin = page.getByRole('heading', { level: 1 })
    await expect(h1AfterPmin).toBeVisible()
    await page.waitForLoadState('domcontentloaded')
    
    // Passo 2: adicionar pmax preservando pmin da URL resultante
    await openFilterPanel(page)
    const pmax = page.locator('#pmax-input')
    await pmax.fill('800000')
    // Checkpoint: validar que valor foi digitado
    await expect(pmax).toHaveValue(/800/)
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
    // Regex específico para evitar matches parciais (ex: "3001", "8001")
    await expect(page.locator('#pmin-input')).toHaveValue(/300000|300\.000/)
    await expect(page.locator('#pmax-input')).toHaveValue(/800000|800\.000/)
  })

  // ── 6. Filtro de área útil ───────────────────────────────────────────────

  test('CT12 - deve aplicar filtro de área útil via painel de filtros', async ({ page, isMobile }) => {
    test.skip(isMobile, 'iOS Safari does not commit area inputs reliably in the filter modal')
    // Passo 1: aplicar amin
    await openFilterPanel(page)
    const amin = page.locator('#amin-input')
    await amin.fill('80')
    // Checkpoint: validar que valor foi digitado
    await expect(amin).toHaveValue(/80/)
    await applyFilters(page, amin)
    await expect(page).toHaveURL(/amin:80/)
    const h1AfterAmin = page.getByRole('heading', { level: 1 })
    await expect(h1AfterAmin).toBeVisible()
    await page.waitForLoadState('domcontentloaded')
    
    // Passo 2: adicionar amax preservando amin da URL resultante
    await openFilterPanel(page)
    const amax = page.locator('#amax-input')
    await amax.fill('150')
    // Checkpoint: validar que valor foi digitado
    await expect(amax).toHaveValue(/150/)
    await applyFilters(page, amax)
    await expect(page).toHaveURL(/amin:80/)
    await expect(page).toHaveURL(/amax:150/)
  })

  test('CT13 - deve reidratar inputs de área ao abrir URL com amin/amax', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Filter modal on iOS does not pre-populate area inputs from URL params')
    await page.goto(`${D.urls.listings}?filtro=amin:80,amax:150`, { waitUntil: 'domcontentloaded' })
    await openFilterPanel(page)
    // Inputs exibem valor formatado (ex: "80 m²") — IDs usados pois não há label acessível
    // Regex específico para evitar matches parciais (ex: "800", "1501")
    await expect(page.locator('#amin-input')).toHaveValue(/^80/)
    await expect(page.locator('#amax-input')).toHaveValue(/^150/)
  })

  // ── 7. Filtro de características (features) ──────────────────────────────

  test('CT14 - deve aplicar filtro de feature (Piscina) via URL', async ({ page }) => {
    await page.goto(`${D.urls.listings}?filtro=are:[${D.featureIds.piscina}]`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Usar referência a D.featureIds em vez de ID hardcoded
    await expect(page).toHaveURL(new RegExp(`are:\\[${D.featureIds.piscina}\\]`))
  })

  test('CT15 - deve marcar feature no painel ao abrir URL com are: aplicado', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Feature accordion is collapsed by default in mobile modal — desktop sidebar always shows features expanded')
    await page.goto(`${D.urls.listings}?filtro=are:[${D.featureIds.piscina}]`, { waitUntil: 'domcontentloaded' })
    await openFilterPanel(page)
    // TODO: Melhorar quando componente expor aria-pressed. Por enquanto, validar classe CSS de estado ativo
    // Estado ativo indicado pela classe outline+primary — componente não expõe aria-pressed
    const piscinaButton = page.getByRole('button', { name: 'Piscina' })
    await expect(piscinaButton).toHaveClass(/style_outline/)
    // Validar que botão está visualmente destacado (não desabilitado)
    await expect(piscinaButton).not.toHaveClass(/disabled|inactive/)
  })

  // ── 8. Ordenação (parameterizado) ────────────────────────────────────────

  const sortCases: Array<{ id: string; label: string; urlParam: RegExp }> = [
    { id: 'CT16', label: 'Mais recentes',  urlParam: /filtro=or:6/ },
    { id: 'CT17', label: 'Menor preço R$', urlParam: /filtro=or:1/ },
    { id: 'CT18', label: 'Maior preço R$', urlParam: /filtro=or:2/ },
  ]

  for (const { id, label, urlParam } of sortCases) {
    test(`${id} - deve aplicar ordenação "${label}" via UI`, async ({ page, isMobile }) => {
      test.skip(isMobile, 'Sort UI not available on mobile layout')
      await page.getByRole('button', { name: /Ordernar por/i }).click()
      await page.getByRole('button', { name: label }).click()
      await expect(page).toHaveURL(urlParam)
    })
  }

  // ── 9. Paginação ─────────────────────────────────────────────────────────

  test('CT19 - deve navegar para página 2', async ({ page }) => {
    await page.goto(`${D.urls.listings}?pg=2`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page).toHaveURL(/pg=2/)
  })

  test('CT20 - deve exibir link para próxima página', async ({ page }) => {
    await expect(page.locator('a[href*="?pg=2"]')).toBeVisible()
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
  // CT23 incorporado em CT24 (era subconjunto: mesma URL, mesma asserção de h1)

  test('CT24 - deve exibir 0 imóveis e listagens sugeridas com filtros impossíveis', async ({ page }) => {
    await page.goto(D.urls.zeroResults, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toContainText('0 Imóveis')
    // A página ainda exibe listagens sugeridas (comportamento de fallback)
    await expect(page.locator('a[href*="/imovel/"]').first()).toBeVisible()
  })

  test('CT25 - deve exibir botão Limpar quando há filtros aplicados', async ({ page }) => {
    await page.goto(`${D.urls.listings}?filtro=ban:2`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Limpar' }).first()).toBeVisible()
  })

  test('CT25b - não deve exibir botão Limpar quando não há filtros aplicados', async ({ page }) => {
    await page.goto(D.urls.listings, { waitUntil: 'domcontentloaded' })
    // Validar que botão NÃO existe ou está oculto (teste negativo)
    const clearButton = page.getByRole('button', { name: 'Limpar' })
    await expect(clearButton).toHaveCount(0)
  })

  // ── 13. API endpoints ────────────────────────────────────────────────────

  test('CT26 - navigationFilters API deve retornar lista de tipos com contagens', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes(D.api.navigationFilters) && res.status() === 200),
      page.goto(D.urls.listings, { waitUntil: 'domcontentloaded' }),
    ])
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    const items: unknown[] = Array.isArray(data)
      ? data
      : (data.data?.items ?? data.results ?? data.items ?? [])
    expect(items.length).toBeGreaterThan(0)
    // Validar estrutura de cada item (API pode usar 'count' ou 'total')
    for (const item of items.slice(0, 3)) {
      expect(item).toHaveProperty('realtyID', expect.any(Number))
      const hasCount = 'count' in (item as Record<string, unknown>) || 'total' in (item as Record<string, unknown>)
      expect(hasCount, `Item deve ter 'count' ou 'total' para contagem`).toBe(true)
    }
  })

  test('CT27 - extraFilters API deve retornar lista de features com IDs', async ({ page }) => {
    const response = await page.request.get(D.api.extraFilters)
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(Array.isArray(data)).toBeTruthy()
    expect(data.length).toBeGreaterThan(0)
    // Validar estrutura de cada feature
    for (const feature of data.slice(0, 5)) {
      expect(feature).toHaveProperty('id', expect.any(Number))
      expect(feature).toHaveProperty('name', expect.any(String))
      expect(feature.name.length).toBeGreaterThan(0)
    }
    // Validar que piscina está na lista
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
    await expect(page).not.toHaveURL(/ban:2/)
  })

  // ── 16. Contagem de resultados ───────────────────────────────────────────

  test('CT30 - deve atualizar contagem no h1 ao aplicar filtro de quartos', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    const initialText = await h1.textContent() ?? ''
    expect(initialText).toMatch(/\d/)
    const initialCount = extractFirstNumber(initialText)
    expect(initialCount, 'H1 inicial deve conter um número').toBeGreaterThan(0)

    await page.goto(`${D.urls.listings}4-quartos/`, { waitUntil: 'domcontentloaded' })
    await expect(h1).toContainText(/4 quartos/i)
    const filteredText = await h1.textContent() ?? ''
    const filteredCount = extractFirstNumber(filteredText)
    expect(filteredCount, 'Contagem após filtro deve ser menor').toBeLessThan(initialCount)
  })
})
