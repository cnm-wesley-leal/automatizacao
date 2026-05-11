/**
 * Diagnóstico do React error #418 (SSR Hydration Mismatch)
 *
 * Hipótese: filtros que retornam resultados escassos ou zerados provocam
 * divergência entre o HTML renderizado no servidor e a hidratação do cliente.
 *
 * Estratégia:
 *   1. Testar cada filtro suspeito em isolamento N vezes (REPS)
 *   2. Testar combinações escaladas (gar:1→4, ban:1→4, amin ranges)
 *   3. Cruzar filtros suspeitos entre si
 *   4. Qualquer pageerror #418 é registrado — ao final, taxa de falha por caso
 *
 * Execução:
 *   DIAG_REPS=10 yarn playwright test --config=playwright.fuzz.config.ts RealtySearchHydrationDiag
 */

import { expect, test } from '@playwright/test'
import { REALTY_SEARCH_DATA } from '../utils/test-data'
import { dismissCookieConsent } from '../utils/helpers'

const D = REALTY_SEARCH_DATA
const REPS = parseInt(process.env.DIAG_REPS ?? '5', 10)

// ── Casos de diagnóstico ──────────────────────────────────────────────────────

interface DiagCase {
  id: string
  url: string
  hypothesis: string
}

const BASE = D.urls.listings          // /imoveis/brasil/
const RENT = D.urls.forRent           // /imoveis-para-alugar/brasil/
const SALE = D.urls.forSale           // /imoveis-a-venda/brasil/

const CASES: DiagCase[] = [
  // ── Gatilhos conhecidos (reproduzir) ──────────────────────────────────────
  { id: 'K01', url: `${RENT}?filtro=gar:3`,                      hypothesis: 'gar:3 isolado — gatilho confirmado anteriormente' },
  { id: 'K02', url: `${RENT}?filtro=amin:30,amax:100`,           hypothesis: 'amin:30,amax:100 isolado — gatilho confirmado anteriormente' },
  { id: 'K03', url: `${BASE}2-quartos/?filtro=gar:1,are:[6],or:3`, hypothesis: 'combinação do run anterior com gar+feat+or:3' },

  // ── Escala de garagens — isolar gar:3 vs outros ───────────────────────────
  { id: 'G01', url: `${RENT}?filtro=gar:1`,                      hypothesis: 'gar:1 — baixa esparsidade' },
  { id: 'G02', url: `${RENT}?filtro=gar:2`,                      hypothesis: 'gar:2 — esparsidade média' },
  { id: 'G03', url: `${RENT}?filtro=gar:3`,                      hypothesis: 'gar:3 — alta esparsidade (suspeito)' },

  // ── Escala de banheiros ───────────────────────────────────────────────────
  { id: 'B01', url: `${RENT}?filtro=ban:1`,                      hypothesis: 'ban:1 — comum' },
  { id: 'B02', url: `${RENT}?filtro=ban:2`,                      hypothesis: 'ban:2 — moderado' },
  { id: 'B03', url: `${RENT}?filtro=ban:3`,                      hypothesis: 'ban:3 — raro' },
  { id: 'B04', url: `${RENT}?filtro=ban:4`,                      hypothesis: 'ban:4 — muito raro' },

  // ── Escala de área útil ───────────────────────────────────────────────────
  { id: 'A01', url: `${RENT}?filtro=amin:30,amax:100`,           hypothesis: 'área 30–100m² (raro para aluguel)' },
  { id: 'A02', url: `${RENT}?filtro=amin:50,amax:150`,           hypothesis: 'área 50–150m² (normal)' },
  { id: 'A03', url: `${RENT}?filtro=amin:80,amax:200`,           hypothesis: 'área 80–200m² (normal)' },
  { id: 'A04', url: `${RENT}?filtro=amin:100,amax:300`,          hypothesis: 'área 100–300m² (amplo)' },
  { id: 'A05', url: `${BASE}?filtro=amin:30,amax:100`,           hypothesis: 'área 30–100m² em /imoveis/ (mais resultados?)' },
  { id: 'A06', url: `${SALE}?filtro=amin:30,amax:100`,           hypothesis: 'área 30–100m² em /imoveis-a-venda/' },

  // ── Ordenação or:3 (menorArea) — presente no gatilho anterior ────────────
  { id: 'O01', url: `${RENT}?filtro=or:3`,                       hypothesis: 'or:3 (menorArea) isolado' },
  { id: 'O02', url: `${BASE}?filtro=or:3`,                       hypothesis: 'or:3 em /imoveis/' },
  { id: 'O03', url: `${RENT}?filtro=gar:1,or:3`,                 hypothesis: 'gar:1 + or:3 combinados' },
  { id: 'O04', url: `${BASE}2-quartos/?filtro=gar:1,or:3`,       hypothesis: 'gar:1 + or:3 + path quartos' },

  // ── Combinações cruzadas de suspeitos ─────────────────────────────────────
  { id: 'C01', url: `${RENT}?filtro=gar:3,amin:30,amax:100`,     hypothesis: 'gar:3 + amin:30 combinados' },
  { id: 'C02', url: `${RENT}?filtro=ban:4,gar:3`,                hypothesis: 'ban:4 + gar:3 (muito raro)' },
  { id: 'C03', url: `${SALE}?filtro=ban:4,gar:3,pmin:1000000,pmax:5000000,amin:100,amax:300`, hypothesis: 'combinação completa do FUZZ-10 anterior' },
  { id: 'C04', url: `${RENT}?filtro=gar:3,or:3`,                 hypothesis: 'gar:3 + or:3 (menorArea)' },
  { id: 'C05', url: `${BASE}?filtro=ban:4,gar:3,amin:30,amax:100`, hypothesis: 'máxima esparsidade acumulada' },

  // ── Controles — não devem falhar ──────────────────────────────────────────
  { id: 'CTL1', url: BASE,                                        hypothesis: 'CONTROLE: página sem filtros' },
  { id: 'CTL2', url: `${RENT}?filtro=ban:2,gar:1`,               hypothesis: 'CONTROLE: filtros comuns' },
  { id: 'CTL3', url: `${RENT}?filtro=pmin:300000,pmax:800000`,   hypothesis: 'CONTROLE: preço normal' },
]

// ── Resultados acumulados ─────────────────────────────────────────────────────

const results: Record<string, { hits: number; total: number }> = {}

// ── Suite ─────────────────────────────────────────────────────────────────────

test.describe('Diagnóstico React #418 — Hydration Mismatch', () => {
  // Inicializa contadores
  for (const c of CASES) results[c.id] = { hits: 0, total: 0 }

  for (const diag of CASES) {
    for (let rep = 1; rep <= REPS; rep++) {
      test(`${diag.id} [${rep}/${REPS}] — ${diag.hypothesis}`, async ({ page }) => {
        const jsErrors: string[] = []
        page.on('pageerror', err => jsErrors.push(err.message))

        await page.goto(diag.url)
        await dismissCookieConsent(page)
        await expect(
          page.getByRole('heading', { level: 1 }),
          `h1 ausente: ${diag.url}`,
        ).toBeVisible({ timeout: 15_000 })

        results[diag.id].total++
        if (jsErrors.some(e => e.includes('#418'))) {
          results[diag.id].hits++
          console.log(`[#418 HIT] ${diag.id} rep=${rep} url=${diag.url}`)
        }

        // Falha o teste ao encontrar #418 para que apareça no relatório
        expect(
          jsErrors.filter(e => e.includes('#418')),
          `React #418 em ${diag.id} (rep ${rep}): ${diag.url}`,
        ).toHaveLength(0)
      })
    }
  }

  // Sumário ao final — impresso nos logs do worker
  test('ZZ — Sumário de taxas de falha', async () => {
    const lines: string[] = ['', '=== DIAGNÓSTICO REACT #418 — SUMÁRIO ===']
    for (const diag of CASES) {
      const r = results[diag.id]
      if (r.total === 0) continue
      const rate = ((r.hits / r.total) * 100).toFixed(0)
      const flag = r.hits > 0 ? '❌' : '✅'
      lines.push(`${flag} ${diag.id.padEnd(5)} ${rate.padStart(3)}% (${r.hits}/${r.total})  ${diag.hypothesis}`)
    }
    lines.push('==========================================')
    console.log(lines.join('\n'))

    // O teste de sumário sempre passa — serve só para logar
    expect(true).toBe(true)
  })
})
