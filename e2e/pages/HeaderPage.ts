import { Page, expect } from '@playwright/test';
import { TEST_DATA } from '../utils/test-data';

/**
 * Page Object Model para o Header/Navbar do portal.
 * Encapsula todos os localizadores e ações relacionadas ao header.
 *
 * Estrutura real descoberta via exploração (staging.chavesnamao.com.br):
 * - Logo: link sem texto visível apontando para /
 * - Nav links principais: Imóveis, Veículos, Anuncie, Favoritos
 * - Conta (deslogado): link "Entrar" → abre painel de autenticação
 * - Conta (logado): avatar/nome do usuário com dropdown
 * - Mobile: botão hambúrguer abre menu lateral com links + "Minha conta"
 */
export class HeaderPage {
  constructor(private page: Page) {}

  // ── Localizadores ────────────────────────────────────────────────────────────

  /** Link do logo — âncora para a home sem texto visível */
  get logo() {
    return this.page.locator('header a[href="/"], header a[href$="chavesnamao.com.br/"]').first();
  }

  /** Link de navegação "Imóveis" no header */
  get navImoveis() {
    return this.page.getByRole('link', { name: 'Imóveis' }).first();
  }

  /** Link de navegação "Veículos" no header */
  get navVeiculos() {
    return this.page.getByRole('link', { name: 'Veículos' }).first();
  }

  /** Link "Anuncie" no header */
  get navAnuncie() {
    return this.page.getByRole('link', { name: 'Anuncie' }).first();
  }

  /** Link "Favoritos" no header */
  get navFavoritos() {
    return this.page.getByRole('link', { name: 'Favoritos' }).first();
  }

  /** Link "Entrar" — visível quando deslogado */
  get entrarLink() {
    return this.page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink });
  }

  /**
   * Botão hambúrguer no mobile.
   * O site usa um botão sem aria-label explícito mas detectável por role button
   * dentro do header quando o viewport é estreito.
   */
  get hamburgerButton() {
    return this.page
      .locator('header button')
      .filter({ hasNot: this.page.locator('a') })
      .first();
  }

  /** Menu lateral (drawer) que abre após clicar no hambúrguer */
  get sideMenu() {
    return this.page.locator('[class*="drawer"], [class*="Drawer"], [class*="sidebar"], [class*="sidenav"], [class*="mobile-menu"], [class*="mobileMenu"]').first();
  }

  /** Link "Minha conta" dentro do menu lateral mobile */
  get sideMenuMinhaContaLink() {
    return this.page.getByRole('link', { name: /minha conta/i });
  }

  /** Painel/dropdown de conta (deslogado) — abre ao clicar "Entrar" */
  get authPanel() {
    return this.page.getByRole('heading', { name: /acesse ou crie sua conta/i });
  }

  /** Dropdown de conta (logado) — abre ao clicar no avatar/nome */
  get accountDropdownTrigger() {
    // Logado: o "Entrar" é ocultado e surge um botão/link com nome ou avatar do usuário
    return this.page.locator('header').getByRole('button').filter({ hasNot: this.page.getByRole('link', { name: 'Entrar' }) }).first();
  }

  // ── Ações ────────────────────────────────────────────────────────────────────

  /** Navega para a home e dispensa o cookie consent se presente */
  async gotoHome() {
    await this.page.goto(TEST_DATA.urls.base, { waitUntil: 'domcontentloaded' });
    await this.dismissCookieConsentIfPresent();
  }

  /** Dispensa o banner de cookie consent se visível */
  async dismissCookieConsentIfPresent() {
    const consentBtn = this.page.getByRole('button', { name: TEST_DATA.locators.common.cookieConsent });
    try {
      await expect(consentBtn).toBeVisible({ timeout: 4000 });
      await consentBtn.click();
    } catch {
      // Banner não exibido — comportamento esperado em sessões já consentidas
    }
  }

  /** Abre o painel de autenticação clicando em "Entrar" */
  async openAuthPanel() {
    await expect(this.entrarLink).toBeVisible();
    await this.entrarLink.click();
    await expect(this.authPanel).toBeVisible();
  }

  /** Define o viewport como mobile (iPhone 12 equivalente) */
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 390, height: 844 });
  }

  /** Define o viewport como desktop padrão */
  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  // ── Asserções ────────────────────────────────────────────────────────────────

  /** Valida que o logo está presente e aponta para a home */
  async assertLogoVisible() {
    await expect(this.logo).toBeVisible();
  }

  /** Valida que os links principais de navegação estão visíveis */
  async assertMainNavLinksVisible() {
    await expect(this.navImoveis).toBeVisible();
    await expect(this.navVeiculos).toBeVisible();
    await expect(this.navAnuncie).toBeVisible();
  }

  /** Valida que o link "Entrar" está visível (usuário deslogado) */
  async assertEntrarLinkVisible() {
    await expect(this.entrarLink).toBeVisible();
  }

  /** Valida que o link "Entrar" está oculto (usuário logado) */
  async assertEntrarLinkHidden() {
    await expect(this.entrarLink).toBeHidden();
  }

  /** Valida que o painel de autenticação está aberto */
  async assertAuthPanelOpen() {
    await expect(this.authPanel).toBeVisible();
  }

  /** Valida que o painel de autenticação está fechado */
  async assertAuthPanelClosed() {
    await expect(this.authPanel).toBeHidden();
  }
}
