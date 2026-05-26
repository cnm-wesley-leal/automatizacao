# Casos de Teste — Criar Alerta de Anúncio

**Feature:** Alertas de novos anúncios — Chaves na Mão  
**Domínio:** Imóveis (v1.0)  
**Referências:**
- `01_Specs/00-especificacao-alertas-geral.docx` (v1.0 — 30/04/2026)
- `01_Specs/01-anexo-imoveis.docx` (v1.0 — 30/04/2026)
- [Monday — US: Criar Alerta](https://chavesnamao-team.monday.com/boards/18275745042/pulses/11082808077)
- [Monday — QA Test Plan](https://chavesnamao-team.monday.com/boards/18275745042/pulses/11914193171)

**Última atualização:** 19/05/2026  
**Responsável QA:** Wesley Leal

---

## Índice de Módulos

| Módulo | Descrição | CTs |
|--------|-----------|-----|
| M1 | Acesso e pré-condições de criação | CT01–CT04 |
| M2 | Validação de critérios obrigatórios (Imóveis) | CT05–CT08 |
| M3 | Regras de negócio: limite e duplicidade | CT09–CT10 |
| M4 | Fluxo de criação e confirmação | CT11–CT13 |
| M5 | Configuração de canais (Push & E-mail) | CT14–CT17 |
| M6 | Gerenciamento de alertas (área logada) | CT18–CT24 |
| M7 | Disparo por Push Notification | CT25–CT30 |
| M8 | Disparo por E-mail (Digest) | CT31–CT35 |

---

## M1 — Acesso e Pré-condições de Criação

---

### CT01 — Usuário logado com filtros visualiza botão "Criar Alerta"

#### Objetivo
Validar que o botão "Criar Alerta" é exibido na tela de listagem de anúncios de imóveis quando o usuário está autenticado e possui filtros aplicados.

#### Pré-Condições
- Usuário cadastrado e autenticado
- Acesso à tela de listagem de imóveis
- Ao menos um filtro aplicado na busca (finalidade + tipo + localização)

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Acessar a página de listagem de imóveis com filtros aplicados (ex.: Apartamentos > Comprar > Curitiba) | A listagem é exibida com os resultados correspondentes |
| 2 | Observar o cabeçalho/heading da listagem em desktop, ou o botão flutuante acima da bottom-nav em mobile | O botão "Criar Alerta" é exibido e está habilitado |
| 3 | Verificar o estado visual do botão | Botão apresenta texto "Criar Alerta" e está clicável |

#### Resultados Esperados
- Botão "Criar Alerta" visível e habilitado na listagem de imóveis com filtros preenchidos.

#### Critérios de Aceitação
- Em desktop: botão presente no heading da listagem de busca.
- Em mobile: botão flutuante visível acima da bottom-nav.
- Botão habilitado apenas quando critérios obrigatórios (finalidade, tipo, localização) estão preenchidos.

---

### CT02 — Usuário não logado clica em "Criar Alerta" (redirecionamento para login)

#### Objetivo
Validar que usuário não autenticado é redirecionado para a tela de login ao tentar criar um alerta.

#### Pré-Condições
- Usuário não autenticado (sessão encerrada ou sem conta)
- Acesso à tela de listagem de imóveis com filtros aplicados

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Acessar a listagem de imóveis sem estar logado, com filtros (finalidade + tipo + localização) | Listagem exibida normalmente |
| 2 | Clicar no botão "Criar Alerta" | Sistema redireciona o usuário para a tela de login |
| 3 | Realizar o login com credenciais válidas | Usuário é redirecionado de volta para a tela de criação de alerta com os mesmos critérios preservados (sem perda de contexto) |

#### Resultados Esperados
- Redirecionamento para login ao clicar em "Criar Alerta" sem autenticação.
- Após autenticação, o fluxo de criação é retomado com os critérios originais intactos.

#### Critérios de Aceitação
- Nenhum dado de filtro é perdido após o processo de login.
- Usuário não precisa reaplicar filtros manualmente após autenticar.

---

### CT03 — Usuário sem filtros obrigatórios preenchidos clica em "Criar Alerta"

#### Objetivo
Validar que o sistema bloqueia ou orienta o usuário quando nenhum filtro obrigatório está preenchido ao tentar criar um alerta.

#### Pré-Condições
- Usuário autenticado
- Tela de listagem de imóveis sem nenhum filtro aplicado (estado inicial)

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Acessar a listagem de imóveis sem aplicar nenhum filtro | Listagem exibe todos os imóveis disponíveis |
| 2 | Tentar clicar no botão "Criar Alerta" (se visível) | Botão exibido como desabilitado, OU o sistema exibe uma tela/aviso informando que filtros obrigatórios são necessários |
| 3 | Ler a mensagem de orientação exibida | Mensagem específica indica quais critérios obrigatórios estão faltando (finalidade, tipo de imóvel, localização) |

#### Resultados Esperados
- Criação do alerta impedida quando nenhum critério obrigatório está preenchido.
- Sistema exibe orientação clara sobre quais critérios são necessários.

#### Critérios de Aceitação
- Botão "Criar Alerta" desabilitado ou a ação bloqueada sem critérios obrigatórios.
- Mensagem de orientação específica (Regra 1.7 da spec geral).

---

### CT04 — CTA de criação de alerta exibido no fim de resultados ou em página sem conteúdo

#### Objetivo
Validar que o CTA de "Criar Alerta" é apresentado ao final da listagem ou em páginas de estado vazio.

#### Pré-Condições
- Usuário autenticado
- Busca com critérios que retornam poucos ou nenhum resultado

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Realizar busca de imóveis com filtros que resultem em zero ou poucos anúncios | Tela exibe estado vazio ou fim da listagem |
| 2 | Observar a tela de estado vazio ou o final da listagem | CTA "Criar Alerta" é exibido como opção de ação disponível |
| 3 | Clicar no CTA | Sistema direciona para o fluxo de criação de alerta com os filtros atuais |

#### Resultados Esperados
- CTA visível em cenários de zero resultado ou fim da listagem.
- Navegação para o fluxo de criação funciona normalmente a partir do CTA.

#### Critérios de Aceitação
- CTA aparece consistentemente em estados de zero resultados com filtros obrigatórios preenchidos.

---

## M2 — Validação de Critérios Obrigatórios (Imóveis)

---

### CT05 — Bloquear criação de alerta sem "Finalidade" selecionada

#### Objetivo
Validar que o sistema exige a seleção de Finalidade (Comprar ou Alugar) como critério obrigatório para criar alerta de imóvel.

#### Pré-Condições
- Usuário autenticado
- Filtros aplicados: Tipo de imóvel e Localização preenchidos, **Finalidade ausente**

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Acessar a listagem de imóveis com Tipo e Localização preenchidos, mas sem selecionar Finalidade | Listagem exibida |
| 2 | Clicar em "Criar Alerta" | Sistema bloqueia a ação e exibe mensagem informando que Finalidade é obrigatória |
| 3 | Verificar a mensagem exibida | Mensagem específica identifica "Finalidade" como critério faltante |

#### Resultados Esperados
- Criação bloqueada sem Finalidade.
- Feedback claro ao usuário sobre o critério faltante.

#### Critérios de Aceitação
- Sistema identifica especificamente "Finalidade" como campo obrigatório ausente (Regra 1.7).

---

### CT06 — Bloquear criação de alerta sem "Tipo de Imóvel" selecionado

#### Objetivo
Validar que o sistema exige ao menos um Tipo de imóvel selecionado para habilitar a criação do alerta.

#### Pré-Condições
- Usuário autenticado
- Filtros aplicados: Finalidade e Localização preenchidos, **Tipo de Imóvel ausente**

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Acessar a listagem com Finalidade e Localização preenchidos, sem Tipo de Imóvel | Listagem exibida |
| 2 | Clicar em "Criar Alerta" | Sistema bloqueia e informa que Tipo de Imóvel é obrigatório |
| 3 | Verificar a mensagem exibida | Mensagem identifica "Tipo de Imóvel" como critério faltante |

#### Resultados Esperados
- Criação bloqueada sem Tipo de Imóvel.

#### Critérios de Aceitação
- Sistema identifica especificamente "Tipo de Imóvel" como obrigatório (Regra 1.7).
- Pelo menos um tipo deve estar selecionado.

---

### CT07 — Bloquear criação de alerta sem "Localização" preenchida

#### Objetivo
Validar que o sistema exige ao menos um bairro ou cidade como critério de Localização para criar alerta.

#### Pré-Condições
- Usuário autenticado
- Filtros aplicados: Finalidade e Tipo de Imóvel preenchidos, **Localização ausente**

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Acessar a listagem com Finalidade e Tipo preenchidos, sem Localização | Listagem exibida |
| 2 | Clicar em "Criar Alerta" | Sistema bloqueia e informa que Localização é obrigatória |
| 3 | Verificar a mensagem exibida | Mensagem identifica "Localização" como critério faltante |

#### Resultados Esperados
- Criação bloqueada sem Localização.

#### Critérios de Aceitação
- Ao menos um bairro ou cidade inteira deve estar selecionado (Regra 1.4 + Anexo Imóveis §3).

---

### CT08 — Criar alerta com critérios opcionais (sugeridos) adicionados

#### Objetivo
Validar que o sistema aceita e salva critérios sugeridos opcionais (quartos, preço, área etc.) além dos obrigatórios.

#### Pré-Condições
- Usuário autenticado
- Filtros obrigatórios preenchidos: Finalidade + Tipo de Imóvel + Localização
- Filtros opcionais adicionados: Quartos (2+), Faixa de Preço (R$200k–R$500k), Garagens (1+)

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Aplicar filtros obrigatórios + opcionais na busca | Listagem refinada exibida |
| 2 | Clicar em "Criar Alerta" | Modal/tela de "Alerta de novos imóveis" é exibida |
| 3 | Verificar os critérios exibidos no modal (modo read-only) | Todos os critérios aplicados (obrigatórios + opcionais) estão listados corretamente |
| 4 | Clicar em "Salvar alerta" | Alerta criado com sucesso; tela de confirmação é apresentada |
| 5 | Verificar o nome gerado automaticamente | Nome do alerta segue padrão: "[Tipo] para [Finalidade] em [Localização]" (ex.: "Apartamentos para comprar no Batel") |

#### Resultados Esperados
- Alerta criado com todos os critérios opcionais salvos.
- Nome do alerta gerado automaticamente pelo sistema.

#### Critérios de Aceitação
- Critérios opcionais preservados no alerta sem intervenção manual do usuário.
- Nome automático correto (Regra 1.16 + Anexo Imóveis §5).

---

## M3 — Regras de Negócio: Limite e Duplicidade

---

### CT09 — Bloquear criação do 6º alerta (limite de 5 alertas ativos)

#### Objetivo
Validar que o sistema impede a criação de um sexto alerta quando o usuário já possui 5 alertas ativos, exibindo orientação para excluir um existente.

#### Pré-Condições
- Usuário autenticado com exatamente 5 alertas ativos criados (qualquer domínio)
- Filtros obrigatórios preenchidos na busca de imóveis

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Acessar a listagem de imóveis com filtros obrigatórios preenchidos | Listagem exibida com botão "Criar Alerta" |
| 2 | Clicar em "Criar Alerta" | Sistema bloqueia a criação e exibe mensagem informando que o limite de 5 alertas foi atingido |
| 3 | Verificar a mensagem e as opções disponíveis | Mensagem orienta o usuário a excluir um alerta existente para criar um novo |
| 4 | Verificar se há atalho para a área de gerenciamento de alertas | Link ou botão direcionando para "/alertas-de-busca/" é apresentado |

#### Resultados Esperados
- 6º alerta não é criado.
- Sistema exibe mensagem de bloqueio com orientação clara (Regra 1.8).

#### Critérios de Aceitação
- Criação bloqueada ao atingir 5 alertas ativos (contagem cross-domínio: imóveis + veículos).
- Mensagem de orientação exibida com caminho para gerenciar/excluir alertas existentes.

---

### CT10 — Bloquear criação de alerta duplicado

#### Objetivo
Validar que o sistema bloqueia a criação de um alerta com os mesmos critérios exatos de um alerta já existente, oferecendo atalho para visualizá-lo.

#### Pré-Condições
- Usuário autenticado
- Já existe um alerta ativo com os critérios: Comprar + Apartamento + Batel (Curitiba)

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Aplicar os mesmos filtros da busca: Comprar + Apartamento + Batel | Listagem exibida com os mesmos critérios |
| 2 | Clicar em "Criar Alerta" | Sistema detecta duplicidade e bloqueia a criação |
| 3 | Verificar a mensagem exibida | Sistema informa que já existe um alerta com esses critérios |
| 4 | Verificar o atalho disponível | Opção/link para visualizar o alerta existente é apresentada |

#### Resultados Esperados
- Alerta duplicado não é criado.
- Atalho para o alerta existente é exibido (Regra 1.9).

#### Critérios de Aceitação
- Duplicidade identificada por correspondência exata de todos os critérios preenchidos.
- Atalho funcional direcionando para o alerta existente.

---

## M4 — Fluxo de Criação e Confirmação

---

### CT11 — Criar alerta com sucesso (fluxo completo — happy path)

#### Objetivo
Validar o fluxo completo e bem-sucedido de criação de alerta de imóvel por usuário autenticado com critérios obrigatórios preenchidos.

#### Pré-Condições
- Usuário autenticado com menos de 5 alertas ativos
- Filtros aplicados: Comprar + Apartamento + Curitiba/Batel
- Nenhum alerta com os mesmos critérios já existe

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Acessar a listagem de imóveis com os filtros aplicados | Botão "Criar Alerta" exibido e habilitado |
| 2 | Clicar em "Criar Alerta" | Modal/tela "Alerta de novos imóveis" é aberta |
| 3 | Verificar os critérios exibidos no modal (somente leitura) | Critérios aplicados na busca estão refletidos corretamente no modal |
| 4 | Verificar o nome do alerta gerado automaticamente | Nome exibido segue padrão (ex.: "Apartamentos para comprar em Curitiba") |
| 5 | Clicar em "Salvar alerta" | Alerta criado com sucesso |
| 6 | Verificar a tela de confirmação (sucesso) | Tela de sucesso é apresentada com confirmação da criação |
| 7 | Verificar as opções na tela de sucesso | Botões "Gerenciar Alertas" e "Fechar" são exibidos |

#### Resultados Esperados
- Alerta criado e salvo com todos os critérios da busca.
- Tela de sucesso exibida após confirmação (Regra 1.15).

#### Critérios de Aceitação
- Alerta aparece na lista de alertas do usuário após a criação.
- Nome gerado automaticamente sem intervenção do usuário (Regra 1.16).
- Canais (push e e-mail) configurados automaticamente conforme permissões.

---

### CT12 — Fechar modal de criação sem salvar (botão "Fechar" / ícone X)

#### Objetivo
Validar que ao fechar o modal de criação de alerta, o usuário é retornado para a listagem sem que nenhum alerta seja criado.

#### Pré-Condições
- Usuário autenticado
- Modal "Alerta de novos imóveis" aberto após clicar em "Criar Alerta"

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Com o modal de criação aberto, clicar no botão "Fechar" ou no ícone "X" | Modal é fechado |
| 2 | Verificar a tela exibida após o fechamento | Usuário retorna para a listagem de anúncios com os filtros preservados |
| 3 | Verificar se algum alerta foi criado | Nenhum alerta novo consta na área de gerenciamento |

#### Resultados Esperados
- Nenhum alerta criado ao fechar o modal.
- Usuário retorna para a listagem de anúncios.

#### Critérios de Aceitação
- Estado da listagem preservado (filtros aplicados permanecem).
- Nenhum registro de alerta criado no sistema.

---

### CT13 — Navegar para gerenciamento de alertas pela tela de sucesso

#### Objetivo
Validar que o botão "Gerenciar Alertas" na tela de sucesso redireciona corretamente para a área logada de alertas.

#### Pré-Condições
- Usuário autenticado
- Alerta recém-criado com sucesso; tela de confirmação exibida

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Na tela de sucesso de criação, clicar em "Gerenciar Alertas" | Sistema redireciona para a rota "/alertas-de-busca/" |
| 2 | Verificar se o alerta recém-criado aparece na lista | O novo alerta está listado com nome, critérios e canais configurados |

#### Resultados Esperados
- Redirecionamento correto para a área de gerenciamento de alertas.
- Alerta criado visível na lista.

#### Critérios de Aceitação
- Rota "/alertas-de-busca/" acessível apenas por usuários autenticados.
- Alerta criado consta na listagem imediatamente.

---

## M5 — Configuração de Canais (Push & E-mail)

---

### CT14 — Criar alerta com permissão de push já concedida

#### Objetivo
Validar que o alerta é criado com canais push e e-mail ativos automaticamente quando a permissão de push já foi concedida pelo usuário no SO.

#### Pré-Condições
- Usuário autenticado com permissão de push concedida no dispositivo/navegador
- Filtros obrigatórios preenchidos

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Clicar em "Criar Alerta" e prosseguir com "Salvar alerta" | Alerta criado com sucesso |
| 2 | Acessar os detalhes do alerta em "/alertas-de-busca/" | Push: ativo; E-mail: ativo |
| 3 | Verificar que não foi exibida oferta de ativação de push | Nenhuma tela/modal de solicitação de permissão aparece (permissão já concedida) |

#### Resultados Esperados
- Push e e-mail ativos por padrão quando permissão já foi concedida (Regra 1.10).

#### Critérios de Aceitação
- Canais configurados automaticamente sem necessidade de ação adicional do usuário.

---

### CT15 — Oferta de ativação de push após criação (permissão ainda não concedida)

#### Objetivo
Validar que o sistema oferece a ativação do canal push imediatamente após a criação do alerta quando a permissão não foi concedida, sem bloquear o alerta.

#### Pré-Condições
- Usuário autenticado sem permissão de push concedida no dispositivo
- Filtros obrigatórios preenchidos

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Criar o alerta clicando em "Salvar alerta" | Alerta criado com sucesso |
| 2 | Verificar o que é exibido após a confirmação | Sistema exibe oferta para ativar notificações push (após tela de sucesso) |
| 3 | Aceitar a solicitação de permissão de push | Permissão concedida; push ativado para o alerta |
| 4 | Verificar os detalhes do alerta | Push: ativo; E-mail: ativo |

#### Resultados Esperados
- Alerta criado mesmo sem permissão de push.
- Oferta de ativação de push apresentada após confirmação (Regra 1.11).

#### Critérios de Aceitação
- Recusa da permissão push não cancela o alerta; alerta persiste com e-mail ativo (Regra 1.14).
- Oferta de push apresentada a cada nova criação enquanto permissão não concedida (Regra 1.12).

---

### CT16 — Recusar ativação de push mantém alerta ativo por e-mail

#### Objetivo
Validar que ao recusar a permissão de push após a criação do alerta, o alerta permanece ativo com canal de e-mail funcional.

#### Pré-Condições
- Usuário autenticado sem permissão de push concedida
- Alerta recém-criado com oferta de push exibida

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Na oferta de ativação de push, clicar em "Não" ou "Recusar" | Oferta é dispensada sem erro |
| 2 | Verificar os detalhes do alerta em "/alertas-de-busca/" | Push: desligado; E-mail: ativo |
| 3 | Confirmar que o alerta está salvo e funcional | Alerta listado normalmente com e-mail como canal ativo |

#### Resultados Esperados
- Alerta ativo exclusivamente por e-mail após recusa de push (Regra 1.14).

#### Critérios de Aceitação
- E-mail sempre ativo por padrão (Regra 1.10).
- Push desligado por padrão quando permissão não concedida.

---

### CT17 — Orientação ao usuário com push bloqueado no nível do SO

#### Objetivo
Validar que quando a permissão de push foi negada no SO (bloqueio permanente), o sistema orienta o usuário a habilitá-la nas configurações do dispositivo.

#### Pré-Condições
- Usuário autenticado com permissão de push **bloqueada** nas configurações do SO/navegador
- Alerta criado ou tentativa de ativar push na área de gerenciamento

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Ao exibir oferta de push (ou ao tentar ativar push na área de gerenciamento), verificar a mensagem exibida | Sistema não apresenta o prompt nativo do navegador (pois já foi bloqueado) |
| 2 | Verificar a orientação exibida ao usuário | Mensagem instrui o usuário a habilitar notificações nas configurações do dispositivo/navegador |

#### Resultados Esperados
- Usuário orientado corretamente quando push está bloqueado no SO (Regra 1.13).

#### Critérios de Aceitação
- Sem tentativa de prompt nativo ao usuário que bloqueou a permissão.
- Mensagem de orientação clara sobre como habilitar nas configurações.

---

## M6 — Gerenciamento de Alertas (Área Logada)

---

### CT18 — Visualizar lista de alertas na área logada

#### Objetivo
Validar que o usuário autenticado pode visualizar todos os seus alertas ativos na rota "/alertas-de-busca/", com as informações corretas exibidas.

#### Pré-Condições
- Usuário autenticado com ao menos 1 alerta ativo criado

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Acessar a rota "/alertas-de-busca/" | Página de alertas carregada |
| 2 | Verificar os alertas listados | Lista exibe todos os alertas ativos do usuário (imóveis e veículos) |
| 3 | Verificar as informações de cada card de alerta | Exibidos: tag de domínio, nome do alerta, resumo dos critérios principais e ações disponíveis |
| 4 | Verificar as ações disponíveis por alerta | Botões/ícones: "Ver resultados", "Configurar canais", "Excluir" presentes |

#### Resultados Esperados
- Lista de alertas exibida com informações completas (Regra 3.2).

#### Critérios de Aceitação
- Todos os alertas do usuário (cross-domínio) listados juntos com identificação visual de domínio.
- Critérios principais resumidos no card.

---

### CT19 — Visualizar detalhes (parâmetros de busca) de um alerta

#### Objetivo
Validar que o usuário pode expandir/acessar a tela de detalhes de um alerta para visualizar todos os critérios salvos em modo somente leitura.

#### Pré-Condições
- Usuário autenticado com ao menos 1 alerta ativo

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Na área de alertas, clicar no ícone "Ver parâmetros de busca" de um alerta | Tela de detalhes do alerta é aberta |
| 2 | Verificar os critérios exibidos | Todos os critérios salvos (obrigatórios + opcionais) são exibidos em modo somente leitura |
| 3 | Verificar que não há campos editáveis | Nenhum campo pode ser modificado diretamente na tela de detalhes |

#### Resultados Esperados
- Detalhes do alerta exibidos corretamente em modo read-only (Regras 3.3 e 3.4).

#### Critérios de Aceitação
- Sem campos de edição disponíveis na tela de detalhes.
- Todos os critérios do alerta exibidos fielmente ao que foi salvo.

---

### CT20 — Navegar para listagem de busca a partir dos resultados do alerta

#### Objetivo
Validar que o botão "Ver resultados de busca" na tela de detalhes do alerta direciona para a listagem com os filtros do alerta aplicados.

#### Pré-Condições
- Usuário autenticado
- Tela de detalhes de alerta aberta (critérios: Apartamentos para comprar em Curitiba)

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Na tela de detalhes do alerta, clicar em "Ver resultados de busca" | Sistema redireciona para a listagem de imóveis |
| 2 | Verificar os filtros aplicados na listagem | Filtros correspondem exatamente aos critérios do alerta (Comprar + Apartamento + Curitiba) |

#### Resultados Esperados
- Listagem abre com os filtros do alerta pré-aplicados.

#### Critérios de Aceitação
- URL ou estado da busca reflete os critérios do alerta.
- Ordenação padrão exibida normalmente.

---

### CT21 — Excluir alerta individualmente com confirmação

#### Objetivo
Validar que o usuário pode excluir um alerta individual após confirmação explícita, e que o alerta é removido permanentemente.

#### Pré-Condições
- Usuário autenticado com ao menos 2 alertas ativos (para confirmar que apenas 1 é excluído)

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Na área de alertas, clicar no ícone "Lixeira" de um alerta específico | Modal de confirmação de exclusão é exibido |
| 2 | Verificar o conteúdo do modal | Modal solicita confirmação; exibe nome do alerta a ser excluído |
| 3 | Clicar em "Sim" no modal de confirmação | Alerta excluído; lista atualizada sem o alerta removido |
| 4 | Verificar que os demais alertas permanecem | Outros alertas continuam listados normalmente |

#### Resultados Esperados
- Alerta excluído permanentemente após confirmação (Regra 3.5).
- Demais alertas não afetados.

#### Critérios de Aceitação
- Exclusão irreversível — alerta não aparece mais na lista.
- Confirmação explícita obrigatória antes da exclusão.

---

### CT22 — Cancelar exclusão de alerta (fechar modal de confirmação)

#### Objetivo
Validar que ao cancelar o modal de confirmação de exclusão, o alerta não é removido.

#### Pré-Condições
- Usuário autenticado
- Modal de confirmação de exclusão aberto para um alerta específico

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Com o modal de confirmação aberto, clicar em "Não" ou fechar o modal | Modal é fechado sem ação |
| 2 | Verificar a lista de alertas | Alerta permanece listado normalmente |

#### Resultados Esperados
- Nenhum alerta excluído ao cancelar a confirmação.

#### Critérios de Aceitação
- Estado da lista de alertas preservado após cancelamento.

---

### CT23 — Limpar todos os alertas com confirmação

#### Objetivo
Validar que a ação "Limpar alertas" remove todos os alertas do usuário após confirmação, exibindo o estado vazio.

#### Pré-Condições
- Usuário autenticado com 2 ou mais alertas ativos

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Na área de alertas, clicar no ícone "Limpar alertas" | Modal de confirmação de exclusão em massa é exibido |
| 2 | Clicar em "Sim" para confirmar | Todos os alertas do usuário são excluídos |
| 3 | Verificar a tela após a exclusão | Tela de estado vazio é apresentada |

#### Resultados Esperados
- Todos os alertas excluídos; tela de estado vazio exibida.

#### Critérios de Aceitação
- Nenhum alerta permanece após confirmação de limpeza.
- Estado vazio apresentado de forma adequada ao usuário.

---

### CT24 — Acesso a "/alertas-de-busca/" sem autenticação (rota protegida)

#### Objetivo
Validar que a rota "/alertas-de-busca/" é protegida e exige autenticação para acesso.

#### Pré-Condições
- Usuário não autenticado

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Tentar acessar diretamente a URL "/alertas-de-busca/" sem estar logado | Sistema redireciona para a tela de login |
| 2 | Realizar login com credenciais válidas | Usuário é redirecionado para "/alertas-de-busca/" após autenticação |

#### Resultados Esperados
- Rota protegida; acesso negado sem autenticação.

#### Critérios de Aceitação
- Redirecionamento para login ao acessar rota autenticada sem sessão ativa.
- Após login, retorno correto à rota solicitada.

---

## M7 — Disparo por Push Notification

---

### CT25 — Push disparado dentro da janela horária (7h–21h) com anúncio compatível

#### Objetivo
Validar que a notificação push é enviada quando há novo anúncio compatível com o alerta e o ciclo de verificação ocorre dentro da janela 7h–21h (Brasília).

#### Pré-Condições
- Usuário autenticado com alerta ativo (push: ligado, permissão concedida)
- Horário atual: entre 7h01 e 20h59 (Brasília)
- Novo anúncio compatível com os critérios do alerta publicado no portal

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Aguardar o ciclo de verificação horária executar (ou simular via ambiente de teste) | Sistema verifica anúncios novos compatíveis |
| 2 | Verificar o recebimento da notificação push no dispositivo do usuário | Push recebido com: Título identificando o alerta, Corpo com quantidade de novos anúncios |
| 3 | Tocar na notificação push | Sistema redireciona para a listagem de busca com os critérios do alerta, ordenada pelos mais recentes, com destaque para os novos anúncios |

#### Resultados Esperados
- Push enviado dentro da janela horária com conteúdo obrigatório (Regra 2.B.2 + 2.B.5).

#### Critérios de Aceitação
- Push contém: Título, Corpo descritivo, Ação (link para listagem ordenada por mais recentes).
- Listagem aberta com destaque visual para anúncios novos.

---

### CT26 — Push NÃO disparado fora da janela horária (antes das 7h / após as 21h)

#### Objetivo
Validar que anúncios que surgem fora da janela 7h–21h não disparam push imediatamente, sendo acumulados para o primeiro ciclo do dia seguinte às 7h.

#### Pré-Condições
- Usuário autenticado com alerta ativo (push ligado)
- Horário atual: fora da janela (ex.: 22h ou 5h)
- Novo anúncio compatível publicado no portal

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Aguardar um ciclo de verificação ocorrer fora da janela (ex.: às 22h) | Sistema não dispara push imediatamente |
| 2 | Verificar o dispositivo do usuário | Nenhuma notificação push recebida até as 7h do dia seguinte |
| 3 | Ao atingir as 7h do dia seguinte, verificar o recebimento | Push enviado com os anúncios acumulados do período fora da janela |

#### Resultados Esperados
- Push não enviado fora da janela 7h–21h (Regra 2.B.2).
- Anúncios acumulados e enviados no primeiro ciclo das 7h do dia seguinte.

#### Critérios de Aceitação
- Sem push entre 21h01 e 6h59 (Brasília).

---

### CT27 — Intervalo mínimo de 4h entre pushes consecutivos do mesmo alerta

#### Objetivo
Validar que o sistema respeita o intervalo mínimo de 4 horas entre dois pushes consecutivos do mesmo alerta, acumulando novos anúncios para o próximo ciclo elegível.

#### Pré-Condições
- Usuário com alerta ativo (push ligado)
- Push disparado às 8h para esse alerta

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Novo anúncio compatível surge às 9h (1h após o último push) | Sistema registra o anúncio mas não dispara push imediatamente |
| 2 | Verificar o dispositivo às 10h, 11h | Nenhum push enviado (intervalo de 4h ainda não atingido) |
| 3 | Ao atingir às 12h (4h após o push das 8h) e havendo anúncios acumulados | Push enviado com os anúncios acumulados |

#### Resultados Esperados
- Intervalo mínimo de 4h respeitado entre pushes do mesmo alerta (Regra 2.B.3).

#### Critérios de Aceitação
- Máximo de 4 pushes/dia por alerta (janela 7h–21h ÷ intervalo de 4h = até 4 ciclos, Regra 2.B.3.1).
- Alertas distintos operam independentemente.

---

### CT28 — Deduplicação de push: anúncio compatível com múltiplos alertas do mesmo usuário

#### Objetivo
Validar que um anúncio compatível com múltiplos alertas do mesmo usuário é enviado em push somente pelo alerta com mais critérios preenchidos (desempate: alerta mais recente).

#### Pré-Condições
- Usuário com 2 alertas ativos (push ligados):
  - Alerta A: Comprar + Apartamento + Curitiba (3 critérios)
  - Alerta B: Comprar + Apartamento + Curitiba + Quartos 2+ + Preço até 500k (5 critérios)
- Novo anúncio publicado compatível com AMBOS os alertas

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Aguardar o ciclo de push | Sistema avalia compatibilidade do anúncio com ambos os alertas |
| 2 | Verificar a notificação push recebida | Push enviado apenas pelo Alerta B (mais critérios preenchidos) |
| 3 | Confirmar que não houve push duplicado pelo Alerta A | Nenhum segundo push do mesmo anúncio enviado ao usuário |

#### Resultados Esperados
- Anúncio não enviado via push em múltiplos alertas ao mesmo usuário nas mesmas 24h (Regra 2.D.2).

#### Critérios de Aceitação
- Alerta com mais critérios preenchidos tem prioridade.
- Desempate por alerta mais recente quando critérios são iguais.

---

### CT29 — Anúncio reativado após +60 dias dispara push

#### Objetivo
Validar que um anúncio que ficou indisponível por mais de 60 dias e foi reativado é tratado como "anúncio novo" e dispara push.

#### Pré-Condições
- Usuário com alerta ativo (push ligado)
- Anúncio compatível com o alerta ficou indisponível há 61+ dias e foi reativado

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Aguardar o ciclo de verificação após a reativação do anúncio | Sistema considera o anúncio como "novo" |
| 2 | Verificar o recebimento de push | Push enviado com o anúncio reativado incluído |

#### Resultados Esperados
- Anúncio reativado após >60 dias trata-se como novo e dispara alerta (Regra 2.A.2).

#### Critérios de Aceitação
- Push recebido com o anúncio reativado incluso.

---

### CT30 — Anúncio reativado em menos de 60 dias NÃO dispara push

#### Objetivo
Validar que anúncio reativado em menos de 60 dias de indisponibilidade não é considerado "anúncio novo" e não dispara alerta.

#### Pré-Condições
- Usuário com alerta ativo (push ligado)
- Anúncio compatível ficou indisponível por 30 dias e foi reativado

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Aguardar o ciclo de verificação após a reativação do anúncio | Sistema identifica que o anúncio foi reativado em menos de 60 dias |
| 2 | Verificar o dispositivo do usuário | Nenhum push disparado para esse anúncio |

#### Resultados Esperados
- Anúncio reativado em <60 dias não gera notificação (Regra 2.A.2).

#### Critérios de Aceitação
- Sem push para reativações em até 60 dias de indisponibilidade.

---

## M8 — Disparo por E-mail (Digest)

---

### CT31 — E-mail digest enviado às 8h com anúncios compatíveis das últimas 24h

#### Objetivo
Validar que o e-mail digest é enviado diariamente às 8h (Brasília), consolidando anúncios novos das últimas 24h compatíveis com o alerta.

#### Pré-Condições
- Usuário autenticado com alerta ativo (e-mail: ligado, sem opt-out global)
- Ao menos 1 anúncio compatível publicado nas últimas 24h

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Aguardar o disparo diário às 8h | E-mail enviado para o endereço cadastrado do usuário |
| 2 | Abrir o e-mail recebido | E-mail contém: Assunto identificando o alerta, anúncios (foto, preço, localização, características), links para cada anúncio, rodapé com link para todos os resultados, gerenciar alertas e opt-out |
| 3 | Verificar que há no máximo 1 e-mail por alerta/dia | Nenhum segundo e-mail do mesmo alerta recebido no mesmo dia |

#### Resultados Esperados
- E-mail digest enviado às 8h com conteúdo obrigatório (Regras 2.C.2 + 2.C.5).

#### Critérios de Aceitação
- Máximo de 1 e-mail/dia por alerta (Regra 2.C.3).
- Rodapé com link de opt-out global obrigatório (Regra 2.C.5 — requisito LGPD).

---

### CT32 — E-mail digest limita exibição a 20 anúncios e oferece link para o restante

#### Objetivo
Validar que quando há mais de 20 anúncios compatíveis, o e-mail exibe apenas os 20 mais recentes e inclui link para a listagem completa.

#### Pré-Condições
- Usuário com alerta ativo (e-mail: ligado)
- Mais de 20 anúncios compatíveis publicados nas últimas 24h

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Receber o e-mail digest às 8h | E-mail recebido |
| 2 | Contar os anúncios exibidos no e-mail | Exatamente 20 anúncios exibidos (os mais recentes) |
| 3 | Verificar a presença do link de listagem completa | Link "Ver todos os resultados" ou equivalente presente no e-mail |
| 4 | Clicar no link da listagem completa | Listagem com todos os anúncios compatíveis é aberta |

#### Resultados Esperados
- E-mail exibe até 20 anúncios; excedentes acessíveis via link (Regra 2.C.4).

#### Critérios de Aceitação
- Máximo de 20 anúncios no corpo do e-mail.
- Link funcional para a listagem completa.

---

### CT33 — Opt-out global de e-mail desativa canal em todos os alertas

#### Objetivo
Validar que ao acionar o opt-out global de e-mail, o usuário não recebe mais e-mails de nenhum dos seus alertas ativos.

#### Pré-Condições
- Usuário autenticado com 2 ou mais alertas ativos (e-mail: ligado em todos)
- Link de opt-out global presente no e-mail digest recebido

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | No rodapé do e-mail digest, clicar no link de opt-out global | Página de confirmação de opt-out carregada |
| 2 | Confirmar o opt-out | Opt-out global ativado; confirmação exibida ao usuário |
| 3 | Aguardar o ciclo diário de e-mail do dia seguinte | Nenhum e-mail enviado para nenhum dos alertas do usuário |
| 4 | Verificar os detalhes dos alertas em "/alertas-de-busca/" | Canal e-mail exibido como desligado em todos os alertas |

#### Resultados Esperados
- E-mail desativado globalmente para todos os alertas (Regra 2.C.1).

#### Critérios de Aceitação
- Nenhum e-mail de alerta recebido após opt-out global.
- Push (se ativo) continua funcionando normalmente — opt-out afeta apenas e-mail.

---

### CT34 — Deduplicação de e-mail: anúncio compatível com múltiplos alertas enviado apenas uma vez

#### Objetivo
Validar que um anúncio compatível com múltiplos alertas do mesmo usuário aparece no e-mail apenas do alerta com mais critérios preenchidos.

#### Pré-Condições
- Usuário com 2 alertas ativos (e-mail: ligado):
  - Alerta A: Comprar + Apartamento + Curitiba (3 critérios)
  - Alerta B: Comprar + Apartamento + Curitiba + Quartos 2+ (4 critérios)
- Novo anúncio compatível com AMBOS os alertas

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Receber os e-mails digest do dia | E-mails dos dois alertas chegam (se ambos tiverem anúncios novos diferentes) |
| 2 | No anúncio compatível com ambos, verificar em qual e-mail ele aparece | Anúncio aparece apenas no e-mail do Alerta B (mais critérios) |
| 3 | Confirmar ausência no e-mail do Alerta A | O mesmo anúncio não consta no digest do Alerta A |

#### Resultados Esperados
- Anúncio não duplicado entre e-mails de alertas do mesmo usuário (Regra 2.D.3).

#### Critérios de Aceitação
- Alerta com mais critérios preenchidos priorizado. Desempate: alerta mais recente.

---

### CT35 — E-mail e push do mesmo dia para o mesmo anúncio (sem deduplicação entre canais)

#### Objetivo
Validar que um anúncio pode aparecer tanto no push quanto no e-mail do mesmo dia, pois não há deduplicação entre canais (comportamento intencional).

#### Pré-Condições
- Usuário com alerta ativo (push: ligado, e-mail: ligado)
- Novo anúncio compatível publicado que gerou push

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1 | Receber push com novo anúncio compatível durante o dia | Push recebido normalmente |
| 2 | No dia seguinte às 8h, receber o e-mail digest | E-mail recebido com os anúncios das últimas 24h |
| 3 | Verificar se o anúncio que gerou push também aparece no e-mail | Anúncio presente no e-mail (comportamento esperado e intencional) |

#### Resultados Esperados
- Mesmo anúncio pode aparecer via push e via e-mail (Regra 2.D.1 — intencional).

#### Critérios de Aceitação
- Ausência de deduplicação entre canais é comportamento especificado, não um defeito.

---

## Resumo de Cobertura

| # CT | Título | Tipo | Módulo | Regra(s) Cobertas |
|------|--------|------|--------|-------------------|
| CT01 | Botão "Criar Alerta" visível com filtros | Positivo | M1 | Regra 1.4, US Cenário 01 |
| CT02 | Usuário não logado redirecionado para login | Negativo/Alternativo | M1 | Regra 1.6, US Cenário 03 |
| CT03 | Bloqueio sem filtros obrigatórios | Negativo | M1 | Regras 1.4, 1.7, US Cenário 04 |
| CT04 | CTA em estado vazio/fim de listagem | Positivo | M1 | Regras 1.4, 1.7 |
| CT05 | Bloqueio sem Finalidade | Negativo | M2 | Regra 1.7, Anexo §3 |
| CT06 | Bloqueio sem Tipo de Imóvel | Negativo | M2 | Regra 1.7, Anexo §3 |
| CT07 | Bloqueio sem Localização | Negativo | M2 | Regra 1.7, Anexo §3 |
| CT08 | Criar alerta com critérios opcionais | Positivo | M2 | Regras 1.5, 1.16, Anexo §4, §5 |
| CT09 | Bloqueio ao atingir limite de 5 alertas | Negativo | M3 | Regra 1.8 |
| CT10 | Bloqueio de alerta duplicado | Negativo | M3 | Regra 1.9 |
| CT11 | Criar alerta (happy path completo) | Positivo | M4 | Regras 1.1–1.16, US Cenário 05 |
| CT12 | Fechar modal sem salvar | Negativo/Alternativo | M4 | US Cenário 06 |
| CT13 | Navegar para gerenciamento pela tela de sucesso | Positivo | M4 | US2 Cenário 01 |
| CT14 | Alerta criado com push ativo (permissão concedida) | Positivo | M5 | Regra 1.10 |
| CT15 | Oferta de ativação de push após criação | Positivo | M5 | Regras 1.11, 1.12 |
| CT16 | Recusar push mantém alerta por e-mail | Negativo/Alternativo | M5 | Regras 1.14, 1.10 |
| CT17 | Push bloqueado no SO — orientação ao usuário | Negativo | M5 | Regra 1.13 |
| CT18 | Visualizar lista de alertas | Positivo | M6 | Regras 3.1, 3.2 |
| CT19 | Visualizar detalhes somente leitura | Positivo | M6 | Regras 3.3, 3.4 |
| CT20 | Ver resultados de busca do alerta | Positivo | M6 | US2 Cenário 04 |
| CT21 | Excluir alerta com confirmação | Positivo | M6 | Regra 3.5, US2 Cenário 05 |
| CT22 | Cancelar exclusão de alerta | Negativo/Alternativo | M6 | Regra 3.5 |
| CT23 | Limpar todos os alertas | Positivo | M6 | US2 Cenário 06 |
| CT24 | Rota /alertas-de-busca/ protegida | Negativo | M6 | Regra 3.1 |
| CT25 | Push na janela horária 7h–21h | Positivo | M7 | Regras 2.B.1, 2.B.2, 2.B.5 |
| CT26 | Push bloqueado fora da janela | Negativo | M7 | Regra 2.B.2 |
| CT27 | Intervalo mínimo de 4h entre pushes | Regra de negócio | M7 | Regras 2.B.3, 2.B.3.1 |
| CT28 | Deduplicação de push entre alertas | Regra de negócio | M7 | Regra 2.D.2 |
| CT29 | Push para anúncio reativado >60 dias | Positivo | M7 | Regra 2.A.2 |
| CT30 | Sem push para reativação <60 dias | Negativo | M7 | Regra 2.A.2 |
| CT31 | E-mail digest às 8h | Positivo | M8 | Regras 2.C.1, 2.C.2, 2.C.5 |
| CT32 | Limite de 20 anúncios no e-mail | Regra de negócio | M8 | Regra 2.C.4 |
| CT33 | Opt-out global de e-mail | Alternativo | M8 | Regras 2.C.1, 4.1 |
| CT34 | Deduplicação de e-mail entre alertas | Regra de negócio | M8 | Regra 2.D.3 |
| CT35 | Sem deduplicação entre canais (push + e-mail) | Positivo | M8 | Regra 2.D.1 |

---

> **Nota:** Testes de performance (Artillery), carga e automação regressiva são tratados nas tasks QA 09 e 10 do Test Plan e estão fora do escopo deste documento.
