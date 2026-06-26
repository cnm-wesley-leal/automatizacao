/**
 * RealtyDetailFuzz — Fuzz Filter → Detail
 *
 * Gera N cenários com filtros aleatórios, navega pela lista filtrada e valida
 * que a página de detalhe do primeiro resultado é íntegra e coerente com o filtro.
 *
 * Em 10% das iterações, usa URLs de zero resultado para validar ativamente
 * o estado vazio (h1 "0 Imóveis", sem erros de JS).
 *
 * Configuração:
 *   FUZZ_ITERATIONS=20   – número de cenários (default: 10)
 *   FUZZ_SEED=42         – semente PRNG para reprodução exata (default: 42)
 *
 * Exemplos:
 *   FUZZ_ITERATIONS=30 yarn playwright test --config playwright.fuzz.config.ts RealtyDetailFuzz
 *   FUZZ_SEED=99 FUZZ_ITERATIONS=20 yarn playwright test --config playwright.fuzz.config.ts RealtyDetailFuzz
 */

import { expect, test } from '@playwright/test'
import { REALTY_DETAIL_DATA, REALTY_SEARCH_DATA } from '../utils/test-data'
import { dismissCookieConsent } from '../utils/helpers'

const D  = REALTY_DETAIL_DATA
const SD = REALTY_SEARCH_DATA

const ITERATIONS = parseInt(process.env.FUZZ_ITERATIONS ?? '10', 10)
const SEED       = parseInt(process.env.FUZZ_SEED       ?? '42',  10)

// ── PRNG com seed (xorshift32) ────────────────────────────────────────────────

let _seed = ((SEED * 1_997 + 7) | 0) || 1

function rand(): number {
  _seed ^= _seed << 13
  _seed ^= _seed >> 17
  _seed ^= _seed << 5
  return Math.abs(_seed) / 2_147_483_648
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

function maybe<T>(arr: T[], probability: number): T | null {
  return rand() < probability ? pick(arr) : null
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ── Pools de valores ──────────────────────────────────────────────────────────

const BASE_URLS = [
  { url: SD.urls.listings,    label: 'imoveis',      supportsRooms: true  },
  { url: SD.urls.forRent,     label: 'alugar',       supportsRooms: true,  isRent: true  },
  { url: SD.urls.forSale,     label: 'venda',        supportsRooms: true,  isRent: false },
  { url: SD.urls.launches,    label: 'lancamentos',  supportsRooms: false },
  { url: SD.urls.apartments,  label: 'apartamentos', supportsRooms: true  },
]

const ROOM_PATHS = ['1-quarto/', '2-quartos/', '3-quartos/', '4-quartos/']
const BATHS      = [1, 2, 3]
const GARAGES    = [1, 2]
const SORTS      = Object.values(SD.sortCodes)
const FEATURES   = Object.values(SD.featureIds)

const PRICE_PAIRS: [number, number][] = [
  [100_000,   500_000],
  [200_000,   800_000],
  [300_000, 1_000_000],
  [500_000, 2_000_000],
]

const AREA_PAIRS: [number, number][] = [
  [30,  100],
  [50,  150],
  [80,  200],
  [100, 300],
]

// URLs que devem produzir zero resultados (usados em ~10% das iterações)
const ZERO_RESULT_URLS = [
  D.urls.zeroResultsRent,
  D.urls.zeroResultsCity,
  D.urls.contradictoryFilters,
]

// ── Tipos ────────────────────────────────────────────────────────────────────

interface DetailScenario {
  listUrl:         string
  label:           string
  isZeroResult:    boolean
  pathAssertions:  string[]
  queryAssertions: string[]
  checks: {
    rooms?:    number   // detalhe deve ter ≥ N quartos
    baths?:    number   // detalhe deve ter ≥ N banheiros
    garages?:  number   // detalhe deve ter ≥ N garagens
    priceMin?: number
    priceMax?: number
    isRent?:   boolean  // true = tabela deve conter "aluguel"
  }
}

// ── Gerador de cenário ────────────────────────────────────────────────────────

function buildScenario(): DetailScenario {
  // 10% das vezes: cenário de zero resultado intencional
  if (rand() < 0.10) {
    const url = pick(ZERO_RESULT_URLS)
    return {
      listUrl:         url,
      label:           'zero-results',
      isZeroResult:    true,
      pathAssertions:  [],
      queryAssertions: [],
      checks:          {},
    }
  }

  const base = pick(BASE_URLS)
  const labels: string[] = [base.label]
  const pathAssertions: string[] = []
  const queryParts: string[] = []
  const queryAssertions: string[] = []
  const checks: DetailScenario['checks'] = {}

  if ('isRent' in base && base.isRent !== undefined) {
    checks.isRent = base.isRent
  }

  // Quartos (path-based)
  if (base.supportsRooms && rand() < 0.35) {
    const room = pick(ROOM_PATHS)
    pathAssertions.push(room)
    labels.push(room.replace('/', ''))
    const n = parseInt(room)
    if (!isNaN(n)) checks.rooms = n
  }

  // Banheiros
  const ban = maybe(BATHS, 0.30)
  if (ban !== null) {
    queryParts.push(`ban:${ban}`)
    queryAssertions.push(`ban:${ban}`)
    labels.push(`ban${ban}`)
    checks.baths = ban
  }

  // Garagens
  const gar = maybe(GARAGES, 0.25)
  if (gar !== null) {
    queryParts.push(`gar:${gar}`)
    queryAssertions.push(`gar:${gar}`)
    labels.push(`gar${gar}`)
    checks.garages = gar
  }

  // Preço (par válido: pmin < pmax)
  if (rand() < 0.30) {
    const [pmin, pmax] = pick(PRICE_PAIRS)
    queryParts.push(`pmin:${pmin}`, `pmax:${pmax}`)
    queryAssertions.push(`pmin:${pmin}`, `pmax:${pmax}`)
    labels.push('preco')
    checks.priceMin = pmin
    checks.priceMax = pmax
  }

  // Área
  if (rand() < 0.20) {
    const [amin, amax] = pick(AREA_PAIRS)
    queryParts.push(`amin:${amin}`, `amax:${amax}`)
    queryAssertions.push(`amin:${amin}`, `amax:${amax}`)
    labels.push('area')
  }

  // Feature
  const featId = maybe(FEATURES, 0.15)
  if (featId !== null) {
    queryParts.push(`are:[${featId}]`)
    queryAssertions.push(`are:[${featId}]`)
    labels.push(`feat${featId}`)
  }

  // Ordenação
  const sort = maybe(SORTS, 0.25)
  if (sort !== null) {
    queryParts.push(sort)
    queryAssertions.push(sort)
    labels.push(sort.replace(':', ''))
  }

  const roomPath    = pathAssertions[0] ?? ''
  const filtroQuery = queryParts.length > 0 ? `?filtro=${queryParts.join(',')}` : ''
  const listUrl     = `${base.url}${roomPath}${filtroQuery}`

  return {
    listUrl,
    label: labels.join('+'),
    isZeroResult: false,
    pathAssertions,
    queryAssertions,
    checks,
  }
}

// Cenários fixos por SEED
const scenarios: DetailScenario[] = Array.from({ length: ITERATIONS }, buildScenario)

// ── Utilitários de extração ───────────────────────────────────────────────────

function extractNumber(text: string | null | undefined): number {
  if (!text) return -1
  const match = text.replace(/\./g, '').match(/\d+/)
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

// ── Suite de testes ───────────────────────────────────────────────────────────

test.describe('RealtyDetail — Fuzz Filter → Detail', () => {
  scenarios.forEach((scenario, index) => {
    const id = String(index + 1).padStart(2, '0')

    test(`DETAIL-FUZZ-${id} — ${scenario.label}`, async ({ page }) => {
      const jsErrors: string[] = []
      page.on('pageerror', err => jsErrors.push(err.message))

      console.log(`[DETAIL-FUZZ-${id}] seed=${SEED} url=${scenario.listUrl}`)

      // ── Passo 1: Navegar para a lista filtrada ────────────────────────────

      await page.goto(scenario.listUrl, { waitUntil: 'domcontentloaded' })
      await dismissCookieConsent(page)

      const h1 = page.getByRole('heading', { level: 1 })
      await expect(h1, `h1 não encontrado na lista — ${scenario.listUrl}`).toBeVisible({ timeout: 15_000 })

      // ── Passo 2: Verificar filtros preservados na URL ─────────────────────

      for (const segment of scenario.pathAssertions) {
        await expect(page, `Path "${segment}" perdido — ${scenario.listUrl}`).toHaveURL(
          new RegExp(escapeRegExp(segment)),
        )
      }
      for (const filter of scenario.queryAssertions) {
        await expect(page, `Filtro "${filter}" perdido — ${scenario.listUrl}`).toHaveURL(
          new RegExp(escapeRegExp(filter)),
        )
      }

      // ── Passo 3: Tratar estado da lista ──────────────────────────────────

      const h1Text = await h1.textContent().catch(() => '')
      const isListEmpty = /^0\s|nenhum/i.test(h1Text ?? '')
      const firstCard   = page.locator('a[href*="/imovel/"]').first()
      const hasCards    = await firstCard.isVisible({ timeout: 3_000 }).catch(() => false)

      if (scenario.isZeroResult || isListEmpty) {
        // Validação ativa do estado vazio
        const isZeroH1 = D.zeroResultsH1.test(h1Text ?? '') || /nenhum/i.test(h1Text ?? '')
        expect(
          isZeroH1 || !hasCards,
          `Estado vazio esperado, mas lista parece ter resultados — h1: "${h1Text}"`,
        ).toBe(true)
        expect(jsErrors, `Erros de JS no estado vazio:\n${jsErrors.join('\n')}`).toHaveLength(0)
        return // Cenário de zero resultado — validação concluída
      }

      // Deve haver ao menos 1 card para continuar
      expect(
        hasCards || isListEmpty,
        `Lista sem cards e sem estado vazio — ${scenario.listUrl}\nh1: "${h1Text}"`,
      ).toBe(true)

      if (!hasCards) return // Zero inesperado — não falha, apenas não valida detalhe

      // ── Passo 4: Navegar para o primeiro detalhe ──────────────────────────

      const detailHref = await firstCard.getAttribute('href') ?? ''
      expect(detailHref, `href do card vazio — ${scenario.listUrl}`).not.toHaveLength(0)

      await page.goto(detailHref, { waitUntil: 'domcontentloaded' })
      await dismissCookieConsent(page)

      // ── Passo 5: Validações básicas na página de detalhe ─────────────────

      // URL não deve ser página de erro
      expect(page.url(), 'URL de detalhe é página de erro').not.toMatch(
        /\/404|\/error|\/not-found/,
      )

      // h1 (título do imóvel) deve estar visível
      const detailH1 = page.getByRole('heading', { level: 1 }).first()
      await expect(detailH1, `h1 não encontrado no detalhe — ${detailHref}`).toBeVisible({
        timeout: 15_000,
      })

      // Tabela de preço deve estar visível
      await expect(
        page.locator('table').first(),
        `Tabela de preço não encontrada — ${detailHref}`,
      ).toBeVisible()

      // Ao menos uma característica deve estar visível
      await expect(
        page.locator('li').filter({ hasText: /quartos|área|banheiros/i }).first(),
        `Características não encontradas — ${detailHref}`,
      ).toBeVisible()

      // Sem erros de JS críticos
      expect(jsErrors, `Erros de JS no detalhe — ${detailHref}\n${jsErrors.join('\n')}`).toHaveLength(0)

      // ── Passo 6: Validação cruzada filtro × detalhe ───────────────────────

      const { checks } = scenario

      if (checks.isRent === true) {
        const tableText = await page.locator('table').first().textContent().catch(() => '')
        expect(
          /aluguel/i.test(tableText ?? ''),
          `Filtro de aluguel, mas detalhe não contém "aluguel" — ${detailHref}`,
        ).toBe(true)
      }

      if (checks.isRent === false) {
        const tableText = await page.locator('table').first().textContent().catch(() => '')
        expect(
          /aluguel/i.test(tableText ?? ''),
          `Filtro de venda, mas detalhe contém "aluguel" — ${detailHref}`,
        ).toBe(false)
      }

      if (checks.rooms !== undefined) {
        const quartos = await getCharacteristic(page, 'Quartos')
        if (quartos >= 0) {
          expect(
            quartos,
            `Filtro ${checks.rooms} quartos, detalhe exibe ${quartos} — ${detailHref}`,
          ).toBeGreaterThanOrEqual(checks.rooms)
        }
      }

      if (checks.baths !== undefined) {
        const banheiros = await getCharacteristic(page, 'Banheiros')
        if (banheiros >= 0) {
          expect(
            banheiros,
            `Filtro ban:${checks.baths}, detalhe exibe ${banheiros} — ${detailHref}`,
          ).toBeGreaterThanOrEqual(checks.baths)
        }
      }

      if (checks.garages !== undefined) {
        const garagens = await getCharacteristic(page, 'Garagens')
        if (garagens >= 0) {
          expect(
            garagens,
            `Filtro gar:${checks.garages}, detalhe exibe ${garagens} — ${detailHref}`,
          ).toBeGreaterThanOrEqual(checks.garages)
        }
      }

      if (checks.priceMin !== undefined || checks.priceMax !== undefined) {
        const price = await getDetailPriceValue(page)
        if (price > 0) {
          if (checks.priceMin !== undefined) {
            expect(
              price,
              `Filtro pmin:${checks.priceMin}, detalhe exibe R$ ${price} — ${detailHref}`,
            ).toBeGreaterThanOrEqual(checks.priceMin)
          }
          if (checks.priceMax !== undefined) {
            expect(
              price,
              `Filtro pmax:${checks.priceMax}, detalhe exibe R$ ${price} — ${detailHref}`,
            ).toBeLessThanOrEqual(checks.priceMax)
          }
        }
      }
    })
  })
})
