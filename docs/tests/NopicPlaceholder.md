# Relatório de Validação

**Atividade:** [BUG] Ajustar imagem nopic de placeholder nos estoques de veículos e imóveis
**Card Monday:** [#12062565625](https://chavesnamao-team.monday.com/boards/18275745042/pulses/12062565625)
**Status:** ✅ Aprovado
**Data e Hora:** 21/05/2026 — 14:10
**Ambiente:** Staging (`f7bf24ff12b566d93c440497ec0ca228a308b6ed`)
**Validação Nº:** V001

---

## Perfil de Usuário

Usuário anônimo (sem autenticação). A funcionalidade validada é pública e acessível sem login — os cards de listagem de imóveis e veículos são exibidos na busca para qualquer visitante do portal.

---

## Massa de Dados Utilizadas

| Dado | Valor |
|------|-------|
| URL de busca — Imóveis | `https://staging.chavesnamao.com.br/imoveis/brasil/` |
| URL de busca — Veículos | `https://staging.chavesnamao.com.br/carros-usados/brasil/` |
| URL CDN nopic imóveis | `https://www.chavesnamao.com.br/imn/0430X0258/N/60/imoveis/nopic.jpg` |
| URL CDN nopic veículos | `https://www.chavesnamao.com.br/imn/0430X0258/N/60/veiculos/nopic.jpg` |
| Chunk validado | `57837-8ad65c4000db9607.js` |
| Build staging | `f7bf24ff12b566d93c440497ec0ca228a308b6ed` |

---

## Compatibilidade

### Mobile

- **Dispositivos:** Não aplicável (validação focada em código e CDN; comportamento visual é agnóstico de dispositivo)
- **Navegadores:** Não aplicável

### Desktop

- **Sistemas:** Windows 11
- **Navegadores:** Chromium 142 (via Playwright browser automation)

### App

- Não aplicável — funcionalidade é exclusiva do portal web.

---

## Evidências

| # | Evidência | Descrição |
|---|-----------|-----------|
| 1 | Screenshot — nopic imóveis no CDN | Imagem `nopic.jpg` acessada diretamente via CDN (430×258px), exibindo o ilustração cinza de edifícios e carros. Retorno HTTP 200. |
| 2 | Screenshot — nopic veículos no CDN | Imagem `nopic.jpg` do segmento veículos acessada via CDN (430×258px). Retorno HTTP 200. |
| 3 | Screenshot — card imóveis com nopic | Card do estoque de imóveis renderizando a imagem placeholder em substituição à foto do anúncio. Layout íntegro: título, localização, atributos, preço e botões presentes. |
| 4 | Screenshot — card veículos com nopic | Card do estoque de veículos renderizando a imagem placeholder. Layout íntegro: título, marca, preço e botões presentes. |
| 5 | Análise de código-fonte (JS bundle) | Trecho do chunk `57837` confirma lógica: `b.pictures.featured \|\| "nopic.jpg"` — o fallback para `nopic.jpg` é aplicado no `src` da `<img>` SSR do card quando `featured` é nulo/vazio. |

---

## Cenários Validados

| # | Cenário | Resultado | Ajuste relacionado | Observação |
|---|---------|-----------|-------------------|------------|
| 1 | Imagem `nopic.jpg` de imóveis existe e carrega no CDN | ✅ Aprovado | — | HTTP 200, dimensões 430×258px confirmadas |
| 2 | Imagem `nopic.jpg` de veículos existe e carrega no CDN | ✅ Aprovado | — | HTTP 200, dimensões 430×258px confirmadas |
| 3 | Código do card component aplica fallback `nopic.jpg` quando `featured` é nulo | ✅ Aprovado | — | Lógica `b.pictures.featured \|\| "nopic.jpg"` presente no bundle de staging |
| 4 | Card de imóvel exibe placeholder nopic sem quebrar o layout | ✅ Aprovado | — | Todos os elementos do card (título, endereço, atributos, preço, botões) permanecem visíveis e posicionados corretamente |
| 5 | Card de veículo exibe placeholder nopic sem quebrar o layout | ✅ Aprovado | — | Todos os elementos do card (título, marca, preço, botões) permanecem visíveis e posicionados corretamente |

---

## Ajustes Necessários

Nenhum ajuste necessário identificado neste ciclo de validação.

---

## Conclusão

A validação do bug *"Ajustar imagem nopic de placeholder nos estoques de veículos e imóveis"* foi concluída com **sucesso** no ambiente de Staging (build `f7bf24ff12b566d93c440497ec0ca228a308b6ed`). Os cinco cenários planejados foram executados via automação Playwright, cobrindo a disponibilidade das imagens no CDN, a presença da lógica de fallback no código-fonte transpilado e o comportamento visual dos cards em ambos os segmentos (imóveis e veículos).

A análise do JavaScript bundle (`57837-8ad65c4000db9607.js`) confirmou que o componente de card utiliza corretamente a expressão `b.pictures.featured || "nopic.jpg"` para compor o atributo `src` da imagem SSR, garantindo que anúncios sem foto cadastrada exibam o placeholder `nopic.jpg` servido pelo CDN. A renderização foi verificada e o layout do card permanece íntegro nos dois segmentos, sem quebras visuais ou ausência de elementos. As imagens `nopic.jpg` retornam HTTP 200 para os paths de imóveis e veículos. **Nenhum ajuste foi identificado.** A atividade está apta para avanço de ambiente (produção).
