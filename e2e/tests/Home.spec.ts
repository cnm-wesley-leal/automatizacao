import { expect, test } from '@playwright/test'
import { HOME_DATA, TEST_DATA } from '../utils/test-data'
import { dismissCookieConsent } from '../utils/helpers'

const D = HOME_DATA

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Home — Renderização e Buscador', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto(TEST_DATA.urls.base, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page, testInfo)
  })

  // ── 3.a Renderização ──────────────────────────────────────────────────────

  test('CT01 — h1 hero visível com texto correto', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText(D.h1)
  })

  test('CT02 — tabs Imóveis e Veículos visíveis', async ({ page }) => {
    await expect(page.locator(`a[href="${D.tabs.realty}"]`).first()).toBeVisible()
    await expect(page.locator(`a[href="${D.tabs.vehicle}"]`).first()).toBeVisible()
  })

  test('CT03 — seções de conteúdo de imóveis renderizadas', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 2 }).filter({ hasText: D.sections.realtyH2 })).toBeVisible()
    await expect(page.getByRole('heading', { level: 3 }).filter({ hasText: D.sections.realtyH3Type })).toBeVisible()
    await expect(page.getByRole('heading', { level: 3 }).filter({ hasText: D.sections.realtyH3Amenity })).toBeVisible()
  })

  test('CT04 — seções de conteúdo de veículos renderizadas ao trocar aba', async ({ page }) => {
    await page.locator(`a[href="${D.tabs.vehicle}"]`).first().click()
    await expect(page.getByRole('heading', { level: 2 }).filter({ hasText: D.sections.vehicleH2 })).toBeVisible()
    await expect(page.getByRole('heading', { level: 3 }).filter({ hasText: D.sections.vehicleH3Type })).toBeVisible()
  })

  test('CT05 — links de tipo de imóvel visíveis no buscador', async ({ page }) => {
    await expect(page.locator(`a[href="${D.quickLinks.realty.apartment}"]`)).toBeVisible()
    await expect(page.locator(`a[href="${D.quickLinks.realty.house}"]`)).toBeVisible()
  })

  // desktop only — layout mobile não exibe links de carroceria individualmente
  test('CT06 — links de tipo de carroceria visíveis na aba veículos', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Layout mobile não exibe carroceria como links')

    // :visible filtra o link aria-hidden do mega-menu; o link real fica abaixo do fold mas é CSS-visible
    await expect(page.locator('a[href*="/carros-sedas/"]:visible').first()).toBeVisible()
    await expect(page.locator('a[href*="/carros-hatchback/"]:visible').first()).toBeVisible()
  })

  test('CT07 — link de anúncio presente', async ({ page }) => {
    await expect(page.locator(`a[href="${D.navLinks.advertise}"]`).first()).toBeVisible()
  })

  // ── 3.b Buscador de imóvel ────────────────────────────────────────────────

  // desktop only — mobile usa componente de busca diferente (sem IDs de input)
  test('CT08 — buscador imóvel: input de localização e botão de tipo visíveis', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only — mobile usa UI de busca diferente')

    await expect(page.locator(`#${D.realty.locationInputId}`)).toBeVisible()
    await expect(
      page.locator('button').filter({ hasText: /tipo de imóvel|todos/i }).first()
    ).toBeVisible()
  })

  test('CT09 — buscador imóvel: link Buscar redireciona para listagem', async ({ page }) => {
    await page
      .locator(`a[href="${D.realty.buscarHref}"]`)
      .filter({ hasText: /buscar/i })
      .first()
      .click()
    await expect(page).toHaveURL(D.realty.redirectPattern)
  })

  test('CT10 — buscador imóvel: input aceita texto de localização', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only — mobile usa UI de busca diferente')

    const input = page.locator(`#${D.realty.locationInputId}`)
    await input.fill('São Paulo')
    await expect(input).toHaveValue('São Paulo')
  })

  // ── 3.c Buscador de veículo ───────────────────────────────────────────────

  test('CT11 — buscador veículo: inputs de marca e cidade visíveis', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only — mobile usa UI de busca diferente')

    await page.locator(`a[href="${D.tabs.vehicle}"]`).first().click()
    await expect(page.locator(`#${D.vehicle.brandInputId}`)).toBeVisible()
    await expect(page.locator(`#${D.vehicle.cityInputId}`)).toBeVisible()
  })

  test('CT12 — buscador veículo: link Buscar redireciona para listagem', async ({ page }) => {
    await page.locator(`a[href="${D.tabs.vehicle}"]`).first().click()
    await page
      .locator(`a[href="${D.vehicle.buscarHref}"]`)
      .filter({ hasText: /buscar/i })
      .first()
      .click()
    await expect(page).toHaveURL(D.vehicle.redirectPattern)
  })

  test('CT13 — buscador veículo: inputs aceitam texto', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only — mobile usa UI de busca diferente')

    await page.locator(`a[href="${D.tabs.vehicle}"]`).first().click()
    const brandInput = page.locator(`#${D.vehicle.brandInputId}`)
    const cityInput = page.locator(`#${D.vehicle.cityInputId}`)
    await brandInput.fill('Toyota')
    await cityInput.fill('São Paulo')
    await expect(brandInput).toHaveValue('Toyota')
    await expect(cityInput).toHaveValue('São Paulo')
  })

  // ── 3.d Troca de abas ─────────────────────────────────────────────────────

  test('CT14 — troca imóvel → veículo: buscador de veículo aparece', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only — mobile usa UI de busca diferente')

    await page.locator(`a[href="${D.tabs.vehicle}"]`).first().click()
    await expect(page.locator(`#${D.vehicle.brandInputId}`)).toBeVisible()
    await expect(page.locator(`#${D.realty.locationInputId}`)).not.toBeVisible()
  })

  test('CT15 — troca veículo → imóvel: buscador de imóvel restaurado', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only — mobile usa UI de busca diferente')

    await page.locator(`a[href="${D.tabs.vehicle}"]`).first().click()
    await expect(page.locator(`#${D.vehicle.brandInputId}`)).toBeVisible()

    await page.locator(`a[href="${D.tabs.realty}"]`).first().click()
    await expect(page.locator(`#${D.realty.locationInputId}`)).toBeVisible()
    await expect(page.locator(`#${D.vehicle.brandInputId}`)).not.toBeVisible()
  })
})
