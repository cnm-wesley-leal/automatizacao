import { Locator, Page, expect } from '@playwright/test'
import { TEST_DATA } from '../utils/test-data'

export class HeaderPage {
  constructor(private page: Page) {}

  private isWebkit(): boolean {
    return this.page.context().browser()?.browserType().name() === 'webkit'
  }

  private async resilientClick(locator: Locator, allowForceOnWebkit = false): Promise<void> {
    await locator.scrollIntoViewIfNeeded().catch(() => {})
    await expect(locator).toBeVisible()
    await expect(locator).toBeEnabled()

    const maxAttempts = this.isWebkit() ? 3 : 2
    let lastError: unknown

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await locator.click()
        return
      } catch (err) {
        lastError = err
        const shouldForce = allowForceOnWebkit && this.isWebkit() && attempt === maxAttempts
        if (shouldForce) {
          await locator.click({ force: true })
          return
        }
      }
    }

    throw lastError
  }

  // ── Localizadores ────────────────────────────────────────────────────────────

  // Link do logo não possui nome acessível — âncora identificada por href=/
  get logo() {
    return this.page.locator('header a[href="/"]').first()
  }

  get navImoveis() {
    return this.page.getByRole('link', { name: 'Imóveis' }).first()
  }

  get navVeiculos() {
    return this.page.getByRole('link', { name: 'Veículos' }).first()
  }

  get navAnuncie() {
    return this.page.getByRole('link', { name: 'Anuncie' }).first()
  }

  get navFavoritos() {
    return this.page.getByRole('link', { name: 'Favoritos' }).first()
  }

  get entrarLink() {
    return this.page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })
  }

  get hamburgerButton() {
    return this.page.locator('header').getByRole('button', { name: /menu/i })
  }

  // ID #portal-sidebarMenu é o único identificador estável exposto pelo portal para o menu lateral
  get sideMenu() {
    return this.page.locator('#portal-sidebarMenu')
  }

  get sideMenuMinhaContaLink() {
    return this.page.getByRole('link', { name: /minha conta/i })
  }

  get authPanel() {
    return this.page.getByRole('heading', { name: /acesse ou crie sua conta/i })
  }

  // ── Ações ────────────────────────────────────────────────────────────────────

  async gotoHome() {
    await this.page.goto(TEST_DATA.urls.base, { waitUntil: 'domcontentloaded' })
    await this.dismissCookieConsentIfPresent()
  }

  async dismissCookieConsentIfPresent() {
    const consentBtn = this.page.getByRole('button', { name: TEST_DATA.locators.common.cookieConsent })
    try {
      await expect(consentBtn).toBeVisible({ timeout: 4000 })
      await this.resilientClick(consentBtn)
    } catch {
      // Banner não exibido — comportamento esperado em sessões já consentidas
    }
  }

  async openAuthPanel() {
    await expect(this.entrarLink).toBeVisible()
    await this.resilientClick(this.entrarLink, true)
    await expect(this.authPanel).toBeVisible()
  }

  async clickFavoritos(): Promise<void> {
    await this.resilientClick(this.navFavoritos, true)
  }

  // ── Asserções ────────────────────────────────────────────────────────────────

  async assertLogoVisible() {
    await expect(this.logo).toBeVisible()
  }

  async assertMainNavLinksVisible() {
    await expect(this.navImoveis).toBeVisible()
    await expect(this.navVeiculos).toBeVisible()
    await expect(this.navAnuncie).toBeVisible()
  }

  async assertEntrarLinkVisible() {
    await expect(this.entrarLink).toBeVisible()
  }

  async assertEntrarLinkHidden() {
    await expect(this.entrarLink).toBeHidden()
  }

  async assertAuthPanelOpen() {
    await expect(this.authPanel).toBeVisible()
  }

  async assertAuthPanelClosed() {
    await expect(this.authPanel).toBeHidden()
  }
}
