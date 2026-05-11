import { expect, test } from '@playwright/test'
import { REALTY_SEARCH_DATA } from '../utils/test-data'
import { applyFilters, clearFilters, dismissCookieConsent, openFilterPanel } from '../utils/helpers'

const D = REALTY_SEARCH_DATA

test.describe('Busca de Imóveis — Filtros e Resultados', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(D.urls.listings)
    await dismissCookieConsent(page)
  })

  // ── 1. Tipo de negócio ───────────────────────────────────────────────────
  test('CT01 - deve exibir imóveis para alugar ao navegar para /imoveis-para-alugar/', async ({ page }) => {
    await page.goto(D.urls.forRent)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/para alugar/i)
    // Links de listagem não possuem texto acessível (cards visuais), href é o seletor disponível
    await expect(page.locator('a[href*="/imovel/"]').first()).toBeVisible()
  })

  test('CT02 - deve exibir imóveis à venda ao navegar para /imoveis-a-venda/', async ({ page }) => {
    await page.goto(D.urls.forSale)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/à venda|a venda/i)
  })

  test('CT03 - deve exibir lançamentos ao navegar para /lancamentos-imoveis/', async ({ page }) => {
    await page.goto(D.urls.launches)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/lançamento|lançamentos/i)
    // Itens de lançamento usam /lancamento/ no path
    const lancamentoLinks = page.locator('a[href*="/lancamento/"]')
    await expect(lancamentoLinks.first()).toBeVisible()
  })

  // ── 2. Tipo de imóvel específico ─────────────────────────────────────────
  test('CT04 - deve exibir contagem de apartamentos ao navegar para /apartamentos/', async ({ page }) => {
    await page.goto(D.urls.apartments)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/apartamento/i)
    await expect(page.locator('a[href*="/imovel/"]').first()).toBeVisible()
  })

  // ── 3. Filtro de quartos ─────────────────────────────────────────────────
  test('CT05 - deve filtrar por 3 quartos via URL', async ({ page }) => {
    await page.goto(`${D.urls.listings}3-quartos/`)
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
    await page.goto(`${D.urls.listings}2-quartos/`)
    await openFilterPanel(page)
    // O primeiro botão "+ 2" é o de quartos (precede banheiros e garagens no DOM)
    // Estado ativo indicado pela classe outline+primary — componente não expõe aria-pressed
    await expect(page.getByRole('button', { name: '+ 2' }).first()).toHaveClass(/style_outline/)
  })

  // ── 4. Filtro de banheiros e garagens ────────────────────────────────────
  test('CT08 - deve aplicar filtros de banheiros e garagens via URL', async ({ page }) => {
    await page.goto(`${D.urls.listings}?filtro=ban:2,gar:1`)
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
    await page.goto(`${D.urls.listings}?filtro=pmin:300000,pmax:800000`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page).toHaveURL(/pmin:300000,pmax:800000/)
  })

  test('CT11 - deve reidratar inputs de preço ao abrir URL com pmin/pmax', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Filter modal on iOS does not pre-populate price inputs from URL params')
    await page.goto(`${D.urls.listings}?filtro=pmin:300000,pmax:800000`)
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
    await page.goto(`${D.urls.listings}?filtro=amin:80,amax:150`)
    await openFilterPanel(page)
    // Inputs exibem valor formatado (ex: "80 m²") — IDs usados pois não há label acessível
    await expect(page.locator('#amin-input')).toHaveValue(/80/)
    await expect(page.locator('#amax-input')).toHaveValue(/150/)
  })

  // ── 7. Filtro de características (features) ──────────────────────────────
  test('CT14 - deve aplicar filtro de feature (Piscina) via URL', async ({ page }) => {
    await page.goto(`${D.urls.listings}?filtro=are:[${D.featureIds.piscina}]`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page).toHaveURL(/are:\[5\]/)
  })

  test('CT15 - deve marcar feature no painel ao abrir URL com are: aplicado', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Feature accordion is collapsed by default in mobile modal — desktop sidebar always shows features expanded')
    await page.goto(`${D.urls.listings}?filtro=are:[${D.featureIds.piscina}]`)
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
    await page.goto(`${D.urls.listings}?pg=2`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page).toHaveURL(/pg=2/)
  })

  test('CT20 - deve exibir link para próxima página', async ({ page }) => {
    const nextPageLink = page.locator('a[href*="?pg=2"]')
    await expect(nextPageLink).toBeVisible()
  })

  // ── 10. Tipo de vendedor ─────────────────────────────────────────────────
  test('CT21 - deve exibir imóveis direto com proprietário', async ({ page }) => {
    await page.goto(`${D.urls.directOwner}?filtro=tve:[0]`)
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
    await page.goto(D.urls.zeroResults)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('0 Imóveis')
  })

  test('CT24 - deve exibir listagens sugeridas mesmo com 0 resultados', async ({ page }) => {
    await page.goto(D.urls.zeroResults)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('0 Imóveis')
    // A página ainda exibe listagens sugeridas (comportamento de fallback)
    await expect(page.locator('a[href*="/imovel/"]').first()).toBeVisible()
  })

  test('CT25 - deve exibir botão Limpar quando há filtros aplicados', async ({ page }) => {
    await page.goto(`${D.urls.listings}?filtro=ban:2`)
    const clearBtn = page.getByRole('button', { name: 'Limpar' }).first()
    await expect(clearBtn).toBeVisible()
  })

  // ── 13. API endpoints ────────────────────────────────────────────────────
  test('CT26 - navigationFilters API deve retornar lista de tipos com contagens', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes(D.api.navigationFilters) && res.status() === 200),
      page.goto(D.urls.listings),
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
    await page.goto(url)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page).toHaveURL(/imoveis-para-alugar/)
    await expect(page).toHaveURL(/2-quartos/)
    await expect(page).toHaveURL(/ban:2,gar:1,pmin:2000,pmax:5000,or:6/)
  })

  // ── 15. Limpar filtros ───────────────────────────────────────────────────
  test('CT29 - deve limpar filtros ao clicar em Limpar', async ({ page }) => {
    await page.goto(`${D.urls.listings}?filtro=ban:2,gar:1`)
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
    await page.goto(`${D.urls.listings}4-quartos/`)
    await expect(h1).toContainText(/4 quartos/i)
    const filteredText = await h1.textContent() || ''
    expect(filteredText).not.toBe(initialText)
  })
})
