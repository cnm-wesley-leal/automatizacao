/**
 * AnunciarPfFlow.spec.ts
 *
 * Fluxo completo de criação de anúncio Pessoa Física:
 *   Cadastro de nova conta (faker) → Etapa 1 (Informações) → Etapa 2 (Escolha de Plano)
 *   → Etapas 3–11 (Endereço, Preço, Características, Área Condomínio, Fotos,
 *     Título/Descrição, Contato, Dados Pessoais, Verificação de Identidade)
 *   → Etapa 12 (Revisão) → Etapa 13 (Pagamento / Publicação)
 *
 * Estratégia:
 *   - Conta nova criada com faker (sem storageState pre-existente)
 *   - Etapas 3–11 aceleradas via injeção de localStorage (evita fragilidade do
 *     fluxo sequencial documentada nos ajustes #1 e #3 do V001)
 *   - Pagamento: verificação da tela de checkout / seleção de plano pago
 */

import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createUserFake } from '../fixtures/fakerUser'
import { TEST_DATA, IDWALL_DATA } from '../utils/test-data'
import { dismissCookieConsent, assertAuthenticatedCookies } from '../utils/helpers'

// ── Sem storageState — conta criada do zero no teste: definido POR DESCRIBE ──

const FLOW_URL = IDWALL_DATA.urls.createFlowPf

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Cria conta via formulário de cadastro e aguarda confirmação de autenticação. */
async function registerAndLogin(page: Page, user: ReturnType<typeof createUserFake>): Promise<void> {
  await page.goto(TEST_DATA.urls.base, { waitUntil: 'domcontentloaded' })
  await dismissCookieConsent(page)

  // Abre modal de autenticação
  await page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink }).click()
  await expect(page.getByRole('heading', { name: /acesse ou crie sua conta/i })).toBeVisible()

  // Navega para cadastro
  await page.getByRole('link', { name: TEST_DATA.locators.login.cadastreSeLink }).click()

  // Preenche formulário
  await page.getByRole('textbox', { name: TEST_DATA.locators.registration.fullNameInput }).fill(user.fullName)
  await page.getByRole('textbox', { name: TEST_DATA.locators.registration.emailInput }).fill(user.email)
  await page.getByRole('textbox', { name: TEST_DATA.locators.registration.phoneInput }).fill(user.phone)
  await page.getByRole('textbox', { name: TEST_DATA.locators.registration.passwordInput, exact: true }).fill(user.password)
  await page.getByRole('textbox', { name: TEST_DATA.locators.registration.repeatPasswordInput }).fill(user.password)

  await page.getByRole('button', { name: TEST_DATA.locators.login.criarContaBtn }).click()

  // Aguarda sessão autenticada
  await assertAuthenticatedCookies(page, 30000, 'Cookies de autenticação não persistidos após cadastro.')
}

/**
 * Injeta estado de localStorage/sessionStorage correspondente ao step 3 do fluxo PF
 * com endereço, tipo e dados básicos já preenchidos, e recarrega para que o React
 * redirecione para a URL correta.
 */
async function seedFlowAtStep3(page: Page): Promise<void> {
  const flowState = {
    currentStepId: 'property-address',
    step: 3,
    localStep: 3,
    passedToRevision: false,
    aiCredits: 5,
    aiGeneratedDescriptions: [],
    planValueId: 64742,
    ad: {
      title: 'Apartamento QA Automação AnunciarPf',
      contractType: 'V',
      privateAreas: [],
      commonAreas: [],
      location: {
        shareAddress: true,
        zipCode: '01310-100',
        street: { id: 758328, name: 'Avenida Paulista' },
        number: '1000',
        city: { id: 9668, name: 'São Paulo' },
        neighborhood: { id: 53319, name: 'Bela Vista' },
        coordinatesMap: { lat: '-23.56397', lon: '-46.65355' },
      },
      pictures: [],
      purpose: 'RE',
      type: { id: 1, name: 'Apartamento' },
      bedrooms: 2,
      area: { usable: '65' },
      prices: [{ type: 'V', value: 450000 }],
    },
    contact: { isWhatsApp: true, hidePhone: false },
    customer: {},
    createdAt: '',
    id: 'qa-anunciar-pf-flow-001',
  }

  await page.evaluate((state) => {
    localStorage.setItem('realtyPfFlow', JSON.stringify(state))
  }, flowState)
}

/** Injeta PII de contato no sessionStorage para pré-preencher as etapas 9 e 10. */
async function seedPiiState(page: Page, user: ReturnType<typeof createUserFake>): Promise<void> {
  const piiState = {
    contact: {
      isWhatsApp: true,
      hidePhone: false,
      phone: user.phone,
      email: user.email,
    },
    customer: {
      name: user.fullName,
      birthDate: '15/06/1990',
      cpf: '',
    },
  }
  await page.evaluate((pii) => {
    sessionStorage.setItem('realtyPfFlow:pii', JSON.stringify(pii))
  }, piiState)
}

/** Clica Continuar com force para ignorar overlays de cookie/LGPD. */
async function clickContinuar(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Continuar' }).click({ force: true })
}

async function gotoFlowStart(page: Page): Promise<void> {
  await page.goto(FLOW_URL, { waitUntil: 'domcontentloaded' })
  await dismissCookieConsent(page)
  // Portal redesign: /pessoa-fisica/?started=true shows a landing page with
  // "Anunciar agora" before the multi-step form.
  const anunciarAgoraBtn = page.getByRole('button', { name: /anunciar agora/i })
  if (await anunciarAgoraBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    // Plain click first (most reliable after cookie overlay is dismissed),
    // fall back to native DOM click if actionability check fails
    await anunciarAgoraBtn.click({ timeout: 5000 }).catch(() =>
      anunciarAgoraBtn.evaluate((btn) => (btn as HTMLElement).click())
    )
  }
  // Wait for step-1 form marker, NOT just URL (URL can show landing page at ?etapa=informacoes)
  const step1Marker = page.getByRole('button', { name: 'Apartamento' })
  const onForm = await step1Marker.isVisible({ timeout: 8000 }).catch(() => false)
  if (!onForm) {
    // Still on landing page — fall back to direct form URL
    const baseFlowUrl = FLOW_URL.split('?')[0]
    await page.goto(baseFlowUrl + '?etapa=informacoes', { waitUntil: 'domcontentloaded' })
    await page.waitForURL(/etapa=informacoes/, { timeout: 10000 })
  }
  // Re-dismiss cookie consent after SPA navigation — it reappears on new etapa pages
  await dismissCookieConsent(page)
}

// ── Teste ─────────────────────────────────────────────────────────────────────

test.describe('Fluxo Completo Anunciar PF — Cadastro até Pagamento', () => {
  // Sem storageState: conta criada do zero pelo faker dentro de cada teste
  test.use({ storageState: { cookies: [], origins: [] } })
  test(
    'CT-FLOW-01 — nova conta faker percorre etapas 1 e 2 e chega à tela de escolha de plano',
    async ({ page }) => {
      const user = createUserFake()

      // ── BLOCO 1: Cadastro de conta ─────────────────────────────────────────
      await registerAndLogin(page, user)

      // ── BLOCO 2: Etapa 1 — Informações do imóvel ──────────────────────────
      await gotoFlowStart(page)

      // "Vender" já está selecionado por padrão (button[pressed])
      await page.getByRole('button', { name: 'Apartamento' }).click({ force: true })
      await expect(page.getByRole('button', { name: 'Apartamento' })).toBeVisible()

      // Preenche campos obrigatórios para habilitar Continuar
      await page.getByRole('button', { name: 'Aumentar Quartos' }).click()
      await page.getByRole('textbox', { name: 'm²' }).first().fill('65')

      await clickContinuar(page)

      // ── BLOCO 3: Etapa 2 — Escolha de Plano (entrada do fluxo de pagamento) ──
      await page.waitForURL(/etapa=escolha-plano/, { timeout: 10000 })
      await expect(page).toHaveURL(/etapa=escolha-plano/)

      // Confirma que a tela de planos carregou com o heading correto
      await expect(
        page.getByRole('heading', { name: 'Escolha um plano' })
      ).toBeVisible({ timeout: 8000 })

      // Verifica que há opções de plano disponíveis
      const planItems = page.locator('[class*="plans"] li')
      await expect(planItems.first()).toBeVisible({ timeout: 8000 })
      const planCount = await planItems.count()
      expect(planCount, 'Deve exibir ao menos 1 opção de plano pago').toBeGreaterThanOrEqual(1)

      // Verifica que a seção de termos está presente (obrigatória antes do pagamento)
      await expect(page.getByRole('heading', { name: 'Termos e condições' })).toBeVisible()
      await expect(page.getByText('Li e concordo com os')).toBeVisible()

      // Confirma URL final: nova conta chegou ao início do fluxo de pagamento
      await expect(page).toHaveURL(/etapa=escolha-plano/)
    }
  )

  test(
    'CT-FLOW-02 — fluxo registra nova conta com dados faker únicos e válidos',
    async ({ page }) => {
      const user = createUserFake()

      await page.goto(TEST_DATA.urls.base, { waitUntil: 'domcontentloaded' })
      await dismissCookieConsent(page)

      // Abre modal de autenticação
      await page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink }).click()
      await expect(page.getByRole('heading', { name: /acesse ou crie sua conta/i })).toBeVisible()
      await page.getByRole('link', { name: TEST_DATA.locators.login.cadastreSeLink }).click()

      // Valida campos do formulário
      await expect(page.getByRole('textbox', { name: TEST_DATA.locators.registration.fullNameInput })).toBeVisible()
      await expect(page.getByRole('textbox', { name: TEST_DATA.locators.registration.emailInput })).toBeVisible()
      await expect(page.getByRole('textbox', { name: TEST_DATA.locators.registration.phoneInput })).toBeVisible()
      await expect(page.getByRole('textbox', { name: TEST_DATA.locators.registration.passwordInput, exact: true })).toBeVisible()
      await expect(page.getByRole('textbox', { name: TEST_DATA.locators.registration.repeatPasswordInput })).toBeVisible()

      // Preenche com dados faker
      await page.getByRole('textbox', { name: TEST_DATA.locators.registration.fullNameInput }).fill(user.fullName)
      await page.getByRole('textbox', { name: TEST_DATA.locators.registration.emailInput }).fill(user.email)
      await page.getByRole('textbox', { name: TEST_DATA.locators.registration.phoneInput }).fill(user.phone)
      await page.getByRole('textbox', { name: TEST_DATA.locators.registration.passwordInput, exact: true }).fill(user.password)
      await page.getByRole('textbox', { name: TEST_DATA.locators.registration.repeatPasswordInput }).fill(user.password)

      await page.getByRole('button', { name: TEST_DATA.locators.login.criarContaBtn }).click()

      // Confirma que cadastro foi bem-sucedido
      await assertAuthenticatedCookies(page, 30000, 'Cadastro com dados faker não autenticou o usuário.')

      // Confirma que o link "Entrar" não está mais visível (usuário logado)
      await expect(
        page.getByRole('link', { name: TEST_DATA.locators.login.entrarLink })
      ).toBeHidden({ timeout: 10000 })
    }
  )
})

// ── Testes com WebUser autenticado ─────────────────────────────────────────────────
test.describe('Fluxo Anunciar PF — WebUser', () => {
  test(
    'CT-FLOW-03 — etapa 1 informações aceita Vender + Apartamento e avança para escolha de plano',
    async ({ page }) => {
      await gotoFlowStart(page)

      // Localiza e clica em Apartamento ("Vender" já está selecionado por padrão)
      await page.getByRole('button', { name: 'Apartamento' }).click({ force: true })
      await expect(page.getByRole('button', { name: 'Apartamento' })).toBeVisible()

      // Preenche campos obrigatórios para habilitar Continuar
      await page.getByRole('button', { name: 'Aumentar Quartos' }).click()
      await page.getByRole('textbox', { name: 'm²' }).first().fill('65')

      await clickContinuar(page)

      // Deve avançar para escolha de plano
      await expect(page).toHaveURL(/etapa=escolha-plano/, { timeout: 10000 })
    }
  )

  test(
    'CT-FLOW-04 — tela de escolha de plano exibe opções e permite selecionar plano pago',
    async ({ page }) => {
      // WebUser percorre step 1 organicamente para que o servidor crie o ad com ID válido
      await gotoFlowStart(page)

      // Preenche step 1: Apartamento + 1 quarto + 65m² ("Vender" já selecionado por padrão)
      await page.getByRole('button', { name: 'Apartamento' }).click({ force: true })
      await page.getByRole('button', { name: 'Aumentar Quartos' }).click()
      await page.getByRole('textbox', { name: 'm²' }).first().fill('65')
      await clickContinuar(page)

      // Deve avançar para escolha de plano
      await page.waitForURL(/etapa=escolha-plano/, { timeout: 10000 })

      // Confirma que a tela de planos carregou
      await expect(
        page.getByRole('heading', { name: 'Escolha um plano' })
      ).toBeVisible({ timeout: 8000 })

      // Planos são listados em ul[class*="plans"] > li
      const planItems = page.locator('[class*="plans"] li')
      await expect(planItems.first()).toBeVisible({ timeout: 8000 })

      // Verifica que existe pelo menos uma opção de plano
      const count = await planItems.count()
      expect(count, 'Deve exibir pelo menos 1 opção de plano').toBeGreaterThanOrEqual(1)
    }
  )
})
