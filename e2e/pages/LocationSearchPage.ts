import { type Locator, type Page } from '@playwright/test'

/**
 * Page Object para o componente de busca por localização (cidade/bairro)
 * presente nas páginas de listagem de imóveis.
 *
 * Fluxo atual (após refatoração do componente):
 *   1. Clicar em "Filtros" → abre painel principal
 *   2. Clicar em "#locationFilter button" → abre sub-painel de localização
 *   3. Sub-painel expõe #locInp-input, lista de cidades e "Perto de mim"
 *   4. Selecionar cidade adiciona chip em [class*="filtersMarked"] (não navega)
 *   5. Clicar "Concluir" → aplica filtro e navega
 */
export class LocationSearchPage {
  readonly page: Page

  /** Input de localização — só está no DOM quando o sub-painel está aberto */
  readonly locationInput: Locator

  /** Botão "Perto de mim" — disponível dentro do sub-painel de localização */
  readonly nearMeButton: Locator

  constructor(page: Page) {
    this.page = page
    this.locationInput = page.locator('#locInp-input')
    this.nearMeButton  = page.getByRole('button', { name: /perto de mim/i })
  }

  // ── Sub-painel de localização ────────────────────────────────────────────────

  /**
   * Abre o sub-painel de localização.
   * Garante que o painel principal de filtros esteja aberto antes de abrir o sub-painel.
   */
  async openLocationDropdown(): Promise<void> {
    const locationFilter = this.page.locator('#locationFilter')
    if (!await locationFilter.isVisible().catch(() => false)) {
      await this.page.getByRole('button', { name: 'Filtros' }).click()
      await locationFilter.waitFor({ state: 'visible', timeout: 8_000 })
    }
    await this.page.locator('#locationFilter button').click()
    await this.locationInput.waitFor({ state: 'visible', timeout: 8_000 })
  }

  /**
   * Retorna todos os itens de resultado na lista de localização
   * (cidades + bairros + ruas quando há texto digitado).
   */
  getDropdownItems(): Locator {
    return this.page.locator('[class*="listLocation"] p[class*="listResultIcon"]')
  }

  /**
   * Retorna apenas itens da seção "Cidades" ou "Principais Cidades".
   * Usa XPath para selecionar somente os <p> que seguem o h4 correspondente.
   */
  getCityItems(): Locator {
    return this.page.locator(
      'xpath=//span[contains(@class,"listLocation")]' +
      '//p[contains(@class,"listResultIcon")]' +
      '[preceding-sibling::h4[1][contains(normalize-space(),"Cidades")]]',
    )
  }

  /**
   * Retorna apenas itens da seção "Bairros" ou "Principais Bairros".
   * Disponível após digitar texto (seção "Bairros") ou após selecionar uma cidade.
   */
  getNeighborhoodItems(): Locator {
    return this.page.locator(
      'xpath=//span[contains(@class,"listLocation")]' +
      '//p[contains(@class,"listResultIcon")]' +
      '[preceding-sibling::h4[1][contains(normalize-space(),"Bairros")]]',
    )
  }

  // ── Ações de seleção ────────────────────────────────────────────────────────

  /** Digita texto no input de localização sem selecionar nada */
  async typeLocation(text: string): Promise<void> {
    await this.locationInput.pressSequentially(text, { delay: 40 })
  }

  /**
   * Digita o nome de uma cidade, seleciona o primeiro item correspondente
   * e confirma via "Concluir" para navegar.
   */
  async selectCity(name: string): Promise<void> {
    await this.typeLocation(name)
    await this.getCityItems()
      .filter({ hasText: new RegExp(name, 'i') })
      .first()
      .click()
    await this.page.getByRole('button', { name: /concluir/i }).click()
  }

  /**
   * Seleciona um bairro pelo nome e confirma via "Concluir".
   * Deve ser chamado após typeLocation() ou após selecionar uma cidade.
   */
  async selectNeighborhood(name: string): Promise<void> {
    await this.getNeighborhoodItems()
      .filter({ hasText: new RegExp(name, 'i') })
      .first()
      .click()
    await this.page.getByRole('button', { name: /concluir/i }).click()
  }

  /**
   * Retorna o texto da localização selecionada.
   * Lê do chip em [class*="filtersMarked"] quando o sub-painel está aberto,
   * ou do botão #locationFilter quando o painel principal está aberto.
   * Retorna string vazia se nenhuma localização estiver selecionada.
   */
  async getSelectedLocationText(): Promise<string> {
    const chip = this.page.locator('[class*="filtersMarked"] button')
    if (await chip.isVisible().catch(() => false)) {
      return (await chip.textContent() ?? '').trim()
    }
    const locBtn = this.page.locator('#locationFilter button')
    if (await locBtn.isVisible().catch(() => false)) {
      const text = (await locBtn.textContent() ?? '').trim()
      return /em todo brasil/i.test(text) ? '' : text
    }
    return ''
  }

  /**
   * Remove a localização selecionada clicando no chip ×.
   * Se não houver chip, limpa o input diretamente.
   */
  async clearLocationInput(): Promise<void> {
    const chip = this.page.locator('[class*="filtersMarked"] button')
    if (await chip.isVisible().catch(() => false)) {
      await chip.click()
    } else {
      await this.locationInput.clear()
    }
  }

  // ── Geolocalização ──────────────────────────────────────────────────────────

  /** Clica no botão "Perto de mim" (disponível apenas com o sub-painel aberto) */
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
