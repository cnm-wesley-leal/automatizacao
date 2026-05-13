import { type Locator, type Page } from '@playwright/test'

/**
 * Page Object para o componente de busca por localização (cidade/bairro)
 * presente nas páginas de listagem de imóveis.
 *
 * Locator hierarchy (conforme BLOCO 1):
 *   role → label → placeholder → text → testid
 *
 * Seletores baseados no placeholder visível na UI:
 *   "Digite bairro, rua ou cidade"
 */
export class LocationSearchPage {
  readonly page: Page

  /** Input de localização (cidade, bairro ou rua) */
  readonly locationInput: Locator

  /** Botão / link "Perto de mim" com ícone de geolocalização */
  readonly nearMeButton: Locator

  constructor(page: Page) {
    this.page = page
    // #locInp-input é o ID estável do campo; placeholder como fallback
    this.locationInput = page.locator('#locInp-input')
    this.nearMeButton  = page
      .getByRole('button', { name: /perto de mim/i })
      .or(page.getByRole('link', { name: /perto de mim/i }))
  }

  // ── Dropdown ────────────────────────────────────────────────────────────────

  /**
   * Abre o dropdown clicando no input de localização e aguarda que os itens
   * fiquem visíveis. Funciona apenas na listagem geral (/imoveis/brasil/).
   * Em páginas de cidade específica o dropdown não é exibido.
   */
  async openLocationDropdown(): Promise<void> {
    await this.locationInput.click()
    await this.page
      .locator('#locationContainer p[class*="items_"]')
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 })
  }

  /**
   * Retorna todos os itens de sugestão visíveis no dropdown.
   * O componente usa <p class*="items_"> — sem ARIA roles.
   * Sem texto digitado: apenas cidades top. Com texto: cidades + bairros + ruas.
   */
  getDropdownItems(): Locator {
    return this.page.locator('#locationContainer p[class*="items_"]')
  }

  /**
   * Retorna itens de sugestão de cidades.
   * Alias de getDropdownItems() — o primeiro item sempre é a melhor cidade.
   */
  getCityItems(): Locator {
    return this.getDropdownItems()
  }

  /**
   * Retorna itens da seção "Bairros" do dropdown.
   * Esta seção só aparece após digitar texto no input.
   */
  getNeighborhoodItems(): Locator {
    return this.page
      .locator('#locationContainer')
      .locator('span')
      .filter({ has: this.page.locator('h4', { hasText: 'Bairros' }) })
      .locator('p[class*="items_"]')
  }

  // ── Ações de seleção ────────────────────────────────────────────────────────

  /** Digita texto no input de localização sem selecionar nada */
  async typeLocation(text: string): Promise<void> {
    await this.locationInput.click()
    await this.locationInput.pressSequentially(text, { delay: 40 })
  }

  /**
   * Digita o nome de uma cidade e seleciona o primeiro item correspondente.
   */
  async selectCity(name: string): Promise<void> {
    await this.locationInput.click()
    await this.locationInput.pressSequentially(name, { delay: 40 })
    await this.page
      .locator('#locationContainer p[class*="items_"]')
      .filter({ hasText: new RegExp(name, 'i') })
      .first()
      .click()
  }

  /**
   * Seleciona um bairro pelo nome a partir da seção "Bairros" do dropdown.
   * Deve ser chamado após typeLocation(), quando a seção de bairros estiver visível.
   */
  async selectNeighborhood(name: string): Promise<void> {
    await this.page
      .locator('#locationContainer')
      .locator('span')
      .filter({ has: this.page.locator('h4', { hasText: 'Bairros' }) })
      .locator('p[class*="items_"]')
      .filter({ hasText: new RegExp(name, 'i') })
      .first()
      .click()
  }

  /** Retorna o valor atual do input de localização */
  async getSelectedLocationText(): Promise<string> {
    return (await this.locationInput.inputValue()) || ''
  }

  /** Limpa o input e fecha o dropdown */
  async clearLocationInput(): Promise<void> {
    await this.locationInput.clear()
    await this.locationInput.press('Escape')
  }

  // ── Geolocalização ──────────────────────────────────────────────────────────

  /** Clica no botão "Perto de mim" */
  async clickNearMe(): Promise<void> {
    await this.nearMeButton.click()
  }

  /**
   * Locator da mensagem de erro de geolocalização
   * (exibida quando a permissão é negada ou indisponível).
   */
  getGeoErrorElement(): Locator {
    return this.page
      .getByText(/localização|geolocalização|permissão|habilit|bloqueou/i)
      .or(
        this.page
          .locator('[class*="error"], [class*="alert"], [role="alert"]')
          .filter({ hasText: /localização|geolocalização|permissão/i }),
      )
  }

  // ── Listagem e chips ────────────────────────────────────────────────────────

  /** Retorna os chips de categoria de imóvel (Apartamentos, Casas, etc.) */
  getCategoryChips(): Locator {
    // Chips são links de navegação no carrossel abaixo do h1
    return this.page.locator('[class*="chip"], [class*="category"], [class*="tab"]').filter({
      hasText: /apartamento|casa|terreno|sala|lançamento|\bem\b/i,
    })
  }

  /** Retorna todos os cards de resultado (links de imóveis) */
  getListingCards(): Locator {
    return this.page.locator('a[href*="/imovel/"]')
  }

  /**
   * Extrai os hrefs dos primeiros N cards da listagem.
   * Útil para verificar se todos os resultados pertencem à cidade/bairro selecionados.
   */
  async getListingCardHrefs(maxCards = 10): Promise<string[]> {
    const cards = this.getListingCards()
    const count = await cards.count()
    const hrefs: string[] = []
    for (let i = 0; i < Math.min(count, maxCards); i++) {
      const href = (await cards.nth(i).getAttribute('href')) ?? ''
      hrefs.push(href)
    }
    return hrefs
  }
}
