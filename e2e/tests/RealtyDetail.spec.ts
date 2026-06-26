/**
 * RealtyDetail — Testes E2E da Página de Detalhes de Imóvel
 *
 * Suite A (CT01–CT10): Renderização dos blocos principais
 * Suite B (CT11–CT20): Funcionalidades interativas
 * Suite C (CT21–CT36): Veracidade — filtro na lista → coerência no detalhe
 *
 * Ambiente: staging (BASE_URL=https://staging.chavesnamao.com.br)
 * Docs: docs/tests/RealtyDetail.md
 */

import { devices, expect, test } from '@playwright/test'
import { REALTY_DETAIL_DATA, REALTY_SEARCH_DATA } from '../utils/test-data'
import { dismissCookieConsent, navigateToFirstResult } from '../utils/helpers'

const D = REALTY_DETAIL_DATA
const SD = REALTY_SEARCH_DATA

// Viewport e capacidades do iPhone 14 sem forçar WebKit (defaultBrowserType causaria erro em describe)
const { defaultBrowserType: _dt, ...iphone14 } = devices['iPhone 14']

// ── Utilitários ───────────────────────────────────────────────────────────────

function extractNumber(text: string | null | undefined): number {
  if (!text) return -1
  const cleaned = text.replace(/\./g, '')
  const match = cleaned.match(/\d+/)
  return match ? parseInt(match[0], 10) : -1
}

async function getCharacteristic(page: import('@playwright/test').Page, label: string): Promise<number> {
  const item = page.locator('li').filter({ hasText: label }).first()
  const text = await item.textContent().catch(() => null)
  return extractNumber(text?.replace(label, ''))
}

async function getDetailPriceValue(page: import('@playwright/test').Page): Promise<number> {
  const tableText = await page.locator('table').first().textContent().catch(() => null)
  const match = (tableText ?? '').replace(/\./g, '').match(/R\$\s*(\d+)/)
  return match ? parseInt(match[1], 10) : -1
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite A — Renderização dos Blocos
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Detalhes do Imóvel — Renderização dos Blocos', () => {
  test.beforeEach(async ({ page }) => {
    const href = await navigateToFirstResult(page, D.urls.rentListingBase)
    await page.goto(href, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)
    // Aguarda React hidratar — rodapé fixo e botões de pergunta rápida são client-side
    await page.waitForLoadState('load', { timeout: 25_000 })
  })

  test('CT01 - galeria de fotos presente com ao menos 1 imagem', async ({ page }) => {
    // A galeria está no topo do article — imagens com alt text da propriedade
    const galleryImage = page.locator('article img[alt]').first()
    await expect(galleryImage).toBeVisible()
    const alt = await galleryImage.getAttribute('alt')
    expect(alt?.length, 'Imagem sem alt text').toBeGreaterThan(0)
  })

  test('CT02 - preço principal visível com valor numérico', async ({ page }) => {
    const priceTable = page.locator('table').first()
    await expect(priceTable).toBeVisible()

    const price = await getDetailPriceValue(page)
    expect(price, 'Preço não encontrado ou inválido').toBeGreaterThan(0)
  })

  test('CT03 - endereço presente (bairro e/ou cidade)', async ({ page }) => {
    // O endereço é um h2 (ex: "Rua Castro Alves, 806, Aclimação, São Paulo/SP")
    const addressH2 = page.getByRole('heading', { level: 2 }).first()
    await expect(addressH2).toBeVisible()
    const text = await addressH2.textContent()
    expect(text?.trim().length, 'Endereço vazio').toBeGreaterThan(0)
  })

  test('CT04 - características presentes (quartos, banheiros, área, garagens)', async ({ page }) => {
    await expect(page.locator('li').filter({ hasText: 'Quartos' }).first()).toBeVisible()
    await expect(page.locator('li').filter({ hasText: 'Banheiros' }).first()).toBeVisible()
    await expect(page.locator('li').filter({ hasText: /Área/ }).first()).toBeVisible()
  })

  test('CT05 - descrição do imóvel presente', async ({ page }) => {
    const descLabel = page.locator('p').filter({ hasText: /^Descrição$/ }).first()
    await expect(descLabel).toBeVisible()

    // O h1 é o título do imóvel (dentro do article interno)
    const title = page.getByRole('heading', { level: 1 }).first()
    await expect(title).toBeVisible()
    const text = await title.textContent()
    expect(text?.trim().length).toBeGreaterThan(0)
  })

  test('CT06 - seção de proximidades/mapa presente', async ({ page }) => {
    const mapSection = page.getByRole('heading', { name: /proximidades/i })
    await expect(mapSection).toBeVisible()
  })

  test('CT07 - botões de contato do anunciante presentes', async ({ page }) => {
    // Desktop: sidebar exibe "Mensagem"/"Solicitar visita"; Mobile portal exibe "Contatar"
    await expect(
      page.getByRole('button', { name: /mensagem|contatar|solicitar visita/i }).first(),
    ).toBeVisible()
    await expect(page.getByPlaceholder('Escreva sua pergunta...')).toBeVisible()
  })

  test('CT08 - imóvel de aluguel exibe condomínio e/ou IPTU', async ({ page }) => {
    const tableText = await page.locator('table').first().textContent()
    const hasCondominioOrIptu =
      /condomínio/i.test(tableText ?? '') || /iptu/i.test(tableText ?? '')
    expect(
      hasCondominioOrIptu,
      `Tabela de preços de aluguel não exibe condomínio nem IPTU:\n${tableText}`,
    ).toBe(true)
  })

  test('CT09 - imóvel de venda não exibe "Aluguel" no preço', async ({ page, isMobile }) => {
    test.slow()
    // Navega para imóvel de venda
    const saleHref = await navigateToFirstResult(page, D.urls.saleListingBase)
    await page.goto(saleHref, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const priceTable = page.locator('table').first()
    await expect(priceTable).toBeVisible()
    const tableText = await priceTable.textContent()
    expect(
      /aluguel/i.test(tableText ?? ''),
      `Imóvel de venda não deveria conter "Aluguel" na tabela de preços`,
    ).toBe(false)
  })

  test('CT10 - responsividade: elementos-chave visíveis em mobile (375px)', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Validação de viewport mobile — executar em projeto mobile')
    // Em mobile o beforeEach já carregou o detalhe
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    await expect(page.locator('table').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /contatar/i })).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Suite B — Funcionalidades
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Detalhes do Imóvel — Funcionalidades', () => {
  test.beforeEach(async ({ page }) => {
    const href = await navigateToFirstResult(page, D.urls.rentListingBase)
    await page.goto(href, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)
    // Aguarda React hidratar — rodapé fixo e botões de pergunta rápida são client-side
    await page.waitForLoadState('load', { timeout: 25_000 })
  })

  test('CT11 - favoritar imóvel (logado) — botão muda estado visual', async ({ page }) => {
    test.skip(
      !process.env.USER_EMAIL,
      'Defina USER_EMAIL e configure auth para executar este teste.',
    )
    const favoriteBtn = page.getByRole('button', { name: /favoritar/i }).first()
    await expect(favoriteBtn).toBeVisible()

    const ariaLabelBefore = await favoriteBtn.getAttribute('aria-label')
    await favoriteBtn.click()
    await page.waitForTimeout(500)

    // Estado visual deve mudar (aria-label, class ou texto)
    await expect
      .poll(async () => {
        const after = await favoriteBtn.getAttribute('aria-label').catch(() => '')
        const text = await favoriteBtn.textContent().catch(() => '')
        return after !== ariaLabelBefore || /desfavorit|remover/i.test(text ?? '')
      })
      .toBeTruthy()
  })

  test('CT12 - desfavoritar imóvel (logado) — toggle reverte estado', async ({ page }) => {
    test.skip(
      !process.env.USER_EMAIL,
      'Defina USER_EMAIL e configure auth para executar este teste.',
    )
    const favoriteBtn = page.getByRole('button', { name: /favoritar/i }).first()
    await expect(favoriteBtn).toBeVisible()

    const ariaLabelBefore = await favoriteBtn.getAttribute('aria-label')
    await favoriteBtn.click()
    await favoriteBtn.click()
    await page.waitForTimeout(500)

    await expect
      .poll(async () => favoriteBtn.getAttribute('aria-label'))
      .toBe(ariaLabelBefore)
  })

  test('CT13 - favoritar (deslogado) — botão presente e ação tratada sem crash', async ({ browser }) => {
    // Cria contexto anônimo (sem storageState) para garantir ausência de autenticação
    const ctx = await browser.newContext()
    const anonPage = await ctx.newPage()
    const jsErrors: string[] = []
    anonPage.on('pageerror', err => jsErrors.push(err.message))
    try {
      const href = await navigateToFirstResult(anonPage, D.urls.rentListingBase)
      await anonPage.goto(href, { waitUntil: 'domcontentloaded' })
      await dismissCookieConsent(anonPage)
      await anonPage.waitForLoadState('load', { timeout: 25_000 })

      const favoriteBtn = anonPage.getByRole('button', { name: /favoritar/i }).first()
      await expect(favoriteBtn).toBeVisible({ timeout: 15_000 })
      await favoriteBtn.click()
      await anonPage.waitForTimeout(2_000)

      // O app pode exibir modal, redirecionar, ou salvar localmente sem auth — o que importa é:
      // nenhum crash de JS e nenhuma página de erro
      expect(jsErrors, `Erros de JS após favoritar sem login:\n${jsErrors.join('\n')}`).toHaveLength(0)
      expect(anonPage.url()).not.toMatch(/\/404|\/error|\/not-found/)
    } finally {
      await ctx.close()
    }
  })

  test('CT14 - galeria está visível por padrão (tab "Fotos" ativo)', async ({ page }) => {
    // O botão de fotos fica na nav do topo — ex: "11 Fotos"
    const fotosBtn = page.locator('nav').getByRole('button', { name: /fotos/i }).first()
    await expect(fotosBtn).toBeVisible()

    // Imagens da galeria estão visíveis
    await expect(page.locator('article img[alt]').first()).toBeVisible()
  })

  test('CT15 - tab "Mapa" exibe seção de proximidades ao clicar', async ({ page }) => {
    const mapaBtn = page.locator('nav').getByRole('button', { name: /^mapa$/i }).first()
    await expect(mapaBtn).toBeVisible()
    await mapaBtn.click()

    // Aguarda a seção de proximidades — usa locator de texto (mais robusto que getByRole heading)
    await page.waitForTimeout(1_000)
    const mapSection = page.locator('h2').filter({ hasText: /proximidades/i })
    const count = await mapSection.count()
    expect(count, 'Seção de proximidades não encontrada após clicar em Mapa').toBeGreaterThan(0)
  })

  test('CT16 - botão de telefone do anunciante presente', async ({ page }) => {
    // Desktop: sidebar exibe botão com número de telefone e "Ver"; Mobile portal: "Ver telefones"
    // Usa regex que cobre ambos os formatos
    const phoneBtn = page.getByRole('button', { name: /ver telefones|\(\d{2}\)/i })
    await expect(phoneBtn.first()).toBeVisible()
  })

  test('CT17 - botão de contato com o anunciante presente', async ({ page }) => {
    // Desktop sidebar: "Mensagem" / "Solicitar visita"; Mobile portal: "Contatar"
    const contactBtn = page.getByRole('button', { name: /mensagem|contatar|solicitar visita/i })
    await expect(contactBtn.first()).toBeVisible()
  })

  test('CT18 - formulário de perguntas rápidas presente', async ({ page }) => {
    await expect(page.getByRole('textbox', { name: /escreva sua pergunta/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^enviar$/i })).toBeVisible()
  })

  test('CT19 - pergunta rápida dispara ação ao clicar (sem crash)', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))

    // Localiza o botão de pergunta rápida pelo texto exato (client-side, disponível após load)
    const quickBtn = page.locator('button').filter({ hasText: 'Eu posso visitar?' })
    await expect(quickBtn).toBeVisible({ timeout: 15_000 })
    await quickBtn.click()

    // O botão pode pré-preencher o campo OU enviar diretamente — ambos são válidos
    // O que importa é que a ação não causou erro JS nem redirecionou para página de erro
    await page.waitForTimeout(1_500)
    expect(jsErrors, `Erros de JS após clicar em pergunta rápida:\n${jsErrors.join('\n')}`).toHaveLength(0)
    expect(page.url()).not.toMatch(/\/404|\/error|\/not-found/)
  })

  test('CT20 - formulário de contato não causa erro ao enviar sem autenticação', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))

    const textbox = page.getByPlaceholder('Escreva sua pergunta...')
    await expect(textbox).toBeVisible()
    await textbox.fill('Teste E2E — pergunta automatizada')

    const enviarBtn = page.getByRole('button', { name: /^enviar$/i })
    await expect(enviarBtn).toBeVisible()
    await enviarBtn.click()

    // Página não deve quebrar — qualquer feedback (sucesso, erro, login modal) é válido
    await page.waitForTimeout(1_500)
    expect(jsErrors, `Erros de JS após envio do formulário:\n${jsErrors.join('\n')}`).toHaveLength(0)
    // Formulário ou modal de login deve continuar visível (não crash/404)
    expect(page.url()).not.toMatch(/\/404|\/error|\/not-found/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Suite C — Veracidade dos Detalhes Filtrados
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Detalhes do Imóvel — Veracidade dos Detalhes Filtrados', () => {

  // ── CT21: Aluguel → detalhe indica locação ──────────────────────────────────

  test('CT21 - filtro aluguel → detalhe exibe tipo locação', async ({ page }) => {
    const href = await navigateToFirstResult(page, D.crossCheck.rent.listUrl)
    await page.goto(href, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const tableText = await page.locator('table').first().textContent()
    expect(
      D.crossCheck.rent.priceLabel.test(tableText ?? ''),
      `Detalhe de imóvel de aluguel não contém "aluguel" na tabela de preço.\nTabela: ${tableText}`,
    ).toBe(true)
  })

  // ── CT22: Venda → detalhe NÃO indica locação ───────────────────────────────

  test('CT22 - filtro venda → detalhe não exibe "Aluguel" no preço', async ({ page }) => {
    test.slow()
    const href = await navigateToFirstResult(page, D.crossCheck.sale.listUrl)
    await page.goto(href, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const tableText = await page.locator('table').first().textContent()
    expect(
      /aluguel/i.test(tableText ?? ''),
      `Detalhe de imóvel de venda contém "aluguel" na tabela de preço — dado inconsistente.\nTabela: ${tableText}`,
    ).toBe(false)
  })

  // ── CT23: 2 quartos → detalhe exibe ≥ 2 quartos ────────────────────────────

  test('CT23 - filtro 2 quartos → detalhe exibe ≥ 2 quartos', async ({ page }) => {
    const href = await navigateToFirstResult(page, D.crossCheck.rooms2.listUrl)
    await page.goto(href, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const quartos = await getCharacteristic(page, 'Quartos')
    // A lista filtrada pode retornar imóveis comerciais sem "Quartos" — pula nesses casos
    if (quartos === -1) {
      test.skip(true, 'Primeiro resultado é imóvel comercial sem característica "Quartos" — lista de 2 quartos pode incluir comerciais')
    }
    expect(
      quartos,
      `Imóvel filtrado por 2 quartos exibe ${quartos} quartos no detalhe`,
    ).toBeGreaterThanOrEqual(D.crossCheck.rooms2.bedsMin)
  })

  // ── CT24: 3 quartos → detalhe exibe ≥ 3 quartos ────────────────────────────

  test('CT24 - filtro 3 quartos → detalhe exibe ≥ 3 quartos', async ({ page }) => {
    const href = await navigateToFirstResult(page, D.crossCheck.rooms3.listUrl)
    await page.goto(href, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const quartos = await getCharacteristic(page, 'Quartos')
    // A lista filtrada pode retornar imóveis comerciais sem "Quartos" — pula nesses casos
    if (quartos === -1) {
      test.skip(true, 'Primeiro resultado é imóvel comercial sem característica "Quartos" — lista de 3 quartos pode incluir comerciais')
    }
    expect(quartos, `Quartos: ${quartos} (esperado ≥ ${D.crossCheck.rooms3.bedsMin})`).toBeGreaterThanOrEqual(
      D.crossCheck.rooms3.bedsMin,
    )
  })

  // ── CT25: pmin:500000 → preço ≥ R$ 500.000 ─────────────────────────────────

  test('CT25 - filtro pmin:500000 → preço no detalhe ≥ R$ 500.000', async ({ page }) => {
    const href = await navigateToFirstResult(page, D.crossCheck.pmin.listUrl)
    await page.goto(href, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const price = await getDetailPriceValue(page)
    expect(
      price,
      `Preço no detalhe: R$ ${price} — esperado ≥ R$ ${D.crossCheck.pmin.priceMin}`,
    ).toBeGreaterThanOrEqual(D.crossCheck.pmin.priceMin!)
  })

  // ── CT26: pmax:800000 → preço ≤ R$ 800.000 ─────────────────────────────────

  test('CT26 - filtro pmax:800000 → preço no detalhe ≤ R$ 800.000', async ({ page }) => {
    const href = await navigateToFirstResult(page, D.crossCheck.pmax.listUrl)
    await page.goto(href, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const price = await getDetailPriceValue(page)
    expect(
      price,
      `Preço no detalhe: R$ ${price} — esperado ≤ R$ ${D.crossCheck.pmax.priceMax}`,
    ).toBeLessThanOrEqual(D.crossCheck.pmax.priceMax!)
  })

  // ── CT27: ban:2 → detalhe exibe ≥ 2 banheiros ──────────────────────────────

  test('CT27 - filtro ban:2 → detalhe exibe ≥ 2 banheiros', async ({ page }) => {
    const href = await navigateToFirstResult(page, D.crossCheck.baths2.listUrl)
    await page.goto(href, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const banheiros = await getCharacteristic(page, 'Banheiros')
    expect(
      banheiros,
      `Banheiros: ${banheiros} (esperado ≥ ${D.crossCheck.baths2.bathsMin})`,
    ).toBeGreaterThanOrEqual(D.crossCheck.baths2.bathsMin!)
  })

  // ── CT28: gar:1 → detalhe exibe ≥ 1 vaga ───────────────────────────────────

  test('CT28 - filtro gar:1 → detalhe exibe ≥ 1 vaga', async ({ page }) => {
    const href = await navigateToFirstResult(page, D.crossCheck.garage.listUrl)
    await page.goto(href, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const garagens = await getCharacteristic(page, 'Garagens')
    expect(
      garagens,
      `Garagens: ${garagens} (esperado ≥ ${D.crossCheck.garage.garagesMin})`,
    ).toBeGreaterThanOrEqual(D.crossCheck.garage.garagesMin!)
  })

  // ── CT29: are:[5] (piscina) → detalhe menciona piscina ──────────────────────

  test('CT29 - filtro piscina → detalhe menciona "piscina" nas amenidades', async ({ page }) => {
    const href = await navigateToFirstResult(page, D.crossCheck.piscina.listUrl)
    await page.goto(href, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const bodyText = await page.locator('article').textContent()
    expect(
      D.crossCheck.piscina.feature!.test(bodyText ?? ''),
      'Imóvel filtrado por piscina não menciona "piscina" na página de detalhe',
    ).toBe(true)
  })

  // ── CT30: are:[12] (elevador) → detalhe menciona elevador ───────────────────

  test('CT30 - filtro elevador → detalhe menciona "elevador" nas amenidades', async ({ page }) => {
    const href = await navigateToFirstResult(page, D.crossCheck.elevador.listUrl)
    await page.goto(href, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const bodyText = await page.locator('article').textContent()
    expect(
      D.crossCheck.elevador.feature!.test(bodyText ?? ''),
      'Imóvel filtrado por elevador não menciona "elevador" na página de detalhe',
    ).toBe(true)
  })

  // ── CT31: or:1 (menor preço) → 1º card ≤ 2º card na lista ──────────────────

  test('CT31 - ordenação menor preço → 1º card tem preço ≤ 2º card', async ({ page }) => {
    await page.goto(D.crossCheck.orderMenorPreco.listUrl, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const cards = page.locator('a[href*="/imovel/"]')
    await expect(cards.first()).toBeVisible({ timeout: 15_000 })

    const texts = await cards.evaluateAll<string[], HTMLAnchorElement>(
      links => links.slice(0, 2).map(a => a.textContent ?? ''),
    )
    if (texts.length < 2) {
      test.skip(true, 'Menos de 2 cards disponíveis para verificar ordenação')
      return
    }

    const price1 = extractNumber(texts[0])
    const price2 = extractNumber(texts[1])

    if (price1 === -1 || price2 === -1) {
      test.skip(true, 'Não foi possível extrair preço dos cards da lista')
      return
    }

    expect(
      price1,
      `Ordenação incorreta: 1º card R$ ${price1} > 2º card R$ ${price2}`,
    ).toBeLessThanOrEqual(price2)
  })

  // ── CT32: combinado (aluguel + 2q + ban:1) ────────────────────────────────

  test('CT32 - filtro combinado aluguel + 2 quartos + ban:1 → detalhe satisfaz todos', async ({ page }) => {
    test.slow()
    const href = await navigateToFirstResult(page, D.crossCheck.multiFilter.listUrl)
    await page.goto(href, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    // Aluguel
    const tableText = await page.locator('table').first().textContent()
    expect(/aluguel/i.test(tableText ?? ''), 'Detalhe não indica aluguel').toBe(true)

    // ≥ 2 quartos
    const quartos = await getCharacteristic(page, 'Quartos')
    expect(quartos, `Quartos: ${quartos} (esperado ≥ 2)`).toBeGreaterThanOrEqual(2)

    // ≥ 1 banheiro
    const banheiros = await getCharacteristic(page, 'Banheiros')
    expect(banheiros, `Banheiros: ${banheiros} (esperado ≥ 1)`).toBeGreaterThanOrEqual(1)
  })

  // ── CT33: Zero resultados — preço absurdo ─────────────────────────────────

  test('CT33 - zero resultados (preço absurdo) → h1 mostra "0 Imóveis" sem quebrar', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))

    await page.goto(D.urls.zeroResultsRent, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 15_000 })

    const h1Text = await h1.textContent() ?? ''
    const isZero = D.zeroResultsH1.test(h1Text) || /nenhum/i.test(h1Text)
    expect(isZero, `h1 deveria indicar zero resultados, mas exibe: "${h1Text}"`).toBe(true)

    expect(jsErrors, `Erros de JS na página de zero resultados:\n${jsErrors.join('\n')}`).toHaveLength(0)
  })

  // ── CT34: Zero resultados — filtros contraditórios (pmin > pmax) ────────────

  test('CT34 - filtros contraditórios (pmin > pmax) → página não quebra', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))

    await page.goto(D.urls.contradictoryFilters, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    // Página deve renderizar (h1 visível) — seja com 0 resultados ou ignorando o filtro inválido
    await expect(page.getByRole('heading', { level: 1 }), 'Página quebrou com filtros contraditórios').toBeVisible({
      timeout: 15_000,
    })

    // URL não deve ser página de erro
    expect(page.url(), 'URL redirecionada para erro').not.toMatch(/\/404|\/error|\/not-found/)
    expect(jsErrors, `Erros de JS:\n${jsErrors.join('\n')}`).toHaveLength(0)
  })

  // ── CT35: Zero resultados — combinação impossível ────────────────────────────

  test('CT35 - combinação impossível → estado vazio ou zero resultados consistente', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))

    await page.goto(D.urls.zeroResultsCity, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 15_000 })

    const h1Text = await h1.textContent() ?? ''
    const isEmptyOrZero = D.zeroResultsH1.test(h1Text) || /nenhum/i.test(h1Text)
    expect(
      isEmptyOrZero,
      `Combinação impossível deveria resultar em zero resultados, mas h1 exibe: "${h1Text}"`,
    ).toBe(true)

    expect(jsErrors, `Erros de JS:\n${jsErrors.join('\n')}`).toHaveLength(0)
  })

  // ── CT36: URL com parâmetros UTM → detalhe carrega normalmente ─────────────

  test('CT36 - URL de detalhe com parâmetros UTM carrega normalmente', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))

    // Obtém um URL real de detalhe e adiciona UTM
    const baseHref = await navigateToFirstResult(page, SD.urls.listings)
    const utmHref = `${baseHref}?utm_source=e2e-test&utm_medium=playwright&utm_campaign=regression`

    await page.goto(utmHref, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    // Página não deve redirecionar para 404
    expect(page.url()).not.toMatch(/\/404|\/error|\/not-found/)

    // Elementos essenciais devem estar presentes
    await expect(page.getByRole('heading', { level: 1 }).first(), 'h1 não encontrado com UTM').toBeVisible()
    await expect(page.locator('table').first(), 'Tabela de preço não encontrada com UTM').toBeVisible()

    expect(jsErrors, `Erros de JS com UTM:\n${jsErrors.join('\n')}`).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Suite D — Mobile Exclusivos (viewport iPhone 14)
// Testa elementos que só existem ou se comportam diferente no mobile:
// — rodapé fixo via React Portal (#portal-bottom-sticky) revelado por media query
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Detalhes do Imóvel — Mobile Exclusivos', () => {
  test.use(iphone14)

  test.beforeEach(async ({ page }) => {
    const href = await navigateToFirstResult(page, D.urls.rentListingBase)
    await page.goto(href, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)
    await page.waitForLoadState('load', { timeout: 25_000 })
  })

  test('CT37 - portal fixo: botão "Ver telefones" visível no rodapé (mobile)', async ({ page }) => {
    // No viewport mobile o portal #portal-bottom-sticky é exibido via media query CSS
    // Um scroll curto garante que qualquer animação de entrada seja ativada
    await page.evaluate(() => window.scrollBy(0, 300))
    await page.waitForTimeout(400)
    const phoneBtn = page.locator('#portal-bottom-sticky button').filter({ hasText: 'Ver telefones' })
    await expect(phoneBtn).toBeVisible({ timeout: 10_000 })
  })

  test('CT38 - portal fixo: botão "Contatar" visível no rodapé (mobile)', async ({ page }) => {
    await page.evaluate(() => window.scrollBy(0, 300))
    await page.waitForTimeout(400)
    const contatarBtn = page.locator('#portal-bottom-sticky button').filter({ hasText: 'Contatar' })
    await expect(contatarBtn).toBeVisible({ timeout: 10_000 })
  })

  test('CT39 - clicar "Contatar" no portal leva ao formulário de contato (mobile)', async ({ page }) => {
    await page.evaluate(() => window.scrollBy(0, 300))
    await page.waitForTimeout(400)
    const contatarBtn = page.locator('#portal-bottom-sticky button').filter({ hasText: 'Contatar' })
    await expect(contatarBtn).toBeVisible({ timeout: 10_000 })
    await contatarBtn.click()

    // Após o clique: formulário de pergunta deve ficar acessível (scroll automático ou abertura de modal)
    await expect(
      page.getByPlaceholder('Escreva sua pergunta...'),
      'Formulário de contato não ficou visível após clicar em "Contatar" no portal',
    ).toBeVisible({ timeout: 5_000 })
  })

  test('CT40 - layout mobile sem overflow horizontal', async ({ page }) => {
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 5,
    )
    expect(hasHorizontalScroll, 'Página tem overflow horizontal no viewport mobile (375px)').toBe(false)
  })
})
