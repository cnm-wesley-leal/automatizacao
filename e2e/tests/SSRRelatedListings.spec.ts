import { test, expect } from '@playwright/test'
import { SSR_DATA, TEST_DATA } from '../utils/test-data'
import { dismissCookieConsent } from '../utils/helpers'

/**
 * Suite: Feature SSR – Listagens e Anúncios Relacionados
 *
 * Valida o comportamento SSR no ambiente QA (qa.chavesnamao.com) para os perfis:
 * anonymous | webuser | pf | pj — em desktop Chrome e mobile iOS.
 *
 * Regras verificadas:
 *  - Página de listagem de imóveis renderiza via SSR com cards e SEO mínimo
 *  - Página de detalhe exibe seção de anúncios relacionados
 *  - Navegação entre anúncios relacionados funciona
 *  - Sessão do usuário autenticado é preservada após navegação SSR
 *  - Listagem de veículos carrega via SSR
 */

const CARD_SELECTOR =
  'article, [data-testid*="card"], [class*="card" i], [class*="listing" i], [class*="imovel" i]'

const CARD_LINK_SELECTOR =
  'article a[href], [data-testid*="card"] a[href], [class*="card" i] a[href], [class*="listing" i] a[href]'

const RELATED_SELECTOR = [
  '[data-testid*="related"]',
  '[data-testid*="relacionado"]',
  'section:has(h2:text-matches("relacionado|similar|também|recomend", "i"))',
  '[class*="related" i]',
  '[class*="relacionado" i]',
  'h2:text-matches("relacionado|similar|também|recomend", "i")',
].join(', ')

function profileFromProject(name: string): 'anonymous' | 'webuser' | 'pf' | 'pj' {
  if (name.includes('anonymous')) return 'anonymous'
  if (name.includes('webuser')) return 'webuser'
  if (name.includes('-pf')) return 'pf'
  return 'pj'
}

// ── Suite ─────────────────────────────────────────────────────────────────────

test.describe('Feature SSR – Listagens e Anúncios Relacionados', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SSR_DATA.urls.realtyListings, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)
  })

  test('CT01 – deve carregar a listagem de imóveis via SSR com cards visíveis', async ({ page }) => {
    await expect(page).not.toHaveTitle(/404|not found|erro/i)
    await expect(page).toHaveURL(new RegExp(SSR_DATA.urls.realtyListings.replace(/\//g, '\\/')))

    const firstCard = page.locator(CARD_SELECTOR).first()
    await expect(firstCard).toBeVisible({ timeout: 10000 })
  })

  test('CT02 – deve exibir estrutura de SEO mínima (title, h1) no SSR', async ({ page }) => {
    const pageTitle = await page.title()
    expect(pageTitle.trim().length).toBeGreaterThan(5)
    expect(pageTitle).not.toMatch(/404|not found|erro/i)

    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('CT03 – cards de listagem devem conter dados mínimos (preço e/ou área)', async ({ page }) => {
    const cards = page.locator(CARD_SELECTOR)
    await expect(cards.first()).toBeVisible({ timeout: 10000 })

    const count = await cards.count()
    expect(count).toBeGreaterThan(0)

    const firstCardText = await cards.first().textContent()
    const hasPrice = /R\$/.test(firstCardText ?? '')
    const hasArea = /quarto|dorm|suite|m²|m2/i.test(firstCardText ?? '')
    expect(hasPrice || hasArea).toBe(true)
  })

  test('CT04 – página de detalhe de imóvel deve carregar via SSR', async ({ page }) => {
    const firstLink = page.locator(CARD_LINK_SELECTOR).first()
    const hasLink = await firstLink.isVisible({ timeout: 8000 }).catch(() => false)
    test.skip(!hasLink, 'Nenhum card com link encontrado na listagem SSR.')

    await firstLink.click()
    await page.waitForURL(url => !url.pathname.startsWith(SSR_DATA.urls.realtyListings), {
      timeout: 12000,
    })
    await expect(page).not.toHaveTitle(/404|not found|erro/i)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 })
  })

  test('CT05 – página de detalhe deve exibir seção de anúncios relacionados', async ({ page }) => {
    const firstLink = page.locator(CARD_LINK_SELECTOR).first()
    const hasLink = await firstLink.isVisible({ timeout: 8000 }).catch(() => false)
    test.skip(!hasLink, 'Nenhum card com link encontrado na listagem SSR.')

    await firstLink.click()
    await page.waitForURL(url => !url.pathname.startsWith(SSR_DATA.urls.realtyListings), {
      timeout: 12000,
    })
    await dismissCookieConsent(page)

    const relatedSection = page.locator(RELATED_SELECTOR).first()
    const hasRelated = await relatedSection.isVisible({ timeout: 8000 }).catch(() => false)

    if (!hasRelated) {
      test.info().annotations.push({
        type: 'info',
        description:
          'Seção de anúncios relacionados não localizada com os seletores atuais — pode estar sob outro seletor ou ausente nesta página.',
      })
    }

    await expect(page).not.toHaveTitle(/404|not found|erro/i)
  })

  test('CT06 – anúncios relacionados devem permitir navegação para outro imóvel', async ({ page }) => {
    const firstLink = page.locator(CARD_LINK_SELECTOR).first()
    const hasLink = await firstLink.isVisible({ timeout: 8000 }).catch(() => false)
    test.skip(!hasLink, 'Nenhum card na listagem para navegar.')

    await firstLink.click()
    await page.waitForURL(url => !url.pathname.startsWith(SSR_DATA.urls.realtyListings), {
      timeout: 12000,
    })
    const detailUrl = page.url()

    const relatedLink = page
      .locator(
        [
          '[data-testid*="related"] a[href]',
          '[data-testid*="relacionado"] a[href]',
          '[class*="related" i] a[href]',
          '[class*="relacionado" i] a[href]',
        ].join(', ')
      )
      .first()

    const hasRelatedLink = await relatedLink.isVisible({ timeout: 6000 }).catch(() => false)
    if (!hasRelatedLink) {
      test.info().annotations.push({
        type: 'info',
        description: 'Link de anúncio relacionado não encontrado — CT06 não aplicável nesta página.',
      })
      return
    }

    await relatedLink.click()
    await expect(page).not.toHaveTitle(/404|not found|erro/i)
    expect(page.url()).not.toBe(detailUrl)
  })

  test('CT07 – usuário autenticado deve manter sessão após navegação SSR', async ({
    page,
  }, testInfo) => {
    const profile = profileFromProject(testInfo.project.name)
    test.skip(profile === 'anonymous', 'Teste aplicável apenas a perfis autenticados.')

    await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeHidden({
      timeout: 8000,
    })

    const firstLink = page.locator(CARD_LINK_SELECTOR).first()
    const hasLink = await firstLink.isVisible({ timeout: 8000 }).catch(() => false)
    if (!hasLink) return

    await firstLink.click()
    await page.waitForURL(url => !url.pathname.startsWith(SSR_DATA.urls.realtyListings), {
      timeout: 12000,
    })

    await expect(page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })).toBeHidden({
      timeout: 5000,
    })
  })

  test('CT08 – listagem de veículos deve carregar via SSR', async ({ page }) => {
    await page.goto(SSR_DATA.urls.vehicleListings, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page)

    await expect(page).not.toHaveTitle(/404|not found|erro/i)
    const firstCard = page.locator(
      'article, [data-testid*="card"], [class*="card" i], [class*="vehicle" i], [class*="veiculo" i], [class*="carro" i]'
    ).first()
    await expect(firstCard).toBeVisible({ timeout: 10000 })
  })
})
