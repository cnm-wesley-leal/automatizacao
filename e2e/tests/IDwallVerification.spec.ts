import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { IDWALL_DATA } from '../utils/test-data'
import { dismissCookieConsent } from '../utils/helpers'

const D = IDWALL_DATA
const FLOW_URL = D.urls.createFlowPf
const BASE_FLOW_URL = FLOW_URL.split('?')[0]

// Run all IDwall tests serially: they share WebUser's server-side ad state and
// parallel workers cause ERR_NETWORK_IO_SUSPENDED + race conditions on ad steps.
test.describe.configure({ mode: 'serial' })

// ── Flow state seed (steps 1–2 complete, entering step 3) ────────────────────
// currentStepId 'property-address' is confirmed working from QA exploration.
const STEP3_FLOW_STATE = {
  currentStepId: 'property-address',
  step: 3,
  localStep: 3,
  passedToRevision: false,
  aiCredits: 5,
  aiGeneratedDescriptions: [] as unknown[],
  planValueId: 64742,
  ad: {
    title: 'Apartamento QA Automação IDwall',
    contractType: 'V',
    privateAreas: [] as unknown[],
    commonAreas: [] as unknown[],
    location: {
      shareAddress: true,
      zipCode: '01310-100',
      street: { id: 758328, name: 'Avenida Paulista' },
      number: '1000',
      city: { id: 9668, name: 'São Paulo' },
      neighborhood: { id: 53319, name: 'Bela Vista' },
      coordinatesMap: { lat: '-23.56397', lon: '-46.65355' },
    },
    pictures: [] as unknown[],
    purpose: 'RE',
    type: { id: 1, name: 'Apartamento' },
    bedrooms: 1,
    area: { usable: '50' },
    prices: [{ type: 'V', value: 500000 }],
  },
  contact: { isWhatsApp: true, hidePhone: false },
  customer: {},
  createdAt: '',
  id: 'qa-idwall-test-flow-001',
}

// PII stored in sessionStorage (phone, email, CPF, birthDate of the PF test user)
const STEP3_PII_STATE = {
  contact: {
    isWhatsApp: true,
    hidePhone: false,
    phone: '(11) 99999-9999',
    email: process.env.SSR_USER_EMAIL_PF ?? 'qa.pf@chavesnamao.com.br',
  },
  customer: {
    name: 'QA Automação PF',
    birthDate: '15/06/1990',
    // 111.111.111-11 is invalid (repeated digits); for valid tests the PF user's CPF is used
    cpf: process.env.SSR_USER_CPF_PF ?? '102.385.119-95',
  },
}

// ── Local helpers ─────────────────────────────────────────────────────────────

async function seedFlowAtStep3(page: Page): Promise<void> {
  await page.evaluate(
    ([flow, pii]) => {
      localStorage.setItem('realtyPfFlow', JSON.stringify(flow))
      sessionStorage.setItem('realtyPfFlow:pii', JSON.stringify(pii))
    },
    [STEP3_FLOW_STATE, STEP3_PII_STATE] as const
  )
}

async function clickContinuar(page: Page): Promise<void> {
  // force:true ignores the cookie/LGPD consent overlay (style_Consent__VSP72) that
  // intercepts pointer events between navigations in QA environment
  await page.getByRole('button', { name: D.locators.continuarBtn }).click({ force: true })
}

/** Click consent checkbox/label on the identity-verification step.
 * The input is visually hidden via CSS. Clicking via getByRole or label.click() both fail
 * when the cookie overlay is present. Use JS evaluate to trigger the click natively.
 */
async function acceptConsent(page: Page): Promise<void> {
  // Prefer clicking the label (which is visible and acts as the proxy for the hidden input)
  const label = page.locator('label').filter({ hasText: D.locators.consentCheckboxText })
  if (await label.isVisible({ timeout: 2000 }).catch(() => false)) {
    await label.click()
    return
  }
  // Fallback: the input is hidden via CSS — fire click natively via JS evaluation
  // This is required because click({ force: true }) fails for elements outside the viewport
  const checkbox = page.locator('input#identity-verification-consent, input[type="checkbox"]').first()
  await checkbox.evaluate((el) => (el as HTMLInputElement).click())
}

/**
 * Navigate from FLOW_URL through to Etapa 10 (dados-pessoais).
 *
 * Strategy:
 *   1. Navigate to FLOW_URL (landing page). Retry once on transient network error.
 *   2. Dismiss cookie consent and click "Anunciar agora" CTA.
 *   3. Wait for any etapa= URL to settle; detect which step WebUser landed on.
 *      - Fast path A: already at dados-pessoais → return.
 *      - Fast path B: at verificacao-identidade (step 11) → click Voltar to step 10.
 *   4. If at step 1 (property type form visible): fill minimally → advance to step 2.
 *   5. At step 2 (escolha-plano): capture real ad ID, seed localStorage/sessionStorage
 *      for step 3 (address), reload → app routes to etapa=informacoes.
 *   6. Loop through steps 3–9 clicking Continuar at each step, filling required fields
 *      for etapa=preco and etapa=titulo-e-descricao.
 *   7. Assert arrival at etapa=dados-pessoais.
 *
 * PII (phone, email, CPF, birthDate) is seeded in sessionStorage so that the contato
 * and dados-pessoais forms are pre-populated, allowing Continuar to be enabled.
 */
async function gotoPersonalDataStep(page: Page): Promise<void> {
  // Navigate to the flow, retrying once on transient network suspension
  const gotoFlow = () => page.goto(FLOW_URL, { waitUntil: 'domcontentloaded' })
  await gotoFlow().catch(async (err: Error) => {
    if (/net::/.test(err.message)) {
      await page.waitForTimeout(2000)
      return gotoFlow()
    }
    throw err
  })
  await dismissCookieConsent(page)

  // Seed PII early so contato (step 9) and dados-pessoais (step 10) forms are pre-filled
  // regardless of which navigation branch we take below.
  await page.evaluate((pii) => {
    sessionStorage.setItem('realtyPfFlow:pii', JSON.stringify(pii))
  }, STEP3_PII_STATE)

  // Click "Anunciar agora" CTA if on landing page
  const anunciarBtn = page.getByRole('button', { name: /anunciar agora/i })
  if (await anunciarBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await anunciarBtn.click({ timeout: 5000 }).catch(() =>
      anunciarBtn.evaluate((el) => (el as HTMLElement).click())
    )
  }

  // After clicking "Anunciar agora", the URL MAY or MAY NOT change (the SPA can show
  // the form inline at the same URL). Wait for EITHER a URL with etapa= OR the step-1
  // form marker (Apartamento button) to appear, whichever comes first.
  const step1Marker = page.getByRole('button', { name: 'Apartamento' })
  await Promise.race([
    page.waitForURL(/etapa=/, { timeout: 12000 }).catch(() => {}),
    step1Marker.waitFor({ state: 'visible', timeout: 12000 }).catch(() => {}),
  ])
  await dismissCookieConsent(page)

  let url = page.url()

  // If still at the landing page (neither URL change nor form appeared), force to step 1
  if (!/etapa=/.test(url) && !(await step1Marker.isVisible({ timeout: 500 }).catch(() => false))) {
    await page.goto(BASE_FLOW_URL + '?etapa=informacoes', { waitUntil: 'domcontentloaded' }).catch(() => {})
    await page.waitForURL(/etapa=/, { timeout: 10000 }).catch(() => {})
    await dismissCookieConsent(page)
    url = page.url()
  }

  // Recovery: URL says etapa=informacoes but the SPA redirected to landing page
  // (step1Marker not visible). Force a fresh direct navigation.
  if (/etapa=informacoes/.test(url) && !(await step1Marker.isVisible({ timeout: 2000 }).catch(() => false))) {
    await page.goto(BASE_FLOW_URL + '?etapa=informacoes', { waitUntil: 'domcontentloaded' }).catch(() => {})
    await step1Marker.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
    await dismissCookieConsent(page)
    url = page.url()
  }

  // ── Fast path A: already at dados-pessoais ───────────────────────────────
  if (/etapa=dados-pessoais/.test(url)) return

  // ── Fast path B: past dados-pessoais → click Voltar ─────────────────────
  if (/etapa=verificacao-identidade/.test(url)) {
    const voltarBtn = page.getByRole('button', { name: /voltar/i })
    if (await voltarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await voltarBtn.click()
      await page.waitForURL(/etapa=dados-pessoais/, { timeout: 10000 }).catch(() => {})
    }
    if (/etapa=dados-pessoais/.test(page.url())) return
    url = page.url()
  }

  // ── Step 1 (informacoes): "Apartamento" button visible ───────────────────
  // Only enter this block if the form is ACTUALLY rendered (marker visible on screen).
  // URL alone is not reliable — SPA may redirect back to landing page at the same URL.
  if (await step1Marker.isVisible({ timeout: 5000 }).catch(() => false)) {
    await dismissCookieConsent(page)
    await step1Marker.click({ force: true }).catch(() => {})
    if (await page.getByText(/^\s*0\s*$/).first().isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.getByRole('button', { name: /aumentar quartos/i }).click()
    }
    const areaInput = page.getByRole('textbox', { name: /m²/i }).first()
    if (await areaInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      if (!(await areaInput.inputValue().catch(() => '')).trim()) await areaInput.fill('50')
    }
    await clickContinuar(page)
    await page.waitForURL(/etapa=escolha-plano/, { timeout: 12000 }).catch(() => {})
    url = page.url()
  }

  // ── Step 2 (escolha-plano) → select a plan to advance server state ───────
  // Cannot skip this step via localStorage injection: the server always re-routes
  // back to escolha-plano until a plan is actually selected via the UI.
  if (/etapa=escolha-plano/.test(url)) {
    // Preserve the real ad ID before navigating away
    const rawFlow = await page.evaluate(() => localStorage.getItem('realtyPfFlow'))
    let realAdId: string | null = null
    try {
      realAdId = rawFlow ? (JSON.parse(rawFlow) as { id?: string }).id ?? null : null
    } catch {}

    // Wait for plan cards to render
    const planItems = page.locator('[class*="plans"] li, [class*="plan"] li, ul li').filter({
      has: page.getByRole('button'),
    })
    await planItems.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})

    // Prefer a free/gratuito plan; otherwise click the first listed plan
    const freePlan = planItems.filter({ hasText: /grat|free|sem custo|\bR\$\s*0/i }).first()
    const hasFreePlan = await freePlan.count().then((c) => c > 0).catch(() => false)
    await (hasFreePlan ? freePlan : planItems.first()).click({ force: true }).catch(() => {})

    // Accept terms ("Li e concordo com os ...")
    const termsLabel = page.getByText(/li e concordo/i).first()
    if (await termsLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await termsLabel.click({ force: true }).catch(() => {})
    } else {
      // Fallback: check the first checkbox on the page
      const cb = page.locator('input[type="checkbox"]').first()
      if (await cb.isVisible({ timeout: 1000 }).catch(() => false)) {
        const checked = await cb.isChecked().catch(() => false)
        if (!checked) await cb.click({ force: true }).catch(() => {})
      }
    }

    // Submit — button label varies by plan type (Continuar / Publicar / Contratar)
    const submitBtn = page
      .getByRole('button', { name: /continuar|publicar|contratar|selecionar plano/i })
      .first()
    await submitBtn.click({ force: true }).catch(() => {})
    await page
      .waitForURL((u) => /etapa=/.test(u.href) && !/escolha-plano/.test(u.href), { timeout: 15000 })
      .catch(() => {})
    await dismissCookieConsent(page)

    // Seed step-3 localStorage so subsequent steps use pre-filled address/prices
    const step3State = { ...STEP3_FLOW_STATE }
    if (realAdId) step3State.id = realAdId
    await page.evaluate(
      ([flow, pii]) => {
        localStorage.setItem('realtyPfFlow', JSON.stringify(flow))
        sessionStorage.setItem('realtyPfFlow:pii', JSON.stringify(pii))
      },
      [step3State, STEP3_PII_STATE] as const
    )
    url = page.url()
  }

  // ── Steps 3–9: advance step-by-step until dados-pessoais ─────────────────
  for (let i = 0; i < 14; i++) {
    url = page.url()
    if (/etapa=dados-pessoais/.test(url)) break
    if (/etapa=verificacao-identidade|etapa=revisao/.test(url)) break
    // Bail out if still/again at step 1 or 2 — cannot advance without user interaction
    if (/etapa=escolha-plano|etapa=informacoes/.test(url)) break

    if (/etapa=preco/.test(url)) {
      const priceInput = page.getByRole('spinbutton').first().or(
        page.locator('input[inputmode="numeric"], input[inputmode="decimal"]').first()
      )
      const priceVal = await priceInput.inputValue().catch(() => '')
      if (!priceVal.trim()) {
        await priceInput.click()
        await priceInput.pressSequentially('500000', { delay: 40 })
        await page.waitForTimeout(800)
      }
    }

    if (/etapa=titulo-e-descricao/.test(url)) {
      const descArea = page.getByRole('textbox', { name: /descrição|description/i }).or(
        page.locator('textarea').last()
      )
      const descValue = await descArea.inputValue().catch(() => '')
      if (!descValue.trim()) {
        await descArea.fill(
          'Apartamento bem localizado na Avenida Paulista. Anúncio criado por automação de testes QA para validar integração IDwall.'
        )
      }
    }

    // Guard: skip clickContinuar if the button is not present on this step
    const continuarVisible = await page
      .getByRole('button', { name: D.locators.continuarBtn })
      .isVisible({ timeout: 3000 })
      .catch(() => false)
    if (!continuarVisible) {
      await page.waitForTimeout(1000)
      continue
    }

    const prevStep = url.match(/etapa=([^&?#]+)/)?.[1] ?? ''
    await clickContinuar(page)

    if (prevStep) {
      await page.waitForFunction(
        (step: string) => !window.location.href.includes('etapa=' + step),
        prevStep,
        { timeout: 10000 }
      ).catch(() => {})
    } else {
      await page.waitForTimeout(2000)
    }
  }

  await page.waitForURL(/etapa=dados-pessoais/, { timeout: 15000 })
}

/**
 * Navigate all the way to Etapa 11 (verificacao-identidade).
 * Builds on gotoPersonalDataStep and fills the personal CEP.
 */
async function gotoVerificationStep(page: Page): Promise<void> {
  await gotoPersonalDataStep(page)

  // Step 10 (Dados pessoais) — fill personal CEP only if the field is editable.
  // For WebUser (Wesley), the personal CEP is already saved and the input is disabled.
  // In that case we skip directly to Continuar (form is already valid).
  const cepInput = page.locator('input[placeholder="00000-000"]').first()
  const cepEditable = await cepInput.isEditable({ timeout: 3000 }).catch(() => false)
  if (cepEditable) {
    await cepInput.clear()
    await cepInput.type('01310100', { delay: 80 })
    // Wait for CEP lookup API to respond and populate address fields
    await page.waitForTimeout(2500)
  }
  await clickContinuar(page)

  // Step 11 (Verificação de identidade)
  await page.waitForURL(/etapa=verificacao-identidade/, { timeout: 15000 })
}

// ── Test suite ────────────────────────────────────────────────────────────────

test.describe('Verificação de Identidade IDwall — Jornada Anuncie PF', () => {
  // ── 1. Dados Pessoais (Etapa 10) — validações de formulário ──────────────

  test('CT03 - dados pessoais válidos com CEP pessoal avançam para verificacao-identidade', async ({ page }) => {
    await gotoPersonalDataStep(page)
    const cepInput = page.locator('input[placeholder="00000-000"]').first()
    await cepInput.type('01310100', { delay: 80 })
    await page.waitForTimeout(1500)
    await clickContinuar(page)
    await expect(page).toHaveURL(/etapa=verificacao-identidade/, { timeout: 10000 })
  })

  test('CT04 - CPF com dígitos repetidos exibe mensagem de validação', async ({ page }) => {
    // GAP DE UX: o campo CPF é disabled para WebUser (já preenchido e bloqueado).
    // Validação de CPF inválido não é testável para este usuário.
    // Remover test.fail() após criar usuário sem CPF cadastrado ou expor rota de edição.
    test.fail(true, '[GAP-UX] Campo CPF está disabled para WebUser — validação não testável')
    await gotoPersonalDataStep(page)
    const cpfInput = page.locator('input[placeholder*="CPF"], input[name*="cpf"], input[id*="cpf"]').first()
    await cpfInput.clear()
    await cpfInput.type('111.111.111-11', { delay: 60 })
    await cpfInput.blur()
    await expect(page.getByText(/CPF inválido|CPF não é válido|CPF incorreto/i)).toBeVisible({
      timeout: 5000,
    })
  })

  test('CT05 - data de nascimento futura exibe mensagem de validação', async ({ page }) => {
    // GAP: campo birthDate está disabled para WebUser E o app não valida datas futuras.
    // Dois gaps acumulados: campo não editável + sem mensagem de validação de data futura.
    test.fail(true, '[GAP-UX] Campo birthDate disabled para WebUser; app não valida data futura')
    await gotoPersonalDataStep(page)
    const birthInput = page
      .locator('input[placeholder*="DD/MM/AAAA"]')
      .or(page.locator('input[name*="birth"], input[id*="birth"]').first())
    await birthInput.clear()
    await birthInput.type('01/01/2030', { delay: 60 })
    await birthInput.blur()
    await expect(
      page.getByText(/data inválida|não pode ser futura|data de nascimento inválida/i)
    ).toBeVisible({ timeout: 5000 })
  })

  test('CT27 - ausência de CEP pessoal bloqueia avanço em dados-pessoais', async ({ page }) => {
    await gotoPersonalDataStep(page)
    // Do NOT fill CEP; attempt to advance
    await clickContinuar(page)
    // Should stay on dados-pessoais (URL unchanged)
    await expect(page).toHaveURL(/etapa=dados-pessoais/, { timeout: 5000 })
  })

  // ── 2. Tela de Verificação de Identidade (Etapa 11) — UI ─────────────────

  test('CT06 - tela de verificação exibe título, instruções, checkbox e botão desabilitado', async ({ page }) => {
    await gotoVerificationStep(page)

    // Heading real da tela
    await expect(
      page.getByRole('heading', { name: /quem compra também quer saber com quem está negociando/i })
    ).toBeVisible()

    // Consent checkbox — o input é visualmente oculto via CSS (style_checkboxInput__wnnFA).
    // Valida a presença no DOM (attached) e que a label associada está visível.
    const checkbox = page.locator('input#identity-verification-consent')
    await expect(checkbox).toBeAttached()
    await expect(checkbox).not.toBeChecked()
    const consentLabel = page.locator('label[for="identity-verification-consent"], label').filter({
      has: checkbox,
    })
    // Se não houver label aninhado, verifica pelo container visual do consentimento
    const consentContainer = page.locator('[class*="consent"], [class*="Consent"], [class*="checkbox"]').first()
    await expect(consentContainer).toBeVisible({ timeout: 5000 })

    // "Tirar foto" button — disabled até consentimento aceito
    const photoBtn = page.getByRole('button', { name: D.locators.photoBtn })
    await expect(photoBtn).toBeVisible()
    await expect(photoBtn).toBeDisabled()
  })

  test('CT07 - marcar checkbox de consentimento habilita o botão "Tirar foto agora"', async ({ page }) => {
    await gotoVerificationStep(page)
    const photoBtn = page.getByRole('button', { name: D.locators.photoBtn })

    // Aceita consentimento via JS evaluate (input é visualmente oculto)
    await acceptConsent(page)

    await expect(photoBtn).toBeEnabled({ timeout: 5000 })
  })

  test('CT08 - clique em "Tirar foto agora" dispara POST /account/identity-verification/start', async ({
    page,
  }) => {
    let requestCaptured = false

    await page.route(D.api.identityStart, async (route) => {
      requestCaptured = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token_sdk: 'mock-sdk-token-qa-ct08',
          protocolo: 'mock-protocol-qa-ct08',
        }),
      })
    })

    await gotoVerificationStep(page)
    await acceptConsent(page)
    await page.getByRole('button', { name: D.locators.photoBtn }).click()

    await expect.poll(() => requestCaptured, { timeout: 8000 }).toBe(true)
  })

  // ── 3. Respostas de Verificação (mockadas) ────────────────────────────────

  test('CT09 - status VALID da verificação habilita botão Continuar para Etapa 12', async ({ page }) => {
    // ACHADO DE ARQUITETURA: o app usa callback nativo do SDK IDwall para habilitar Continuar.
    // Mock de /start retornando VALID não tem efeito no estado do botão — o SDK é quem notifica.
    // Remover test.fail() após confirmar mecanismo de callback ou usar SDK sandbox real.
    test.fail(true, '[ARCH] Continuar não habilitado via mock de /start com status VALID — app usa SDK callback')
    await page.route(D.api.identityStart, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token_sdk: 'mock-sdk-valid',
          protocolo: 'mock-protocol-valid',
          status: 'VALID',
        }),
      })
    )
    await page.route(D.api.identityStatus, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'VALID', protocolo: 'mock-protocol-valid' }),
      })
    )

    await gotoVerificationStep(page)
    await acceptConsent(page)
    await page.getByRole('button', { name: D.locators.photoBtn }).click()

    // After VALID result the app should enable the "Continuar" button or auto-advance
    await expect(page.getByRole('button', { name: D.locators.continuarBtn })).toBeEnabled({
      timeout: 15000,
    })
  })

  test('CT10 - status INVALID bloqueia fluxo e exibe mensagem de verificação reprovada', async ({ page }) => {
    // ACHADO DE ARQUITETURA: mock de /start com INVALID não altera estado da UI.
    // O app usa SDK callback nativo para processar resultado da biometria.
    test.fail(true, '[ARCH] App não exibe mensagem INVALID via mock REST — usa SDK callback')
    await page.route(D.api.identityStart, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token_sdk: 'mock-sdk-invalid',
          protocolo: 'mock-protocol-invalid',
          status: 'INVALID',
        }),
      })
    )
    await page.route(D.api.identityStatus, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'INVALID', protocolo: 'mock-protocol-invalid' }),
      })
    )

    await gotoVerificationStep(page)
    await acceptConsent(page)
    await page.getByRole('button', { name: D.locators.photoBtn }).click()

    await expect(
      page.getByText(/verificação reprovada|identidade não verificada|não foi possível verificar/i)
    ).toBeVisible({ timeout: 15000 })
  })

  test('CT11 - status MANUAL_APPROVAL exibe estado "em análise" e preserva fluxo', async ({ page }) => {
    // ACHADO DE ARQUITETURA: mock de /start com MANUAL_APPROVAL não altera estado da UI.
    test.fail(true, '[ARCH] App não exibe estado em análise via mock REST — usa SDK callback')
    await page.route(D.api.identityStart, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token_sdk: 'mock-sdk-manual',
          protocolo: 'mock-protocol-manual',
          status: 'MANUAL_APPROVAL',
        }),
      })
    )
    await page.route(D.api.identityStatus, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'MANUAL_APPROVAL', protocolo: 'mock-protocol-manual' }),
      })
    )

    await gotoVerificationStep(page)
    await acceptConsent(page)
    await page.getByRole('button', { name: D.locators.photoBtn }).click()

    await expect(
      page.getByText(/em análise|aguardando aprovação|análise manual/i)
    ).toBeVisible({ timeout: 15000 })
  })

  // ── 4. Guardas de Fluxo ───────────────────────────────────────────────────

  test('CT25 - acesso direto à URL verificacao-identidade sem estado de fluxo redireciona', async ({
    page,
  }) => {
    // Clear any flow state from prior tests (full-suite context: IDwall tests that ran
    // before this one may have left the WebUser at step 11 in localStorage + server state).
    await page.goto(FLOW_URL, { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => {
      localStorage.removeItem('realtyPfFlow')
      sessionStorage.removeItem('realtyPfFlow:pii')
    })

    // Navigate directly to verification step with no flow state in localStorage
    await page.goto(`${BASE_FLOW_URL}${D.urls.steps.verificacaoIdentidade}`, {
      waitUntil: 'domcontentloaded',
    })
    await dismissCookieConsent(page)

    // App should redirect away from the identity step
    await expect(page).not.toHaveURL(/etapa=verificacao-identidade/, { timeout: 10000 })
  })

  test('CT26 - abandono e retorno ao fluxo preserva estado da verificação', async ({ page }) => {
    // Set up identity step state then navigate away and back.
    // The app should read localStorage (updated to step 11 by navigating there)
    // and restore the verification step when the user returns to the flow URL.
    await gotoVerificationStep(page)
    const urlBeforeLeave = page.url()

    // Navigate away — localStorage is preserved within the same browser origin
    await page.goto('https://qa.chavesnamao.com.br/', { waitUntil: 'domcontentloaded' })
    await expect(page).not.toHaveURL(/etapa=verificacao-identidade/)

    // Return to the flow — app reads localStorage and should restore step 11
    await page.goto(urlBeforeLeave, { waitUntil: 'domcontentloaded' })

    // Verification step should be restored (not reset to step 1)
    await expect(page).toHaveURL(/etapa=verificacao-identidade/, { timeout: 15000 })
  })
})

// ── 5. Contrato de API (mockado) ──────────────────────────────────────────────
// Valida o comportamento do front-end diante das respostas da API IDwall.
// Os mocks substituem o endpoint real via page.route(), mantendo os testes
// isolados e sem depender de credenciais ou quotas da IDwall.

test.describe('IDwall — Contrato de API (mockado)', () => {
  // 1 retry por inerente flakiness de ambiente QA (navegação seq. de 10 etapas ao vivo)
  // CT31 é gerenciado em describe separado sem retries para evitar conflito com test.fail()
  test.describe.configure({ retries: 1 })
  test('CT28 - 401 no /start exibe estado de erro de autenticação na tela', async ({ page }) => {
    // GAP DE UX: a aplicação não exibe mensagem de erro visível para 401.
    // Remover test.fail() após implementar feedback de erro para sessão inválida.
    test.fail(true, '[GAP-UI] Retorno 401 de /start não gera mensagem de erro visível ao usuário')

    await gotoVerificationStep(page)
    await acceptConsent(page)

    await page.route(D.api.identityStart, (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Unauthorized' }),
      })
    )

    await page.getByRole('button', { name: D.locators.photoBtn }).click()

    await expect(
      page.getByText(/erro|sessão expirada|não autorizado|tente novamente/i)
    ).toBeVisible({ timeout: 10000 })
  })

  test('CT29 - 400 com dados inválidos no /start exibe mensagem de erro ao usuário', async ({ page }) => {
    // GAP DE UX: a aplicação não exibe mensagem de erro visível para 400.
    // Remover test.fail() após implementar feedback de validação para CPF inválido.
    test.fail(true, '[GAP-UI] Retorno 400 de /start não gera mensagem de erro visível ao usuário')

    await gotoVerificationStep(page)
    await acceptConsent(page)

    await page.route(D.api.identityStart, (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'CPF inválido', code: 'INVALID_CPF' }),
      })
    )

    await page.getByRole('button', { name: D.locators.photoBtn }).click()

    await expect(
      page.getByText(/CPF inválido|dados incorretos|erro nos dados|verifique seus dados/i)
    ).toBeVisible({ timeout: 10000 })
  })

  test('CT30 - /start retorna protocolo e token SDK não fica exposto no DOM visível', async ({ page }) => {
    const mockSdkToken = 'mock-sdk-token-ct30-secret-value'

    await page.route(D.api.identityStart, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token_sdk: mockSdkToken, protocolo: 'proto-ct30' }),
      })
    )

    await gotoVerificationStep(page)
    await acceptConsent(page)
    await page.getByRole('button', { name: D.locators.photoBtn }).click()
    await page.waitForTimeout(2000)

    // O token SDK não deve aparecer como texto visível na página
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toContain(mockSdkToken)
  })

  test('CT31 - polling EM_ANALISE → APPROVED habilita botão Continuar após aprovação', async ({ page }) => {
    // ACHADO DE ARQUITETURA: o app não habilita Continuar via polling de /status REST.
    // Provavelmente usa callback nativo do SDK IDwall (não polling HTTP direto).
    // Remover test.fail() após confirmar mecanismo de callback ou usar SDK sandbox real.
    test.fail(true, '[ARCH] Continuar não é habilitado por polling de /status — app usa SDK callback')

    await gotoVerificationStep(page)

    let statusCallCount = 0

    await page.route(D.api.identityStart, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token_sdk: 'mock-sdk-poll', protocolo: 'proto-poll' }),
      })
    )

    await page.route(D.api.identityStatus, (route) => {
      statusCallCount++
      // Primeiras 2 chamadas retornam EM_ANALISE; a partir da 3ª retorna APPROVED
      const status = statusCallCount < 3 ? 'EM_ANALISE' : 'APPROVED'
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status, protocolo: 'proto-poll' }),
      })
    })

    await acceptConsent(page)
    await page.getByRole('button', { name: D.locators.photoBtn }).click()

    // Após a transição para APPROVED o botão Continuar deve ser habilitado
    await expect(
      page.getByRole('button', { name: D.locators.continuarBtn })
    ).toBeEnabled({ timeout: 25000 })
  })
})

// ── 6. Casos de Borda e Negativos ────────────────────────────────────────────

test.describe('IDwall — Casos de Borda e Negativos', () => {
  test.describe.configure({ retries: 1 })
  test('CT32 - cliques duplos em "Tirar foto agora" disparam somente uma requisição (idempotência)', async ({ page }) => {
    // BUG REAL: botão sem debounce/guard após o primeiro clique envia 2 requisições.
    // Remover test.fail() após implementar debounce ou desabilitar botão após clique.
    test.fail(true, '[BUG] Botão "Tirar foto agora" sem debounce: duplo clique envia 2 requisições para /start')

    let requestCount = 0

    await gotoVerificationStep(page)
    await acceptConsent(page)

    await page.route(D.api.identityStart, async (route) => {
      requestCount++
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token_sdk: 'mock-sdk-idem', protocolo: 'proto-idem' }),
      })
    })

    const photoBtn = page.getByRole('button', { name: D.locators.photoBtn })
    // Dois cliques rápidos consecutivos
    await photoBtn.click()
    await photoBtn.click()
    await page.waitForTimeout(2000)

    // Apenas uma requisição deve ter saído, mesmo com duplo clique
    expect(requestCount).toBe(1)
  })

  test('CT33 - timeout/abort no /start exibe mensagem de erro e mantém tela interativa', async ({ page }) => {
    // GAP DE UX: a aplicação não exibe mensagem de erro quando /start falha por timeout/abort.
    // Remover test.fail() após implementar tratamento de erro para falhas de rede.
    test.fail(true, '[GAP-UI] Falha/abort em /start não gera mensagem de erro visível ao usuário')

    await gotoVerificationStep(page)
    await acceptConsent(page)

    await page.route(D.api.identityStart, async (route) => {
      await route.abort('timedout')
    })

    await page.getByRole('button', { name: D.locators.photoBtn }).click()

    // App deve exibir mensagem de erro — não pode travar silenciosamente
    await expect(
      page.getByText(/erro|tente novamente|serviço indisponível|não foi possível/i)
    ).toBeVisible({ timeout: 15000 })

    // Botão Voltar deve continuar visível e clicável
    await expect(page.getByRole('button', { name: D.locators.voltarBtn })).toBeVisible()
  })

  test('CT34 - payload XSS em campo de texto em dados-pessoais não é injetado como HTML', async ({ page }) => {
    // Verifica ANTES de navegar se o usuário será capaz de editar campos.
    // Para WebUser, o campo nome é disabled — skip imediato antes de gotoPersonalDataStep.
    // Nota: para testar este cenario com um usuário sem dados, use faker account.
    await gotoPersonalDataStep(page)

    const nameInput = page
      .locator('input[name*="name"], input[id*="name"], input[placeholder*="nome"]')
      .first()

    if (!(await nameInput.isEditable({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Campo nome não editável para este usuário (dados preenchidos/desabilitados)')
      return
    }

    const xssPayload = '<script>alert("xss-ct34")</script>'
    await nameInput.clear()
    await nameInput.fill(xssPayload)
    await nameInput.blur()
    await page.waitForTimeout(500)

    // O HTML do body não deve conter a tag script crua (evidência de sanitização)
    const bodyHTML = await page.locator('body').innerHTML()
    expect(bodyHTML).not.toContain('<script>alert("xss-ct34")</script>')
  })
})

// ── 7. Segurança ──────────────────────────────────────────────────────────────

test.describe('IDwall — Segurança', () => {
  test.describe.configure({ retries: 1 })
  test('CT35 - nenhuma chave de token bruto é armazenada em localStorage', async ({ page }) => {
    await gotoVerificationStep(page)

    const exposedKeys = await page.evaluate(() => {
      const sensitivePatterns = ['token', 'bearer', 'jwt', 'access_token', 'id_token']
      return Object.keys(localStorage).filter((key) =>
        sensitivePatterns.some((pattern) => key.toLowerCase().includes(pattern))
      )
    })

    expect(exposedKeys).toHaveLength(0)
  })

  test('CT36 - CPF do usuário não é emitido em mensagens de console do navegador', async ({ page }) => {
    const consoleLogs: string[] = []
    page.on('console', (msg) => consoleLogs.push(msg.text()))

    await gotoVerificationStep(page)
    await acceptConsent(page)

    // CPF: 11 dígitos no formato XXX.XXX.XXX-XX ou sequenciais.
    // Exclude URLs, CSP violation logs and hash chunks (which may contain digit sequences
    // that falsely match the CPF pattern but are not actually CPF values).
    const cpfPattern = /\d{3}\.\d{3}\.\d{3}-\d{2}/
    const leakedLog = consoleLogs.find((log) => {
      // Exclude browser-generated CSP/network/resource logs that contain URLs
      if (
        log.includes('http') ||
        log.includes('Content-Security-Policy') ||
        log.includes('script-src') ||
        log.includes('Loading the') ||
        log.includes('violates')
      ) return false
      return cpfPattern.test(log)
    })

    expect(leakedLog, `CPF detectado em log de console: "${leakedLog}"`).toBeUndefined()
  })
})

// ── 8. Recursos com SDK Real (skipped) ───────────────────────────────────────
// Cenários que dependem do SDK nativo IDwall (câmera, biometria, OCR, Receita Federal).
// Devem ser executados manualmente ou em pipeline com acesso ao ambiente sandbox IDwall.

test.describe.skip('IDwall — Recursos com SDK Real (requerem câmera/biometria)', () => {
  test('CT37 - OCR RG legível extrai nome, CPF e data de nascimento corretamente', async ({ page }) => {
    test.skip(true, 'Requer SDK IDwall com upload de imagem de documento real')
  })

  test('CT38 - OCR imagem borrada ou com baixa iluminação retorna erro de qualidade', async ({ page }) => {
    test.skip(true, 'Requer SDK IDwall com upload de imagem degradada')
  })

  test('CT39 - Face Match selfie + documento da mesma pessoa aprova verificação', async ({ page }) => {
    test.skip(true, 'Requer SDK IDwall — selfie + foto do documento da mesma pessoa')
  })

  test('CT40 - Face Match selfie de pessoa diferente do documento reprova verificação', async ({ page }) => {
    test.skip(true, 'Requer SDK IDwall — selfie de pessoa diferente do documento')
  })

  test('CT41 - Liveness passivo com selfie real é aprovado pela IA', async ({ page }) => {
    test.skip(true, 'Requer SDK IDwall com prova de vida passiva (análise de luz/sombra)')
  })

  test('CT42 - Liveness bloqueia foto impressa ou de tela (anti-spoofing)', async ({ page }) => {
    test.skip(true, 'Requer SDK IDwall — simulação de fraude com foto impressa/tela')
  })

  test('CT43 - Documentoscopia aprova documento autêntico', async ({ page }) => {
    test.skip(true, 'Requer SDK IDwall — análise de autenticidade do documento')
  })

  test('CT44 - Documentoscopia detecta e reprova imagem adulterada', async ({ page }) => {
    test.skip(true, 'Requer SDK IDwall — imagem adulterada para verificar detecção')
  })

  test('CT45 - CPF válido na Receita Federal retorna situação Regular', async ({ page }) => {
    test.skip(true, 'Requer integração IDwall com Receita Federal em sandbox')
  })

  test('CT46 - CPF suspenso ou cancelado na Receita Federal retorna situação correta', async ({ page }) => {
    test.skip(true, 'Requer integração IDwall com Receita Federal em sandbox')
  })
})
