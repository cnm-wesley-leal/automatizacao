# Casos de Teste — Verificação de Identidade IDwall (Jornada Anuncie PF)

**Módulo:** Verificação de Identidade — Integração IDwall  
**Arquivo de automação:** `e2e/tests/IDwallVerification.spec.ts`  
**Card de referência:** [Jornada Anuncie PF] Refatoração e implementação do IDwall  
**Board Monday:** https://chavesnamao-team.monday.com/boards/18275745042/pulses/12015546153  
**Data:** 18/05/2026

---

## Legenda de Status de Automação

| Status | Significado |
|--------|-------------|
| Automatizado | Coberto em `e2e/tests/IDwallVerification.spec.ts` |
| Manual | Requer execução humana; dependência de estado de servidor, SDK real ou backoffice |
| Fora de escopo | Escopo de sprint futuro ou módulo diferente |

---

## Pré-condições Gerais

- Usuário Pessoa Física (PF) autenticado no ambiente QA (`https://qa.chavesnamao.com.br`)
- Conta PF com CPF e data de nascimento cadastrados
- Fluxo de criação de anúncio de imóvel PF iniciado
- Etapas 1–9 do fluxo concluídas (injeção de estado via `localStorage['realtyPfFlow']` nos testes automatizados)
- Variáveis de ambiente: `SSR_USER_EMAIL_PF`, `SSR_USER_PASSWORD_PF`, `SSR_USER_CPF_PF`

---

## Bloco 0 — Comunicação e Entrada no Fluxo IDwall

---

### CT01 - Aviso de verificação de identidade exibido na tela de escolha de plano

**Status de automação:** Manual  
**Dependências:** Nenhuma. Acesso direto à Etapa 2 (`?etapa=escolha-plano`) com usuário PF autenticado.

#### Objetivo
Verificar que a tela de escolha de plano exibe um aviso informando que anunciantes PF precisarão passar pela verificação de identidade IDwall antes de publicar o anúncio.

#### Pré-Condições
- Usuário PF autenticado
- Etapa 1 do fluxo (informações básicas do imóvel) concluída

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Navegar até `?etapa=escolha-plano` | Tela de escolha de plano carregada |
| 2 | Inspecionar a tela em busca de aviso ou banner sobre verificação de identidade | Elemento de aviso sobre IDwall visível |

#### Resultados Esperados
- Texto de aviso sobre a necessidade de verificação de identidade IDwall está visível na tela de escolha de plano

#### Critérios de Aceitação
- Aviso sobre verificação de identidade visível antes da seleção do plano
- O aviso não bloqueia a seleção do plano

---

### CT02 - Fluxo não avança para a Etapa 11 sem aceitar os termos de consentimento

**Status de automação:** Manual  
**Dependências:** CT06 (tela de biometria carregada). O botão "Tirar foto agora" precisa estar visível.

#### Objetivo
Verificar que o sistema bloqueia o início da captura biométrica enquanto o checkbox de consentimento não estiver marcado, sem necessidade de clique em "Continuar".

#### Pré-Condições
- Usuário PF autenticado
- Etapas 1–10 concluídas
- Tela `?etapa=verificacao-identidade` carregada

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Navegar até `?etapa=verificacao-identidade` | Tela de biometria carregada |
| 2 | Não marcar o checkbox de consentimento | Checkbox permanece desmarcado |
| 3 | Tentar clicar no botão "Tirar foto agora" | Botão não responde (está desabilitado) |
| 4 | Verificar que nenhuma requisição à API IDwall foi disparada | Aba Network do DevTools sem chamadas a `/identity-verification/start` |

#### Resultados Esperados
- O botão "Tirar foto agora" permanece desabilitado sem o consentimento
- Nenhuma chamada à API de verificação é feita

#### Critérios de Aceitação
- Sem marcar o checkbox: botão inativo e sem disparo de requisição
- O bloqueio ocorre no front-end, sem necessidade de resposta do servidor

---

## Bloco 1 — Dados Pessoais (Etapa 10)

---

### CT03 - Avanço com dados pessoais válidos

**Status de automação:** Automatizado  
**Dependências:** Etapas 1–9 concluídas. Conta PF com CPF cadastrado. CEP `01310-100` disponível na API de consulta.

#### Objetivo
Verificar que o preenchimento correto do formulário de dados pessoais (CPF, data de nascimento e CEP pessoal) permite avançar para a Etapa 11 de verificação de identidade.

#### Pré-Condições
- Usuário PF autenticado
- Etapas 1–9 concluídas
- Conta do usuário possui CPF cadastrado

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Navegar até `?etapa=dados-pessoais` | Formulário de dados pessoais é exibido |
| 2 | Verificar que CPF e data de nascimento estão pré-preenchidos com os dados da conta | Campos exibem os dados do usuário logado |
| 3 | Preencher o campo "CEP" com `01310-100` | Campo aceita o valor; API de CEP retorna logradouro |
| 4 | Aguardar preenchimento automático do endereço (cidade, bairro, rua) | Campos de endereço preenchidos automaticamente |
| 5 | Clicar em "Continuar" | Navegação ocorre sem erros |

#### Resultados Esperados
- URL muda para `?etapa=verificacao-identidade`
- Nenhuma mensagem de erro é exibida

#### Critérios de Aceitação
- A URL deve conter `etapa=verificacao-identidade` após o clique em "Continuar"
- O fluxo não deve apresentar mensagens de validação com dados corretos

---

### CT04 - CPF com dígitos repetidos exibe mensagem de validação

**Status de automação:** Automatizado  
**Dependências:** Etapas 1–9 concluídas. Campo CPF editável na Etapa 10.

#### Objetivo
Verificar que o sistema rejeita CPFs matematicamente inválidos (dígitos todos iguais) com mensagem de erro inline.

#### Pré-Condições
- Usuário PF autenticado
- Etapas 1–9 concluídas

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Navegar até `?etapa=dados-pessoais` | Formulário de dados pessoais é exibido |
| 2 | Limpar o campo CPF | Campo fica vazio |
| 3 | Digitar `111.111.111-11` no campo CPF | Campo aceita a entrada |
| 4 | Remover foco do campo (clicar em outro elemento ou pressionar Tab) | Validação inline é acionada |

#### Resultados Esperados
- Mensagem de validação "CPF inválido" (ou equivalente) é exibida abaixo do campo
- O botão "Continuar" permanece bloqueado ou a ação de avançar é impedida

#### Critérios de Aceitação
- Mensagem de erro visível contendo texto como "CPF inválido", "CPF não é válido" ou "CPF incorreto"
- URL permanece em `?etapa=dados-pessoais`

---

### CT05 - Data de nascimento futura exibe mensagem de validação

**Status de automação:** Automatizado  
**Dependências:** Etapas 1–9 concluídas. Campo "Data de Nascimento" editável na Etapa 10.

#### Objetivo
Verificar que o sistema rejeita datas de nascimento no futuro com mensagem de erro inline.

#### Pré-Condições
- Usuário PF autenticado
- Etapas 1–9 concluídas

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Navegar até `?etapa=dados-pessoais` | Formulário de dados pessoais é exibido |
| 2 | Limpar o campo "Data de Nascimento" | Campo fica vazio |
| 3 | Digitar `01/01/2030` no campo de data | Campo aceita a entrada |
| 4 | Remover foco do campo | Validação inline é acionada |

#### Resultados Esperados
- Mensagem de erro sobre data inválida é exibida
- Avanço para próxima etapa é bloqueado

#### Critérios de Aceitação
- Mensagem de erro visível contendo texto como "data inválida", "não pode ser futura" ou "data de nascimento inválida"
- URL permanece em `?etapa=dados-pessoais`

---

### CT27 - CEP pessoal ausente bloqueia avanço

**Status de automação:** Automatizado  
**Dependências:** Etapas 1–9 concluídas. Campo CEP vazio (não pré-preenchido pelo sistema).

#### Objetivo
Verificar que o campo CEP pessoal é obrigatório e que sua ausência impede o avanço para a Etapa 11.

#### Pré-Condições
- Usuário PF autenticado
- Etapas 1–9 concluídas

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Navegar até `?etapa=dados-pessoais` | Formulário de dados pessoais é exibido |
| 2 | Verificar que o campo CEP pessoal está vazio | Campo sem valor preenchido |
| 3 | Não preencher o campo CEP | — |
| 4 | Clicar em "Continuar" | Sistema bloqueia o avanço |

#### Resultados Esperados
- URL permanece em `?etapa=dados-pessoais`
- Mensagem de campo obrigatório pode ser exibida no campo CEP

#### Critérios de Aceitação
- Nenhuma navegação para `?etapa=verificacao-identidade` ocorre
- O sistema comunica ao usuário que o CEP é necessário

---

## Bloco 2 — Interface da Tela de Biometria (Etapa 11)

---

### CT06 - Tela de verificação exibe todos os elementos obrigatórios

**Status de automação:** Automatizado  
**Dependências:** CT03 aprovado (Etapas 1–10 concluídas com dados válidos).

#### Objetivo
Verificar que a tela de verificação de identidade (Etapa 11) apresenta todos os elementos de UI exigidos pela especificação: título, instruções, checkbox de consentimento e botão de ação desabilitado.

#### Pré-Condições
- Usuário PF autenticado
- Etapas 1–10 concluídas com dados válidos

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Concluir Etapa 10 com dados válidos (CT03) | URL muda para `?etapa=verificacao-identidade` |
| 2 | Verificar presença do título da tela | Título "Verificação de Identidade" (ou equivalente) visível |
| 3 | Verificar presença de texto explicativo / instruções | Pelo menos um parágrafo ou bullet de orientação visível |
| 4 | Verificar presença do checkbox de consentimento | Checkbox visível e **desmarcado** por padrão |
| 5 | Verificar estado do botão de biometria | Botão "Tirar foto agora" visível e **desabilitado** |

#### Resultados Esperados
- Todos os 4 elementos de UI listados estão presentes e nos estados corretos

#### Critérios de Aceitação
- Título da tela visível
- Checkbox de consentimento presente e desmarcado por padrão
- Botão "Tirar foto agora" presente e desabilitado antes de aceitar o consentimento

---

### CT07 - Aceitar consentimento habilita o botão de biometria

**Status de automação:** Automatizado  
**Dependências:** CT06 aprovado (tela de verificação carregada com todos os elementos visíveis).

#### Objetivo
Verificar que marcar o checkbox de consentimento ("Autorizo o uso da minha imagem") habilita o botão "Tirar foto agora".

#### Pré-Condições
- Usuário PF autenticado
- Tela de verificação de identidade carregada (`?etapa=verificacao-identidade`)

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Navegar até `?etapa=verificacao-identidade` | Tela de verificação carregada |
| 2 | Confirmar que o botão "Tirar foto agora" está desabilitado | Botão no estado disabled |
| 3 | Clicar no checkbox "Autorizo o uso da minha imagem" | Checkbox fica marcado |

#### Resultados Esperados
- Botão "Tirar foto agora" muda para estado habilitado (enabled) imediatamente após marcar o checkbox

#### Critérios de Aceitação
- Antes de marcar: botão desabilitado
- Após marcar: botão habilitado e clicável
- Nenhuma ação adicional do usuário é necessária para habilitar o botão

---

### CT08 - Clique em "Tirar foto agora" dispara chamada à API IDwall

**Status de automação:** Automatizado  
**Dependências:** CT07 aprovado (checkbox marcado, botão habilitado). Conta PF com CPF cadastrado. Nos testes automatizados: rota `POST /account/identity-verification/start` mockada com resposta 200.

#### Objetivo
Verificar que o clique no botão "Tirar foto agora" aciona a requisição `POST /account/identity-verification/start` com os dados do usuário.

#### Pré-Condições
- Usuário PF autenticado com CPF cadastrado na conta
- Tela de verificação de identidade carregada
- Consentimento aceito (checkbox marcado)
- _(Nos testes automatizados: rota da API mockada com resposta 200)_

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Navegar até `?etapa=verificacao-identidade` | Tela de verificação carregada |
| 2 | Marcar o checkbox de consentimento | Botão "Tirar foto agora" habilitado |
| 3 | Clicar em "Tirar foto agora" | Sistema inicia o processo de biometria |
| 4 | Verificar (via DevTools / Network) que a requisição foi enviada | `POST /account/identity-verification/start` com payload contendo CPF e dados do usuário |

#### Resultados Esperados
- Requisição `POST /account/identity-verification/start` é enviada ao backend
- Interface exibe loading ou tela do SDK IDwall para captura da foto

#### Critérios de Aceitação
- A requisição POST é disparada ao clicar no botão
- O payload contém os dados do usuário PF (CPF obrigatório)
- Nenhum erro 4xx é retornado para usuário com CPF válido cadastrado

---

## Bloco 3 — Respostas do Motor IDwall

> **Nota de execução:** Os cenários deste bloco dependem da resposta do serviço IDwall. Na execução manual, o comportamento pode variar conforme a biometria real. Na automação, as respostas são simuladas via mock de API.

---

### CT09 - Status VALID libera avanço para Etapa 12

**Status de automação:** Automatizado  
**Dependências:** CT08 aprovado. Nos testes automatizados: rotas `/identity-verification/start` e `/identity-verification/status` mockadas com `{ status: "VALID" }`. Na execução manual: biometria capturada com sucesso no SDK IDwall real.

#### Objetivo
Verificar que quando o motor IDwall retorna `status: VALID`, o usuário consegue avançar para a Etapa 12 (revisão do anúncio).

#### Pré-Condições
- Usuário PF autenticado com CPF válido
- Biometria capturada com sucesso (ou mock configurado para retornar VALID)

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Navegar até `?etapa=verificacao-identidade` | Tela de verificação carregada |
| 2 | Aceitar consentimento e clicar em "Tirar foto agora" | SDK IDwall iniciado / requisição enviada |
| 3 | Concluir a captura biométrica com sucesso | Motor IDwall retorna `status: VALID` |
| 4 | Aguardar processamento da resposta pelo sistema | Interface atualiza com resultado positivo |

#### Resultados Esperados
- Botão "Continuar" fica habilitado, ou o sistema navega automaticamente para a Etapa 12
- Nenhuma mensagem de erro ou bloqueio é exibida

#### Critérios de Aceitação
- Com status VALID: fluxo avança para `?etapa=revisao` ou equivalente da Etapa 12
- Sistema exibe feedback positivo de verificação concluída

---

### CT10 - Status INVALID bloqueia o fluxo com mensagem ao usuário

**Status de automação:** Automatizado  
**Dependências:** CT08 aprovado. Nos testes automatizados: rotas mockadas com `{ status: "INVALID" }`. Na execução manual: requer conta ou biometria que o motor IDwall reprove.

#### Objetivo
Verificar que quando o motor IDwall retorna `status: INVALID`, o sistema bloqueia o avanço e exibe mensagem de verificação reprovada.

#### Pré-Condições
- Usuário PF autenticado
- Mock configurado para retornar `status: INVALID` (ou biometria que resulte em reprovação)

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Navegar até `?etapa=verificacao-identidade` | Tela de verificação carregada |
| 2 | Aceitar consentimento e clicar em "Tirar foto agora" | SDK IDwall iniciado |
| 3 | Motor IDwall retorna `status: INVALID` | Sistema recebe a resposta negativa |
| 4 | Aguardar atualização da interface | Sistema exibe mensagem de bloqueio |

#### Resultados Esperados
- Mensagem informando que a verificação foi reprovada é exibida
- Botão "Continuar" permanece desabilitado
- URL permanece em `?etapa=verificacao-identidade`

#### Critérios de Aceitação
- Mensagem de reprovação visível ao usuário
- Nenhum dado biométrico sensível é exposto na interface
- O sistema indica canal de suporte ou próximos passos ao usuário

---

### CT11 - Status MANUAL_APPROVAL exibe estado "em análise"

**Status de automação:** Automatizado  
**Dependências:** CT08 aprovado. Nos testes automatizados: rotas mockadas com `{ status: "MANUAL_APPROVAL" }`. Na execução manual: requer biometria que o motor IDwall encaminhe para análise humana.

#### Objetivo
Verificar que quando o motor IDwall retorna `status: MANUAL_APPROVAL`, o sistema exibe o estado de análise pendente sem bloquear nem avançar o fluxo abruptamente.

#### Pré-Condições
- Usuário PF autenticado
- Mock configurado para retornar `status: MANUAL_APPROVAL`

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Navegar até `?etapa=verificacao-identidade` | Tela de verificação carregada |
| 2 | Aceitar consentimento e clicar em "Tirar foto agora" | SDK IDwall iniciado |
| 3 | Motor IDwall retorna `status: MANUAL_APPROVAL` | Sistema recebe a resposta de análise manual |
| 4 | Aguardar atualização da interface | Sistema exibe estado intermediário |

#### Resultados Esperados
- Mensagem informando que a análise está em andamento ("em análise", "aguardando aprovação" ou equivalente) é exibida
- O fluxo não avança para a Etapa 12 nem regride para etapas anteriores
- Estado é preservado para quando a análise for concluída

#### Critérios de Aceitação
- Mensagem de análise pendente visível
- Nenhuma navegação automática ocorre
- O estado MANUAL_APPROVAL é refletido corretamente na interface

---

## Bloco 4 — Fluxos de Perfil de Usuário e Escopo de Produto

---

### CT12 - Fluxo IDwall também exige verificação no anúncio de veículo PF

**Status de automação:** Fora de escopo (sprint futura)  
**Dependências:** Módulo de anúncio de veículos PF disponível no ambiente QA. Fluxo `/anunciar-gratis-veiculos/pessoa-fisica/criar/` ativo.

#### Objetivo
Verificar que a verificação de identidade IDwall também é exigida no fluxo de criação de anúncio de veículo para pessoa física, não se restringindo apenas ao módulo de imóveis.

#### Pré-Condições
- Usuário PF autenticado
- Fluxo de anúncio de veículo PF disponível no ambiente QA

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Iniciar fluxo de criação de anúncio de veículo como usuário PF | Fluxo carregado |
| 2 | Avançar até a etapa de dados pessoais | Formulário de dados pessoais exibido |
| 3 | Preencher os dados e avançar | Sistema direciona para etapa de verificação de identidade |
| 4 | Verificar a tela de biometria | Tela IDwall exibida com os mesmos elementos do fluxo de imóvel |

#### Resultados Esperados
- A etapa de verificação de identidade IDwall é exibida no fluxo de veículo PF
- Os elementos da tela são idênticos ao fluxo de imóvel PF

#### Critérios de Aceitação
- A tela `?etapa=verificacao-identidade` é apresentada no fluxo de veículo PF
- O mecanismo de consentimento e o botão "Tirar foto agora" funcionam da mesma forma

---

### CT13 - Usuário já verificado não repete a biometria

**Status de automação:** Manual  
**Dependências:** Conta PF com status de verificação IDwall `VALID` persistido no servidor (requer execução prévia de CT09 com sucesso em ambiente real, não mockado).

#### Objetivo
Verificar que o sistema reconhece um usuário cuja identidade já foi verificada anteriormente e pula a Etapa 11, avançando diretamente para a Etapa 12.

#### Pré-Condições
- Usuário PF autenticado cuja conta já possui status IDwall `VALID` no servidor
- Etapas 1–10 concluídas

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Iniciar novo fluxo de anúncio como usuário PF já verificado | Fluxo iniciado |
| 2 | Avançar da Etapa 10 (dados pessoais) para a próxima etapa | Sistema não exibe a tela de biometria |
| 3 | Verificar a URL após clicar em "Continuar" na Etapa 10 | URL salta direto para Etapa 12 ou exibe confirmação de verificação já concluída |

#### Resultados Esperados
- A Etapa 11 (biometria) não é exibida para usuário já verificado
- O fluxo avança para a Etapa 12 sem solicitar nova captura biométrica

#### Critérios de Aceitação
- Usuário com status `VALID` no servidor não vê a tela de verificação de identidade em novo anúncio
- O sistema não solicita biometria duplicada

---

### CT14 - Operador aprova verificação manual via backoffice

**Status de automação:** Manual  
**Dependências:** Acesso ao painel de operador/backoffice. Conta PF em estado `MANUAL_APPROVAL` (CT11 executado em ambiente real). Permissão de operador ativa para o usuário que realizará a aprovação.

#### Objetivo
Verificar que um operador consegue aprovar manualmente uma verificação de identidade em estado `MANUAL_APPROVAL` via `POST /relatorios/validar/`, alterando o status para `VALID` e liberando o fluxo do anunciante.

#### Pré-Condições
- Conta PF com verificação em status `MANUAL_APPROVAL` no servidor
- Usuário operador autenticado com permissão de aprovação
- Acesso à rota `/relatorios/validar/` ou interface de backoffice equivalente

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Acessar o painel de operador e localizar a verificação pendente do usuário PF | Verificação listada com status `MANUAL_APPROVAL` |
| 2 | Executar a ação de aprovação (botão ou chamada `POST /relatorios/validar/` com payload de aprovação) | Sistema processa a aprovação |
| 3 | Verificar o status atualizado da verificação no backoffice | Status alterado para `VALID` |
| 4 | Solicitar ao usuário PF que retorne ao fluxo de anúncio | Usuário acessa o fluxo |
| 5 | Verificar o estado da Etapa 11 para o usuário PF | Etapa 11 liberada; fluxo avança para Etapa 12 |

#### Resultados Esperados
- O status da verificação muda de `MANUAL_APPROVAL` para `VALID` após ação do operador
- O anunciante PF consegue continuar o fluxo sem nova biometria

#### Critérios de Aceitação
- Aprovação via backoffice reflete no status do usuário PF em tempo real (ou após recarregamento)
- O anunciante PF pode avançar para a Etapa 12 após aprovação do operador

---

### CT15 - Operador reprova verificação manual: mensagem curta (menos de 25 caracteres) é rejeitada

**Status de automação:** Manual  
**Dependências:** Acesso ao painel de operador. Conta PF em estado `MANUAL_APPROVAL`. Permissão de reprovação ativa.

#### Objetivo
Verificar que o sistema rejeita mensagens de reprovação com menos de 25 caracteres, forçando o operador a fornecer uma justificativa descritiva e adequada ao usuário.

#### Pré-Condições
- Conta PF em status `MANUAL_APPROVAL` no servidor
- Usuário operador autenticado com permissão de reprovação

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Acessar o painel de operador e localizar a verificação pendente | Verificação listada |
| 2 | Acionar a ação de reprovação e preencher o campo de mensagem com texto curto (ex: `Reprovado`) — menos de 25 caracteres | Campo preenchido |
| 3 | Confirmar a reprovação | Sistema retorna erro de validação |

#### Resultados Esperados
- O sistema retorna erro 400 (ou mensagem de validação equivalente) indicando que a mensagem é muito curta
- A reprovação não é processada

#### Critérios de Aceitação
- Mensagem com menos de 25 caracteres: sistema bloqueia e exibe erro
- Mensagem com 25 ou mais caracteres: reprovação processada com sucesso (ver CT16)

---

### CT16 - Operador reprova verificação com mensagem válida; usuário vê bloqueio com feedback

**Status de automação:** Manual  
**Dependências:** CT15 (entendimento da regra de mensagem mínima). Conta PF em estado `MANUAL_APPROVAL`. Permissão de reprovação ativa.

#### Objetivo
Verificar que a reprovação manual pelo operador com mensagem válida (25+ caracteres) altera o status para `MANUAL_REPROVAL` e exibe o motivo da reprovação ao anunciante.

#### Pré-Condições
- Conta PF em status `MANUAL_APPROVAL` no servidor
- Usuário operador autenticado com permissão de reprovação

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Acessar o painel de operador e localizar a verificação pendente | Verificação listada |
| 2 | Acionar reprovação com mensagem válida de 25+ caracteres (ex: `Verificação reprovada por inconsistência na foto identificada.`) | Campo preenchido |
| 3 | Confirmar a reprovação | Status alterado para `MANUAL_REPROVAL` |
| 4 | Acessar o fluxo de anúncio como usuário PF reprovado | Tela de bloqueio exibida |
| 5 | Verificar a mensagem exibida ao usuário | Motivo da reprovação visível |

#### Resultados Esperados
- Status muda de `MANUAL_APPROVAL` para `MANUAL_REPROVAL`
- O anunciante vê a mensagem de reprovação fornecida pelo operador

#### Critérios de Aceitação
- Reprovação com 25+ caracteres: processada com sucesso (HTTP 200)
- Motivo da reprovação exibido ao usuário PF na tela de bloqueio
- Nenhum dado biométrico sensível exposto na mensagem ao usuário

---

## Bloco 5 — Impacto em Renovações de Anúncio

---

### CT17 - Renovação de imóvel bloqueada quando verificação está em MANUAL_APPROVAL

**Status de automação:** Manual  
**Dependências:** Conta PF com anúncio de imóvel publicado anteriormente e verificação em status `MANUAL_APPROVAL`. Fluxo de renovação de anúncio disponível no ambiente QA.

#### Objetivo
Verificar que o fluxo de renovação de anúncio de imóvel é bloqueado enquanto a verificação de identidade do anunciante estiver em análise manual.

#### Pré-Condições
- Usuário PF autenticado com anúncio de imóvel publicado e expirado (renovável)
- Status de verificação IDwall: `MANUAL_APPROVAL`

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Acessar o painel do anunciante e localizar o anúncio de imóvel vencido | Botão de renovação visível |
| 2 | Clicar em "Renovar anúncio" | Sistema verifica o status de identidade do usuário |
| 3 | Observar o comportamento do sistema | Bloqueio ou mensagem de espera exibida |

#### Resultados Esperados
- O sistema não permite a renovação enquanto o status for `MANUAL_APPROVAL`
- Mensagem informando que a verificação está em análise é exibida

#### Critérios de Aceitação
- Renovação bloqueada com status `MANUAL_APPROVAL`
- Usuário informado sobre o motivo do bloqueio e orientado a aguardar

---

### CT18 - Renovação de veículo com MANUAL_APPROVAL bloqueada; liberada após aprovação do operador

**Status de automação:** Manual  
**Dependências:** CT17 (lógica de bloqueio em renovação). Conta PF com anúncio de veículo vencido e verificação em `MANUAL_APPROVAL`. Operador disponível para aprovar (CT14).

#### Objetivo
Verificar que a renovação de anúncio de veículo é bloqueada durante análise manual e liberada automaticamente (ou após recarregamento) quando o operador aprova a verificação.

#### Pré-Condições
- Usuário PF com anúncio de veículo renovável e verificação em `MANUAL_APPROVAL`
- Operador autenticado com permissão de aprovação

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Tentar renovar o anúncio de veículo como usuário PF em `MANUAL_APPROVAL` | Bloqueio exibido |
| 2 | Operador acessa o backoffice e aprova a verificação (ver CT14) | Status alterado para `VALID` |
| 3 | Usuário PF retorna ao painel e tenta renovar novamente | Renovação liberada |

#### Resultados Esperados
- Antes da aprovação: renovação bloqueada
- Após aprovação do operador: renovação disponível sem nova biometria

#### Critérios de Aceitação
- Bloqueio removido após mudança de status para `VALID`
- Usuário não precisa realizar nova biometria para renovar

---

## Bloco 6 — Webhooks e Processamento Assíncrono

---

### CT19 - Webhook CONCLUIDO/VALID atualiza status do usuário; segundo envio é idempotente

**Status de automação:** Manual  
**Dependências:** Acesso à API de webhook do sistema (`POST /webhook/idwall` ou equivalente). Protocolo de verificação válido gerado por CT08 em ambiente real (não mockado). Ferramenta de disparo de requisições HTTP (Postman, curl ou equivalente).

#### Objetivo
Verificar que o recebimento do webhook `tipo: protocolo_status` com `status: CONCLUIDO` atualiza corretamente o status de verificação do usuário no banco de dados, e que o reenvio do mesmo webhook não causa efeitos colaterais (idempotência).

#### Pré-Condições
- Protocolo de verificação ativo (`protocolo` gerado pelo IDwall no CT08)
- Acesso ao endpoint de webhook do sistema
- Ferramenta para envio manual de requisição HTTP

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Enviar `POST /webhook/idwall` com payload `{ dados: { protocolo, status: "CONCLUIDO" }, tipo: "protocolo_status" }` | Sistema processa o webhook; status do usuário atualizado |
| 2 | Verificar o status do usuário PF no backoffice ou via API | Status atualizado para `VALID` |
| 3 | Enviar o mesmo payload novamente (reenvio idempotente) | Sistema retorna 200 sem alterar dados já atualizados |

#### Resultados Esperados
- Primeiro envio: status atualizado corretamente
- Segundo envio idêntico: processado sem erro e sem efeito colateral

#### Critérios de Aceitação
- Webhook com protocolo válido e `status: CONCLUIDO` atualiza o usuário para `VALID`
- Reenvio do mesmo webhook retorna HTTP 200 sem duplicar dados ou gerar erro 500

---

### CT20 - Webhook com protocolo desconhecido não gera erro 500

**Status de automação:** Manual  
**Dependências:** Acesso ao endpoint de webhook. Protocolo inexistente no sistema (ex: UUID aleatório não associado a nenhuma verificação).

#### Objetivo
Verificar que o sistema trata graciosamente webhooks com protocolos que não existem no banco de dados, retornando uma resposta adequada sem gerar erro interno (HTTP 500).

#### Pré-Condições
- Acesso ao endpoint de webhook do sistema
- Ferramenta para envio manual de requisição HTTP

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Enviar `POST /webhook/idwall` com payload contendo um `protocolo` aleatório inexistente no sistema | Sistema processa a requisição |
| 2 | Verificar o código de resposta HTTP | Resposta 200, 404 ou 422 — qualquer resposta exceto 500 |

#### Resultados Esperados
- O sistema não retorna HTTP 500
- Nenhum dado é corrompido no banco de dados

#### Critérios de Aceitação
- Resposta HTTP diferente de 500 para protocolo desconhecido
- Log de erro adequado no servidor sem propagação de exceção não tratada

---

## Bloco 7 — Bloqueio Permanente e Segurança

---

### CT21 - Usuário com status INVALID permanente está bloqueado de criar novo anúncio

**Status de automação:** Manual  
**Dependências:** Conta PF com status IDwall `INVALID` persistido no servidor (requer CT10 executado em ambiente real). O status deve ser definitivo (não reversível por nova tentativa de biometria).

#### Objetivo
Verificar que um usuário cuja verificação de identidade foi definitivamente reprovada pelo motor IDwall não consegue iniciar ou prosseguir com a criação de novo anúncio como PF.

#### Pré-Condições
- Usuário PF autenticado com status de verificação IDwall `INVALID` persistido no servidor

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Iniciar novo fluxo de anúncio como usuário PF com status `INVALID` | Sistema detecta o status do usuário |
| 2 | Tentar avançar no fluxo | Bloqueio exibido pelo sistema |
| 3 | Verificar a mensagem e as opções apresentadas ao usuário | Mensagem de bloqueio com canal de suporte |

#### Resultados Esperados
- O usuário é bloqueado de criar novo anúncio
- O sistema exibe mensagem clara sobre o bloqueio e fornece alternativa de contato com suporte

#### Critérios de Aceitação
- Fluxo de criação de anúncio inacessível para usuário com status `INVALID` definitivo
- Mensagem de bloqueio visível sem expor dados biométricos
- Canal de suporte (link, e-mail ou telefone) indicado na tela de bloqueio

---

### CT22 - Tela de bloqueio exibe mensagem e canal de suporte sem expor dados biométricos

**Status de automação:** Manual  
**Dependências:** CT21 (usuário com status `INVALID`) ou CT16 (usuário com status `MANUAL_REPROVAL`).

#### Objetivo
Verificar que a tela de bloqueio exibida a usuários reprovados contém as informações necessárias ao usuário (mensagem de reprovação, canal de suporte) sem expor nenhum dado biométrico sensível (foto, hash, token SDK).

#### Pré-Condições
- Usuário PF autenticado com status `INVALID` ou `MANUAL_REPROVAL` no servidor

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Acessar o fluxo de anúncio como usuário bloqueado | Tela de bloqueio exibida |
| 2 | Verificar o conteúdo da tela: mensagem, link de suporte | Informações adequadas visíveis |
| 3 | Inspecionar o código-fonte e o painel Network do DevTools | Nenhum dado biométrico (token, hash, imagem) presente no HTML ou nas respostas de API |

#### Resultados Esperados
- Mensagem de bloqueio clara e compreensível
- Canal de suporte presente (e-mail, telefone ou link)
- Nenhum dado biométrico exposto na interface ou nas respostas de API

#### Critérios de Aceitação
- Mensagem de reprovação visível e adequada para o usuário leigo
- Canal de suporte disponível na tela
- Ausência de tokens IDwall, hashes ou imagens biométricas no HTML renderizado

---

## Bloco 8 — Fluxo Completo e Revisão

---

### CT23 - Fluxo completo com status VALID avança até a tela de sucesso (Etapa 13)

**Status de automação:** Manual  
**Dependências:** CT09 aprovado em ambiente real (SDK IDwall real, não mockado). Conta PF com CPF válido. Etapas 1–11 concluídas com sucesso.

#### Objetivo
Verificar o fluxo de ponta a ponta da jornada Anuncie PF, confirmando que um usuário com verificação `VALID` consegue concluir todas as 13 etapas e chegar à tela de sucesso/publicação do anúncio.

#### Pré-Condições
- Usuário PF autenticado com CPF válido e sem verificação prévia (ou com verificação expirada)
- Ambiente QA com integração IDwall ativa (SDK real)

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Iniciar fluxo de anúncio de imóvel PF | Etapa 1 carregada |
| 2 | Concluir Etapas 1–9 com dados válidos | Etapa 10 carregada |
| 3 | Preencher dados pessoais (Etapa 10) com CEP válido | Etapa 11 carregada |
| 4 | Aceitar consentimento e concluir biometria no SDK IDwall | Motor retorna `VALID` |
| 5 | Avançar da Etapa 11 para a Etapa 12 (revisão) | Tela de revisão do anúncio exibida |
| 6 | Confirmar o anúncio na Etapa 12 | Navegação para Etapa 13 |
| 7 | Verificar a tela de sucesso (Etapa 13) | Tela de confirmação de publicação exibida |

#### Resultados Esperados
- O fluxo completo de 13 etapas é concluído sem erros
- Anúncio publicado com sucesso

#### Critérios de Aceitação
- URL da Etapa 13 atingida após conclusão da biometria com status `VALID`
- Confirmação de publicação do anúncio visível na tela final

---

### CT24 - Etapa 12 (revisão) exibe status de verificação e CPF mascarado

**Status de automação:** Manual  
**Dependências:** CT09 aprovado (status `VALID` obtido). Etapa 12 acessível após verificação concluída.

#### Objetivo
Verificar que a tela de revisão do anúncio (Etapa 12) exibe o status de verificação de identidade como "Verificado" e apresenta o CPF do anunciante de forma mascarada (ex: `***.385.119-**`), sem expor o número completo.

#### Pré-Condições
- Usuário PF com verificação `VALID` concluída
- Etapa 12 (`?etapa=revisao` ou equivalente) acessível

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Avançar para a Etapa 12 após verificação `VALID` | Tela de revisão do anúncio carregada |
| 2 | Verificar a seção de dados pessoais/verificação de identidade na revisão | Status "Verificado" visível |
| 3 | Verificar a exibição do CPF na tela | CPF exibido de forma mascarada |

#### Resultados Esperados
- Status de verificação exibido como "Verificado" (ou equivalente)
- CPF exibido com máscara (apenas parte dos dígitos visível)

#### Critérios de Aceitação
- Status "Verificado" visível na Etapa 12
- CPF não é exibido em formato completo — máscara aplicada (ex: `***.XXX.XXX-**`)

---

## Bloco 9 — Guardas de Fluxo e Preservação de Estado

---

### CT25 - Acesso direto à Etapa 11 sem estado de fluxo redireciona

**Status de automação:** Automatizado  
**Dependências:** Nenhuma. Requer `localStorage['realtyPfFlow']` ausente ou vazio no domínio QA.

#### Objetivo
Verificar que a aplicação impede o acesso direto à tela de verificação de identidade quando as etapas anteriores não foram concluídas (guarda de rota).

#### Pré-Condições
- Usuário PF autenticado
- Nenhum estado de fluxo no `localStorage` (`realtyPfFlow` ausente ou sem as etapas 1–10 completas)

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Garantir que `localStorage['realtyPfFlow']` está vazio ou ausente | Estado limpo confirmado |
| 2 | Acessar diretamente a URL `?etapa=verificacao-identidade` pelo barra de endereço | Página carrega |
| 3 | Aguardar resolução da rota pelo sistema | Sistema detecta estado inválido |

#### Resultados Esperados
- URL muda para uma etapa anterior do fluxo (ex.: `?etapa=informacoes` ou Etapa 1)
- A tela de verificação de identidade **não** é exibida sem as pré-condições do fluxo

#### Critérios de Aceitação
- URL final **não** contém `etapa=verificacao-identidade`
- Usuário é redirecionado para uma etapa válida do fluxo

---

### CT26 - Abandono e retorno ao fluxo preservam o estado da verificação

**Status de automação:** Automatizado  
**Dependências:** CT06 aprovado (Etapas 1–11 ativas com estado no localStorage). Navegação externa e retorno à URL capturada.

#### Objetivo
Verificar que ao sair do fluxo de criação de anúncio e retornar, o estado da Etapa 11 é preservado e o usuário não é forçado a recomeçar do início.

#### Pré-Condições
- Usuário PF autenticado
- Etapas 1–11 em andamento (Etapa 11 carregada)

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Navegar até `?etapa=verificacao-identidade` com fluxo ativo | Tela de verificação exibida |
| 2 | Copiar / anotar a URL atual | URL anotada |
| 3 | Navegar para a página inicial (`/`) pelo menu ou barra de endereço | Página inicial carregada |
| 4 | Colar a URL da Etapa 11 na barra de endereço e pressionar Enter | Sistema processa a navegação |

#### Resultados Esperados
- A tela de verificação de identidade é restaurada
- O usuário **não** é redirecionado para a Etapa 1

#### Critérios de Aceitação
- URL permanece em `?etapa=verificacao-identidade` após o retorno
- Estado do fluxo (`realtyPfFlow` no localStorage) permanece íntegro após a navegação externa

---

## Resumo dos Casos de Teste

| ID | Nome | Tipo | Bloco | Status Automação | Prioridade |
|----|------|------|-------|------------------|------------|
| CT01 | Aviso de verificação na tela de escolha de plano | Positivo | 0 — Comunicação | Manual | Média |
| CT02 | Fluxo não avança sem aceitar consentimento | Regra de negócio | 0 — Comunicação | Manual | Alta |
| CT03 | Avanço com dados pessoais válidos | Positivo | 1 — Dados Pessoais | Automatizado | Alta |
| CT04 | CPF com dígitos repetidos | Negativo | 1 — Dados Pessoais | Automatizado | Alta |
| CT05 | Data de nascimento futura | Negativo | 1 — Dados Pessoais | Automatizado | Média |
| CT06 | Elementos obrigatórios da tela de biometria | Positivo | 2 — Interface Biometria | Automatizado | Alta |
| CT07 | Consentimento habilita botão de biometria | Regra de negócio | 2 — Interface Biometria | Automatizado | Alta |
| CT08 | Chamada à API IDwall ao clicar em "Tirar foto" | Integração | 2 — Interface Biometria | Automatizado | Alta |
| CT09 | Status VALID libera avanço para Etapa 12 | Positivo | 3 — Respostas IDwall | Automatizado | Alta |
| CT10 | Status INVALID bloqueia com mensagem | Negativo | 3 — Respostas IDwall | Automatizado | Alta |
| CT11 | Status MANUAL_APPROVAL exibe análise pendente | Fluxo alternativo | 3 — Respostas IDwall | Automatizado | Média |
| CT12 | IDwall exigido no fluxo de veículo PF | Escopo de produto | 4 — Perfil / Escopo | Fora de escopo | Média |
| CT13 | Usuário já verificado não repete biometria | Regra de negócio | 4 — Perfil / Escopo | Manual | Alta |
| CT14 | Operador aprova verificação manual | Backoffice | 4 — Perfil / Escopo | Manual | Alta |
| CT15 | Reprovação com mensagem curta (< 25 chars) rejeitada | Validação backoffice | 4 — Perfil / Escopo | Manual | Média |
| CT16 | Reprovação com mensagem válida; usuário vê bloqueio | Negativo backoffice | 4 — Perfil / Escopo | Manual | Alta |
| CT17 | Renovação de imóvel bloqueada em MANUAL_APPROVAL | Fluxo alternativo | 5 — Renovações | Manual | Média |
| CT18 | Renovação de veículo liberada após aprovação do operador | Fluxo alternativo | 5 — Renovações | Manual | Média |
| CT19 | Webhook CONCLUIDO/VALID atualiza status; idempotente | Integração assíncrona | 6 — Webhooks | Manual | Alta |
| CT20 | Webhook com protocolo desconhecido não gera erro 500 | Resiliência | 6 — Webhooks | Manual | Alta |
| CT21 | Usuário INVALID permanente bloqueado de criar anúncio | Negativo | 7 — Bloqueio / Segurança | Manual | Alta |
| CT22 | Tela de bloqueio sem dados biométricos expostos | Segurança | 7 — Bloqueio / Segurança | Manual | Alta |
| CT23 | Fluxo completo VALID até tela de sucesso (Etapa 13) | E2E positivo | 8 — Fluxo Completo | Manual | Alta |
| CT24 | Etapa 12 exibe status Verificado e CPF mascarado | Segurança / UI | 8 — Fluxo Completo | Manual | Média |
| CT25 | Acesso direto sem estado de fluxo redireciona | Guarda de rota | 9 — Guardas de Fluxo | Automatizado | Alta |
| CT26 | Retorno ao fluxo preserva estado da verificação | Persistência | 9 — Guardas de Fluxo | Automatizado | Média |
| CT27 | CEP pessoal ausente bloqueia avanço | Validação de campo | 1 — Dados Pessoais | Automatizado | Alta |
