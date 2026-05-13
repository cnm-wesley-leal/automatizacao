/**
 * RealtySearch — Fuzz de Combinações Aleatórias
 *
 * Gera N cenários com filtros aleatórios e valida que nenhuma combinação
 * quebra a página (h1 visível, URL preserva os filtros, sem erros de JS).
 *
 * Todos os filtros são opcionais. Cada execução produz combinações distintas.
 *
 * Configuração via variáveis de ambiente:
 *   FUZZ_ITERATIONS=30  – número de cenários (default: 10)
 *   FUZZ_SEED=42        – semente do PRNG para reprodução exata (default: 42)
 *
 * Exemplos:
 *   FUZZ_ITERATIONS=30 yarn playwright test RealtySearchFuzz --project=chromium
 *   FUZZ_SEED=99 FUZZ_ITERATIONS=20 yarn playwright test RealtySearchFuzz
 */

import { expect, test } from '@playwright/test'
import { REALTY_SEARCH_DATA } from '../utils/test-data'
import { dismissCookieConsent } from '../utils/helpers'

const D = REALTY_SEARCH_DATA
const ITERATIONS = parseInt(process.env.FUZZ_ITERATIONS ?? '10', 10)
const SEED       = parseInt(process.env.FUZZ_SEED       ?? '42',  10)

// ── PRNG com seed (xorshift32) ────────────────────────────────────────────────
// Garante que os títulos dos testes sejam idênticos em todos os workers

let _seed = SEED

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

// ── Pools de valores ──────────────────────────────────────────────────────────

const BASE_URLS = [
  { url: D.urls.listings,    label: 'imoveis',      supportsRooms: true  },
  { url: D.urls.forRent,     label: 'alugar',       supportsRooms: true  },
  { url: D.urls.forSale,     label: 'venda',        supportsRooms: true  },
  { url: D.urls.launches,    label: 'lancamentos',  supportsRooms: false },
  { url: D.urls.apartments,  label: 'apartamentos', supportsRooms: true  },
  { url: D.urls.directOwner, label: 'proprietario', supportsRooms: true  },
]

const ROOM_PATHS = ['1-quarto/', '2-quartos/', '3-quartos/', '4-quartos/']
const BATHS      = [1, 2, 3, 4]
const GARAGES    = [1, 2, 3]
const SORTS      = Object.values(D.sortCodes)
const FEATURES   = Object.values(D.featureIds)

// Pares sempre válidos (min < max) para evitar filtros incoerentes
const PRICE_PAIRS: [number, number][] = [
  [100_000,   500_000],
  [200_000,   800_000],
  [300_000, 1_000_000],
  [500_000, 2_000_000],
  [800_000, 3_000_000],
  [1_000_000, 5_000_000],
]

const AREA_PAIRS: [number, number][] = [
  [30,  100],
  [50,  150],
  [80,  200],
  [100, 300],
  [150, 500],
]

// ── Utilitários ───────────────────────────────────────────────────────────────

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ── Gerador de cenário ────────────────────────────────────────────────────────

interface Scenario {
  url: string
  label: string
  /** Trechos de path esperados na URL final (ex: "2-quartos/") */
  pathAssertions: string[]
  /** Valores de filtro esperados no query string (ex: "ban:2") */
  queryAssertions: string[]
}

function buildScenario(): Scenario {
  const base = pick(BASE_URLS)
  const labels: string[] = [base.label]
  const pathAssertions: string[] = []
  const queryParts: string[] = []
  const queryAssertions: string[] = []

  // Quartos (path-based — incompatível com /lancamentos-imoveis/)
  if (base.supportsRooms && rand() < 0.35) {
    const room = pick(ROOM_PATHS)
    pathAssertions.push(room)
    labels.push(room.replace('/', ''))
  }

  // Banheiros
  const ban = maybe(BATHS, 0.35)
  if (ban !== null) {
    queryParts.push(`ban:${ban}`)
    queryAssertions.push(`ban:${ban}`)
    labels.push(`ban${ban}`)
  }

  // Garagens
  const gar = maybe(GARAGES, 0.30)
  if (gar !== null) {
    queryParts.push(`gar:${gar}`)
    queryAssertions.push(`gar:${gar}`)
    labels.push(`gar${gar}`)
  }

  // Preço (sempre par: pmin + pmax)
  if (rand() < 0.30) {
    const [pmin, pmax] = pick(PRICE_PAIRS)
    queryParts.push(`pmin:${pmin}`, `pmax:${pmax}`)
    queryAssertions.push(`pmin:${pmin}`, `pmax:${pmax}`)
    labels.push('preco')
  }

  // Área útil (sempre par: amin + amax)
  if (rand() < 0.25) {
    const [amin, amax] = pick(AREA_PAIRS)
    queryParts.push(`amin:${amin}`, `amax:${amax}`)
    queryAssertions.push(`amin:${amin}`, `amax:${amax}`)
    labels.push('area')
  }

  // Feature (Piscina, Elevador, Churrasqueira, etc.)
  const featId = maybe(FEATURES, 0.20)
  if (featId !== null) {
    queryParts.push(`are:[${featId}]`)
    queryAssertions.push(`are:[${featId}]`)
    labels.push(`feat${featId}`)
  }

  // Ordenação
  const sort = maybe(SORTS, 0.30)
  if (sort !== null) {
    queryParts.push(sort)
    queryAssertions.push(sort)
    labels.push(sort.replace(':', ''))
  }

  const roomPath    = pathAssertions[0] ?? ''
  const filtroQuery = queryParts.length > 0 ? `?filtro=${queryParts.join(',')}` : ''
  const url         = `${base.url}${roomPath}${filtroQuery}`

  return { url, label: labels.join('+'), pathAssertions, queryAssertions }
}

// Cenários gerados uma vez — fixos por FUZZ_SEED durante toda a execução
const scenarios: Scenario[] = Array.from({ length: ITERATIONS }, buildScenario)

// ── Suite de testes ───────────────────────────────────────────────────────────

test.describe('RealtySearch — Fuzz de Combinações Aleatórias', () => {
  scenarios.forEach((scenario, index) => {
    const id = String(index + 1).padStart(2, '0')

    test(`FUZZ-${id} — ${scenario.label}`, async ({ page }) => {
      const jsErrors: string[] = []
      page.on('pageerror', err => jsErrors.push(err.message))

      console.log(`[FUZZ-${id}] seed=${SEED} url=${scenario.url}`)

      await page.goto(scenario.url)
      await dismissCookieConsent(page)

      // Página deve renderizar — "0 Imóveis" é resultado válido, erro 500 não é
      await expect(
        page.getByRole('heading', { level: 1 }),
        `h1 não encontrado — ${scenario.url}`,
      ).toBeVisible({ timeout: 15_000 })

      // Filtros de path devem estar presentes na URL (ex: /2-quartos/)
      for (const segment of scenario.pathAssertions) {
        await expect(
          page,
          `Path "${segment}" perdido na URL — ${scenario.url}`,
        ).toHaveURL(new RegExp(escapeRegExp(segment)))
      }

      // Filtros de query devem persistir na URL (ex: ban:2, pmin:300000)
      for (const filter of scenario.queryAssertions) {
        await expect(
          page,
          `Filtro "${filter}" perdido na URL — ${scenario.url}`,
        ).toHaveURL(new RegExp(escapeRegExp(filter)))
      }

      // Nenhum erro de JavaScript não capturado (pageerror)
      expect(
        jsErrors,
        `Erros de JS — ${scenario.url}\n${jsErrors.join('\n')}`,
      ).toHaveLength(0)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CT54 — Fuzz de Busca por Endereço (cidade × tipo de transação)
//
// Valida que combinações aleatórias de cidade + tipo de transação não quebram
// a página (h1 visível, URL correta, sem erros de JS).
//
// Configuração:
//   FUZZ_ITERATIONS=20  – controla o número de cenários (compartilhado com a suite principal)
//   FUZZ_SEED=42        – semente do PRNG (offset determinístico para independência)
// ─────────────────────────────────────────────────────────────────────────────

// PRNG independente com offset para não corromper a seed do fuzz principal
let _addrSeed = ((SEED * 31_337 + 1) | 0) || 1

function randAddr(): number {
  _addrSeed ^= _addrSeed << 13
  _addrSeed ^= _addrSeed >> 17
  _addrSeed ^= _addrSeed << 5
  return Math.abs(_addrSeed) / 2_147_483_648
}

function pickAddr<T>(arr: T[]): T {
  return arr[Math.floor(randAddr() * arr.length)]
}

// Cidades reais do ambiente de staging (slugs validados)
const FUZZ_CITIES = [
  'sp-sao-paulo',
  'rj-rio-de-janeiro',
  'sp-campinas',
  'pr-curitiba',
  'mg-belo-horizonte',
  'ce-fortaleza',
  'ba-salvador',
  'df-brasilia',
  'go-goiania',
  'pe-recife',
  'rs-porto-alegre',
  'es-vitoria',
]

const FUZZ_TRANSACTION_PREFIXES = [
  '/imoveis/',
  '/imoveis-para-alugar/',
  '/imoveis-a-venda/',
  '/lancamentos-imoveis/',
]

interface AddressScenario {
  url:    string
  label:  string
  city:   string
  prefix: string
}

function buildAddressScenario(): AddressScenario {
  const city   = pickAddr(FUZZ_CITIES)
  const prefix = pickAddr(FUZZ_TRANSACTION_PREFIXES)
  const txLabel = prefix.replace(/\//g, '').replace(/-/g, '_') || 'imoveis'
  return {
    url:    `${prefix}${city}/`,
    label:  `${txLabel}+${city}`,
    city,
    prefix,
  }
}

// Gera cenários com a mesma quantidade da suite principal para consistência de relatório
const addressScenarios: AddressScenario[] = Array.from(
  { length: ITERATIONS },
  buildAddressScenario,
)

test.describe('RealtySearch — Fuzz de Busca por Endereço', () => {
  addressScenarios.forEach((scenario, index) => {
    const id = String(index + 1).padStart(2, '0')

    test(`CT54-FUZZ-${id} — ${scenario.label}`, async ({ page }) => {
      const jsErrors: string[] = []
      page.on('pageerror', err => jsErrors.push(err.message))

      console.log(`[CT54-FUZZ-${id}] seed=${SEED} url=${scenario.url}`)

      await page.goto(scenario.url)
      await dismissCookieConsent(page)

      // Página deve renderizar sem erro (h1 visível; "0 Imóveis" é resultado válido)
      await expect(
        page.getByRole('heading', { level: 1 }),
        `h1 não encontrado — ${scenario.url}`,
      ).toBeVisible({ timeout: 15_000 })

      // URL deve preservar o slug da cidade
      await expect(
        page,
        `Slug da cidade "${scenario.city}" perdido na URL — ${scenario.url}`,
      ).toHaveURL(new RegExp(escapeRegExp(scenario.city)))

      // URL deve preservar o tipo de transação (ex: /imoveis-para-alugar/)
      const txSegment = scenario.prefix.replace(/\//g, '')
      if (txSegment) {
        await expect(
          page,
          `Tipo de transação "${txSegment}" perdido na URL — ${scenario.url}`,
        ).toHaveURL(new RegExp(escapeRegExp(txSegment)))
      }

      // Nenhum erro de JavaScript não capturado
      expect(
        jsErrors,
        `Erros de JS — ${scenario.url}\n${jsErrors.join('\n')}`,
      ).toHaveLength(0)
    })
  })
})
