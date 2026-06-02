/**
 * VehicleSearch — Fuzz de Combinações Aleatórias
 *
 * Gera N cenários com rotas e filtros aleatórios da vertical de automóveis e
 * valida que nenhuma combinação quebra a página (h1 visível, URL preserva os
 * filtros, sem erros de JS).
 *
 * Configuração via variáveis de ambiente:
 *   FUZZ_ITERATIONS=30  – número de cenários (default: 10)
 *   FUZZ_SEED=42        – semente do PRNG para reprodução exata (default: 42)
 */

import { expect, test } from '@playwright/test'
import { VEHICLE_SEARCH_DATA } from '../utils/test-data'
import { dismissCookieConsent } from '../utils/helpers'

const D = VEHICLE_SEARCH_DATA
const ITERATIONS = parseInt(process.env.FUZZ_ITERATIONS ?? '10', 10)
const SEED = parseInt(process.env.FUZZ_SEED ?? '42', 10)

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

interface BaseRoute {
  url: string
  label: string
  pathAssertions: string[]
  fixedQueryAssertions?: string[]
}

const BASE_ROUTES: BaseRoute[] = [
  {
    url: D.urls.listings,
    label: 'carros',
    pathAssertions: ['carros-usados/'],
  },
  {
    url: `${D.urls.newListings}?filtro=ze:1`,
    label: 'novos',
    pathAssertions: ['carros-novos/'],
    fixedQueryAssertions: ['ze:1'],
  },
  {
    url: `${D.urls.sedan}?filtro=car:[${D.bodyTypeIds.sedan}]`,
    label: 'sedan',
    pathAssertions: ['carros-sedas/'],
    fixedQueryAssertions: [`car:[${D.bodyTypeIds.sedan}]`],
  },
  {
    url: `${D.urls.hatchback}?filtro=car:[${D.bodyTypeIds.hatchback}]`,
    label: 'hatchback',
    pathAssertions: ['carros-hatchback/'],
    fixedQueryAssertions: [`car:[${D.bodyTypeIds.hatchback}]`],
  },
  {
    url: `${D.urls.suv}?filtro=car:[${D.bodyTypeIds.suv}]`,
    label: 'suv',
    pathAssertions: ['carros-suv-crossover/'],
    fixedQueryAssertions: [`car:[${D.bodyTypeIds.suv}]`],
  },
  {
    url: `${D.urls.pickup}?filtro=car:[${D.bodyTypeIds.pickup}]`,
    label: 'pickup',
    pathAssertions: ['carros-picapes/'],
    fixedQueryAssertions: [`car:[${D.bodyTypeIds.pickup}]`],
  },
  {
    url: `${D.urls.oldCars}?filtro=ne:[${D.necessityIds.oldCars}]`,
    label: 'antigos',
    pathAssertions: ['carros-antigos/'],
    fixedQueryAssertions: [`ne:[${D.necessityIds.oldCars}]`],
  },
  {
    url: `${D.urls.sevenSeats}?filtro=ne:[${D.necessityIds.sevenSeats}]`,
    label: '7lugares',
    pathAssertions: ['carros-7-lugares/'],
    fixedQueryAssertions: [`ne:[${D.necessityIds.sevenSeats}]`],
  },
  {
    url: `${D.urls.pcd}?filtro=ne:[${D.necessityIds.pcd}]`,
    label: 'pcd',
    pathAssertions: ['carros-para-pcd/'],
    fixedQueryAssertions: [`ne:[${D.necessityIds.pcd}]`],
  },
  {
    url: `${D.urls.armored}?filtro=ne:[${D.necessityIds.armored}]`,
    label: 'blindados',
    pathAssertions: ['carros-blindados/'],
    fixedQueryAssertions: [`ne:[${D.necessityIds.armored}]`],
  },
  {
    url: `${D.urls.electric}?filtro=ne:[${D.necessityIds.electric}]`,
    label: 'eletricos',
    pathAssertions: ['carros-eletricos/'],
    fixedQueryAssertions: [`ne:[${D.necessityIds.electric}]`],
  },
  {
    url: `${D.urls.hybrid}?filtro=ne:[${D.necessityIds.hybrid}]`,
    label: 'hibridos',
    pathAssertions: ['carros-hibridos/'],
    fixedQueryAssertions: [`ne:[${D.necessityIds.hybrid}]`],
  },
  ...D.brandUrls.map((brandUrl) => ({
    url: `${D.urls.brandListings}${brandUrl}/`,
    label: `marca-${brandUrl}`,
    pathAssertions: ['carros/brasil/', `${brandUrl}/`],
  })),
]

const KILOMETERS = [10_000, 30_000, 50_000, 80_000, 120_000]
const YEAR_PAIRS: [number, number][] = [
  [2010, 2015],
  [2016, 2020],
  [2020, 2024],
  [2023, 2027],
]
const PRICE_PAIRS: [number, number][] = [
  [20_000, 50_000],
  [40_000, 80_000],
  [60_000, 120_000],
  [90_000, 180_000],
  [120_000, 250_000],
]
const FUELS = Object.values(D.fuelIds)
const TRANSMISSIONS = Object.values(D.transmissionIds)
const COLORS = Object.values(D.colorIds)
const SELLER_TYPES = Object.values(D.publisherTypeIds)
const OPTIONALS = Object.values(D.optionalIds)
const PLATE_ENDINGS = Object.values(D.plateEndingIds)
const SORTS = Object.values(D.sortCodes)

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function expectVehicleListUpdated(page: Parameters<typeof test>[0]['page'], url: string) {
  const hasCards = await page.locator('a[href*="/carro/"], a[href*="/moto/"]').first().isVisible().catch(() => false)
  const h1Text = await page.getByRole('heading', { level: 1 }).textContent().catch(() => '')
  const isEmpty = /^0\s|nenhum/i.test(h1Text ?? '')

  expect(
    hasCards || isEmpty,
    `Lista não atualizou — sem cards e sem estado vazio — ${url}\nh1: "${h1Text}"`,
  ).toBe(true)
}

interface Scenario {
  url: string
  label: string
  pathAssertions: string[]
  queryAssertions: string[]
}

function buildScenario(): Scenario {
  const base = pick(BASE_ROUTES)
  const labels: string[] = [base.label]
  const pathAssertions = [...base.pathAssertions]
  const queryParts: string[] = [...(base.fixedQueryAssertions ?? [])]
  const queryAssertions: string[] = [...(base.fixedQueryAssertions ?? [])]

  if (!(base.fixedQueryAssertions ?? []).includes('ze:1')) {
    const km = maybe(KILOMETERS, 0.35)
    if (km !== null) {
      queryParts.push(`km:${km}`)
      queryAssertions.push(`km:${km}`)
      labels.push(`km${km}`)
    }
  }

  if (rand() < 0.35) {
    const [pmin, pmax] = pick(PRICE_PAIRS)
    queryParts.push(`pmin:${pmin}`, `pmax:${pmax}`)
    queryAssertions.push(`pmin:${pmin}`, `pmax:${pmax}`)
    labels.push('preco')
  }

  if (rand() < 0.30) {
    const [ymin, ymax] = pick(YEAR_PAIRS)
    queryParts.push(`amin:${ymin}`, `amax:${ymax}`)
    queryAssertions.push(`amin:${ymin}`, `amax:${ymax}`)
    labels.push('ano')
  }

  const fuel = maybe(FUELS, 0.20)
  if (fuel !== null) {
    queryParts.push(`com:[${fuel}]`)
    queryAssertions.push(`com:[${fuel}]`)
    labels.push(`comb${fuel}`)
  }

  const transmission = maybe(TRANSMISSIONS, 0.20)
  if (transmission !== null) {
    queryParts.push(`cam:[${transmission}]`)
    queryAssertions.push(`cam:[${transmission}]`)
    labels.push(`cam${transmission}`)
  }

  const color = maybe(COLORS, 0.20)
  if (color !== null) {
    queryParts.push(`cor:[${color}]`)
    queryAssertions.push(`cor:[${color}]`)
    labels.push(`cor${color}`)
  }

  const sellerType = maybe(SELLER_TYPES, 0.18)
  if (sellerType !== null) {
    queryParts.push(`tve:[${sellerType}]`)
    queryAssertions.push(`tve:[${sellerType}]`)
    labels.push(`tve${sellerType}`)
  }

  const optional = maybe(OPTIONALS, 0.15)
  if (optional !== null) {
    queryParts.push(`op:[${optional}]`)
    queryAssertions.push(`op:[${optional}]`)
    labels.push(`op${optional}`)
  }

  const plateEnding = maybe(PLATE_ENDINGS, 0.12)
  if (plateEnding !== null) {
    queryParts.push(`pl:[${plateEnding}]`)
    queryAssertions.push(`pl:[${plateEnding}]`)
    labels.push(`pl${plateEnding}`)
  }

  const sort = maybe(SORTS, 0.25)
  if (sort !== null) {
    queryParts.push(sort)
    queryAssertions.push(sort)
    labels.push(sort.replace(':', ''))
  }

  const url = queryParts.length > (base.fixedQueryAssertions?.length ?? 0)
    ? `${base.url}${base.url.includes('?') ? ',' : '?filtro='}${queryParts.slice(base.fixedQueryAssertions?.length ?? 0).join(',')}`
    : base.url

  return {
    url,
    label: labels.join('+'),
    pathAssertions,
    queryAssertions,
  }
}

const scenarios: Scenario[] = Array.from({ length: ITERATIONS }, buildScenario)

test.describe('VehicleSearch — Fuzz de Combinações Aleatórias', () => {
  scenarios.forEach((scenario, index) => {
    const id = String(index + 1).padStart(2, '0')

    test(`FUZZ-${id} — ${scenario.label}`, async ({ page }) => {
      const jsErrors: string[] = []
      page.on('pageerror', err => jsErrors.push(err.message))

      console.log(`[VEHICLE-FUZZ-${id}] seed=${SEED} url=${scenario.url}`)

      await page.goto(scenario.url)
      await dismissCookieConsent(page)

      await expect(
        page.getByRole('heading', { level: 1 }),
        `h1 não encontrado — ${scenario.url}`,
      ).toBeVisible({ timeout: 15_000 })

      for (const segment of scenario.pathAssertions) {
        await expect(
          page,
          `Path "${segment}" perdido na URL — ${scenario.url}`,
        ).toHaveURL(new RegExp(escapeRegExp(segment)))
      }

      for (const filter of scenario.queryAssertions) {
        await expect(
          page,
          `Filtro "${filter}" perdido na URL — ${scenario.url}`,
        ).toHaveURL(new RegExp(escapeRegExp(filter)))
      }

      await expectVehicleListUpdated(page, scenario.url)

      expect(
        jsErrors,
        `Erros de JS — ${scenario.url}\n${jsErrors.join('\n')}`,
      ).toHaveLength(0)
    })
  })
})

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

interface AddressScenario {
  url: string
  label: string
  city: string
  prefix: string
}

function buildAddressScenario(): AddressScenario {
  const city = pickAddr(D.locationSearch.fuzz.cities)
  const prefix = pickAddr(D.locationSearch.fuzz.prefixes)
  const labelPrefix = prefix.replace(/\//g, '').replace(/-/g, '_') || 'carros'

  return {
    url: `${prefix}${city}/`,
    label: `${labelPrefix}+${city}`,
    city,
    prefix,
  }
}

const addressScenarios: AddressScenario[] = Array.from(
  { length: ITERATIONS },
  buildAddressScenario,
)

test.describe('VehicleSearch — Fuzz de Busca por Cidade', () => {
  addressScenarios.forEach((scenario, index) => {
    const id = String(index + 1).padStart(2, '0')

    test(`CITY-FUZZ-${id} — ${scenario.label}`, async ({ page }) => {
      const jsErrors: string[] = []
      page.on('pageerror', err => jsErrors.push(err.message))

      console.log(`[VEHICLE-CITY-FUZZ-${id}] seed=${SEED} url=${scenario.url}`)

      await page.goto(scenario.url)
      await dismissCookieConsent(page)

      await expect(
        page.getByRole('heading', { level: 1 }),
        `h1 não encontrado — ${scenario.url}`,
      ).toBeVisible({ timeout: 15_000 })

      await expect(
        page,
        `Prefixo "${scenario.prefix}" perdido na URL — ${scenario.url}`,
      ).toHaveURL(new RegExp(escapeRegExp(scenario.prefix.replace(/^\//, ''))))

      await expect(
        page,
        `Cidade "${scenario.city}" perdida na URL — ${scenario.url}`,
      ).toHaveURL(new RegExp(escapeRegExp(scenario.city)))

      await expectVehicleListUpdated(page, scenario.url)

      expect(
        jsErrors,
        `Erros de JS — ${scenario.url}\n${jsErrors.join('\n')}`,
      ).toHaveLength(0)
    })
  })
})