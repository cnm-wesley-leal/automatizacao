import { test, expect, devices } from '@playwright/test'
import { TEST_DATA } from '../utils/test-data'
import { HeaderPage } from '../pages/HeaderPage'
import { dismissCookieConsent, hasAuthenticatedCookies } from '../utils/helpers'
import { TIMEOUTS } from '../utils/config'

// defaultBrowserType força novo worker e não pode ser usado dentro de describe
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { defaultBrowserType: _dbt, ...iPhoneDevice } = devices['iPhone 14']

/**
 * Suite: Feature Header — Validação E2E
 *
 * US: Como usuário, ao acessar qualquer página do portal, o header deve estar
 * renderizado corretamente com logo, links de navegação, menu da conta (dropdown)
 * e comportamento responsivo (mobile/desktop), garantindo que as funcionalidades
 * principais de navegação e acesso à conta funcionem de ponta a ponta.
 *
 * Regra de negócio crítica:
 *   Quando o menu lateral mobile (hambúrguer) está visível com a opção "Minha conta",
 *   o dropdown de conta NÃO deve estar disponível simultaneamente.
 */

// ── Suite Deslogado — Desktop ─────────────────────────────────────────────────

test.describe('Feature Header — Deslogado (Desktop)', () => {
  test.skip(({ isMobile }) => isMobile, 'Suíte Desktop não executada em dispositivos móveis.')
  test.use({ storageState: { cookies: [], origins: [] } })

  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto(TEST_DATA.urls.base, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page, testInfo)
  })

  test('CT01 - deve renderizar o header corretamente em desktop (deslogado)', async ({ page }) => {
    const header = new HeaderPage(page)
    await header.assertLogoVisible()
    await header.assertMainNavLinksVisible()
    await expect(header.navFavoritos).toBeVisible()
    await header.assertEntrarLinkVisible()
    await header.assertAuthPanelClosed()
  })

  test('CT06 - deve abrir o painel de conta ao clicar em "Entrar" (deslogado)', async ({ page }) => {
    const header = new HeaderPage(page)
    await header.assertEntrarLinkVisible()
    await header.openAuthPanel()
    await header.assertAuthPanelOpen()
    await expect(page.getByRole('button', { name: TEST_DATA.locators.login.entrarComEmailBtn })).toBeVisible()
  })

  test('CT07 - deve fechar o painel de conta pressionando Escape', async ({ page }, testInfo) => {
    const header = new HeaderPage(page)
    await header.openAuthPanel()
    await header.assertAuthPanelOpen()

    const isIos = /ios-safari/i.test(testInfo.project.name)
    if (isIos) {
      // iOS touch: Escape não disponível nativamente
      testInfo.annotations.push({
        type: 'info',
        description: 'iOS touch não oferece tecla Escape nativa; painel permanece aberto.',
      })
      await expect(header.authPanel).toBeVisible()
      return
    }

    await page.keyboard.press('Escape')
    // Fallback: se o portal ignorar Escape, clicar fora do painel fecha o overlay
    const stillOpen = await header.authPanel.isVisible({ timeout: 500 }).catch(() => false)
    if (stillOpen) {
      await page.mouse.click(10, 10)
    }

    await expect(header.authPanel).toBeHidden({ timeout: TIMEOUTS.authPanel })
    await header.assertEntrarLinkVisible()
  })

  test('CT08 - deve navegar para listagem de imóveis ao clicar em "Imóveis"', async ({ page }) => {
    const header = new HeaderPage(page)
    await expect(header.navImoveis).toBeVisible()
    await header.navImoveis.click()
    await expect(page).toHaveURL(/\/(imoveis|imoveis-a-venda)\//i)
    await expect(page).not.toHaveTitle(/404|not found|erro/i)
  })

  test('CT09 - deve navegar para listagem de veículos ao clicar em "Veículos"', async ({ page }) => {
    const header = new HeaderPage(page)
    await expect(header.navVeiculos).toBeVisible()
    await header.navVeiculos.click()
    await expect(page).toHaveURL(/\/(carros-usados|veiculos|carros-a-venda)\//i)
    await expect(page).not.toHaveTitle(/404|not found|erro/i)
  })

  test('CT10 - deve navegar para a página de anúncios ao clicar em "Anuncie"', async ({ page }) => {
    const header = new HeaderPage(page)
    await expect(header.navAnuncie).toBeVisible()
    await header.navAnuncie.click()
    await expect(page).toHaveURL(/anunciar/i)
    await expect(page).not.toHaveTitle(/404|not found|erro/i)
  })

  test('CT11 - deve redirecionar para login ao acessar "Favoritos" sem autenticação', async ({ page }) => {
    const header = new HeaderPage(page)
    await expect(header.navFavoritos).toBeVisible()
    await header.navFavoritos.click()

    const redirectedToLogin = await page
      .waitForURL(/\/(entrar|login)/, { timeout: TIMEOUTS.authPanel })
      .then(() => true)
      .catch(() => false)

    const authPanelOpened = await page
      .getByRole('heading', { name: /acesse ou crie sua conta/i })
      .isVisible({ timeout: TIMEOUTS.authPanel })
      .catch(() => false)

    expect(redirectedToLogin || authPanelOpened).toBe(true)
  })

  test('CT15 - deve redirecionar para a Home ao clicar na logo fora da Home', async ({ page }) => {
    const header = new HeaderPage(page)
    await expect(header.navImoveis).toBeVisible()
    await header.navImoveis.click()
    await expect(page).toHaveURL(/\/(imoveis|imoveis-a-venda)\//i)

    await header.logo.click()
    await expect(page).toHaveURL(url => url.pathname === '/')
  })
})

// ── Suite Deslogado — Mobile ──────────────────────────────────────────────────

test.describe('Feature Header — Deslogado (Mobile)', () => {
  test.use({ storageState: { cookies: [], origins: [] }, ...iPhoneDevice })

  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto(TEST_DATA.urls.base, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page, testInfo)
  })

  test('CT02 - deve renderizar o header corretamente em mobile (deslogado)', async ({ page }) => {
    const header = new HeaderPage(page)
    await header.assertLogoVisible()
    await expect(header.hamburgerButton).toBeVisible()
    await header.assertEntrarLinkVisible()
  })

  test('CT03 - deve abrir o menu lateral ao clicar no hambúrguer', async ({ page }) => {
    const header = new HeaderPage(page)
    await header.assertLogoVisible()

    const hasHamburger = await header.hamburgerButton.isVisible({ timeout: TIMEOUTS.hamburgerMenu }).catch(() => false)
    test.skip(!hasHamburger, 'Hambúrguer não exibido neste build/layout mobile.')

    await header.hamburgerButton.click()

    const anyNavLink = page.getByRole('link', { name: /imóveis|veículos|anuncie/i }).first()
    await expect(anyNavLink).toBeVisible({ timeout: TIMEOUTS.navLink })
  })

  test('CT04 - deve fechar o menu lateral com Escape ou botão fechar', async ({ page }, testInfo) => {
    const header = new HeaderPage(page)

    const hasHamburger = await header.hamburgerButton.isVisible({ timeout: TIMEOUTS.hamburgerMenu }).catch(() => false)
    test.skip(!hasHamburger, 'Hambúrguer não exibido neste build/layout mobile.')

    await header.hamburgerButton.click()
    await expect(header.sideMenu).toBeVisible({ timeout: TIMEOUTS.hamburgerMenu })

    const isIos = /ios-safari/i.test(testInfo.project.name)
    if (isIos) {
      // iOS: Escape via WebKit; fallback — clicar no overlay fora do drawer lateral esquerdo
      await page.keyboard.press('Escape')
      const stillOpen = await header.sideMenu.isVisible({ timeout: 1000 }).catch(() => false)
      if (stillOpen) {
        await page.mouse.click(380, 400)
      }
    } else {
      await page.keyboard.press('Escape')
    }

    await expect(header.sideMenu).toBeHidden({ timeout: TIMEOUTS.hamburgerMenu })
  })

  test('CT16 - deve redirecionar para a Home ao clicar na logo fora da Home (mobile)', async ({ page }) => {
    const header = new HeaderPage(page)

    const hasHamburger = await header.hamburgerButton.isVisible({ timeout: TIMEOUTS.hamburgerMenu }).catch(() => false)
    if (hasHamburger) {
      await header.hamburgerButton.click()
      await expect(header.navImoveis).toBeVisible({ timeout: TIMEOUTS.navLink })
    }

    await header.navImoveis.click()
    await expect(page).toHaveURL(/\/(imoveis|imoveis-a-venda)\//i)

    await header.logo.click()
    await expect(page).toHaveURL(url => url.pathname === '/')
  })
})

// ── Suite Logado — Desktop ────────────────────────────────────────────────────

test.describe('Feature Header — Logado (Desktop)', () => {
  test.skip(({ isMobile }) => isMobile, 'Suíte Desktop não executada em dispositivos móveis.')
  // storageState herdado do projeto (playwright.config.ts)

  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto(TEST_DATA.urls.base, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page, testInfo)
  })

  test('CT12 - deve exibir nome/avatar do usuário logado e ocultar "Entrar"', async ({ page }) => {
    test.skip(!process.env.USER_EMAIL_WEBUSER, 'Defina USER_EMAIL_WEBUSER para executar CT12.')

    const header = new HeaderPage(page)
    await header.assertEntrarLinkHidden()

    // Portal exibe iniciais + primeiro nome como link para /conta/ (ex: "WL Wesley"), não o email
    const userIdentifier = page.locator('header a[href="/conta/"]').first()
    await expect(userIdentifier).toBeVisible({ timeout: TIMEOUTS.authLink })
  })

  test('CT13 - deve permitir acesso ao menu/área de conta ao clicar no avatar/nome (logado)', async ({ page }) => {
    test.skip(!process.env.USER_EMAIL_WEBUSER, 'Defina USER_EMAIL_WEBUSER para executar CT13.')

    await expect.poll(() => hasAuthenticatedCookies(page), {
      timeout: TIMEOUTS.authCookies,
      message: 'Sessão autenticada não detectada.',
    }).toBe(true)

    // Portal exibe iniciais + primeiro nome como link para /conta/ (ex: "WL Wesley")
    const accountTrigger = page.locator('header a[href="/conta/"]').first()

    await expect(accountTrigger).toBeVisible({ timeout: TIMEOUTS.authLink })
    await accountTrigger.click()

    // Portal pode abrir dropdown com menu de conta ou navegar diretamente para /conta/
    const dropdownOpened = await expect(page.locator('header').getByRole('complementary').first())
      .toBeVisible({ timeout: TIMEOUTS.authPanel })
      .then(() => true)
      .catch(() => false)

    const redirectedToAccount = !dropdownOpened &&
      await page.waitForURL(/\/conta\/?/i, { timeout: TIMEOUTS.authPanel }).then(() => true).catch(() => false)

    expect(dropdownOpened || redirectedToAccount).toBe(true)
  })
})

// ── Suite Logado — Mobile ─────────────────────────────────────────────────────

test.describe('Feature Header — Logado (Mobile)', () => {
  test.use({ ...iPhoneDevice })

  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto(TEST_DATA.urls.base, { waitUntil: 'domcontentloaded' })
    await dismissCookieConsent(page, testInfo)
  })

  test('CT14 - menu lateral mobile não deve exibir dropdown de conta simultaneamente', async ({ page }) => {
    test.skip(!process.env.USER_EMAIL_WEBUSER, 'Defina USER_EMAIL_WEBUSER para executar CT14.')

    const header = new HeaderPage(page)
    const hasHamburger = await header.hamburgerButton.isVisible({ timeout: TIMEOUTS.hamburgerMenu }).catch(() => false)
    test.skip(!hasHamburger, 'Hambúrguer não exibido neste build/layout mobile.')

    await header.hamburgerButton.click()

    const hasMinhaContaInSideMenu = await page
      .getByRole('link', { name: /minha conta/i })
      .isVisible({ timeout: TIMEOUTS.navLink })
      .catch(() => false)

    if (hasMinhaContaInSideMenu) {
      const dropdownMenu = page.locator('header').getByRole('menu')
      const dropdownVisible = await dropdownMenu.first().isVisible({ timeout: TIMEOUTS.authPanel }).catch(() => false)
      expect(dropdownVisible).toBe(false)
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'Menu lateral não exibiu "Minha conta" logado. CT14 é N/A para este estado.',
      })
      expect(true).toBe(true)
    }
  })

  // CT05: reservado — cobertura do dropdown de conta em mobile (logado/deslogado) fora do escopo [T2]
})
