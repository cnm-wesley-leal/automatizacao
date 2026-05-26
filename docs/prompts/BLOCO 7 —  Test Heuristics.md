# Test Heuristics Cheat Sheet — Guia de Referência para Testes de Software

> Baseado no conteúdo do Ministry of Testing (Simon Tomes, Elisabeth Hendrickson, James Lyndsay, Dale Emery e colaboradores).  
> Use este documento como referência ao gerar casos de teste, revisar estratégias de QA ou avaliar cobertura de testes.

---

## 1. Data Type Attacks (Ataques por Tipo de Dado)

Ao testar entradas de dados, sempre considere os seguintes cenários por categoria:

### Paths / Arquivos
- Nome longo (> 255 caracteres)
- Caracteres especiais no nome: `space * ? / \ | < > , . ( ) [ ] { } ; : ' " ! @ # $ % ^ &`
- Arquivo inexistente
- Arquivo já existente
- Sem espaço em disco / espaço mínimo
- Protegido contra escrita
- Indisponível / bloqueado
- Em máquina remota
- Corrompido

### Datas e Horas
- Timeouts
- Diferença de horário entre máquinas
- Cruzamento de fusos horários
- Dias bissextos (29/02)
- Dias sempre inválidos (30/02, 31/09)
- 29/02 em anos não bissextos
- Diferentes formatos: `June 5, 2001`, `06/05/2001`, `06/05/01`, `06-05-01`
- Internacionalização: `dd.mm.yyyy`, `mm/dd/yyyy`
- am/pm vs. 24 horas
- Mudança de horário de verão
- Resetar relógio para frente ou para trás

### Números
- `0`
- `32768` (2¹⁵), `32769` (2¹⁵ + 1)
- `65536` (2¹⁶), `65537` (2¹⁶ + 1)
- `2147483648` (2³¹), `2147483649` (2³¹ + 1)
- `4294967296` (2³²), `4294967297` (2³² + 1)
- Notação científica: `1E-16`
- Negativos
- Ponto flutuante/decimal: `0.0001`
- Com vírgulas: `1,234,567`
- Estilo europeu: `1.234.567,89`
- Todos os acima em cálculos

### Strings
- Longas: 255, 256, 257, 1000, 1024, 2000, 2048+ caracteres
- Caracteres acentuados: `àáâãäåçèéêëìíîðñòôõöö`
- Caracteres asiáticos: `漢字`
- Delimitadores e especiais: `" ' \` | / \ , ; : & < > ^ * ? Tab`
- Vazio / em branco
- Espaço simples / múltiplos espaços / espaços no início
- Caracteres de fim de linha (`^M`)
- SQL Injection: `'select * from customer`
- Emojis
- Aplicar em todas as ações: entrada, busca, atualização, etc.

### Geral
- Violar regras de domínio: IP `999.999.999.999`, e-mail sem `@`, idade `-1`
- Violar restrições de unicidade

---

## 2. Testes Web

### Navegação
- Botão Voltar (verificar mensagens "Expirado" e transações duplicadas)
- Refresh (F5)
- Favoritar a URL
- Selecionar favorito estando deslogado
- Hackear a URL (alterar/remover parâmetros)
- Múltiplas instâncias do navegador abertas
- Gestos: Swipe, Tap, Pinch

### Input
- Ver também: Data Type Attacks
- Injeção de HTML/JavaScript
- Verificar `maxlength` em campos de texto
- Mais de 5000 caracteres em TextAreas

### Sintaxe
- Validar HTML: https://validator.w3.org/
- Validar CSS: https://jigsaw.w3.org/css-validator/

### Preferências do Navegador
- JavaScript desligado
- Cookies desativados
- Segurança em nível alto
- Redimensionar janela do navegador
- Alterar tamanho de fonte

### Acessibilidade (A11y)
- **Teclado:** navegação, link "pular para conteúdo", sem armadilhas de foco, foco visível, popups acessíveis
- **Contexto:** links descritivos, alt-text, rótulos em formulários, linguagem simples, idioma definido
- **Conteúdo:** sem texto todo em maiúsculas, sem texto justificado, zoom 200%, linguagem neutra de gênero, bom contraste, não usar apenas cor para indicar status

---

## 3. Testes de API

Use os mnemonics abaixo como checklist ao testar APIs:

### BINMEN (Gwen Diagram & Ash Winter)
- **B**oundary — valores nos limites
- **I**nvalid Entries — entradas inválidas
- **N**ULL — valores nulos
- **M**ethod — métodos HTTP incorretos
- **E**mpty — corpo vazio
- **N**egative — valores negativos

### POISED (Amber Race)
- **P**arameters — parâmetros da requisição
- **O**utput — saída esperada
- **I**nterop — interoperabilidade
- **S**ecurity — segurança
- **E**rrors — tratamento de erros
- **D**ata — integridade dos dados

### VADER (Stuart Ashman)
- **V**erbs — verbos HTTP (GET, POST, PUT, DELETE, PATCH)
- **A**uthorisation/Authentication — autenticação e autorização
- **D**ata — dados enviados e recebidos
- **E**rrors — respostas de erro
- **R**esponsiveness — tempo de resposta

---

## 4. Testes Mobile / Dispositivos / Tablets

### MOBILE APP TESTING (Daniel Knott)
- **M**obile Device — tipo e versão do dispositivo
- **O**rientation — retrato e paisagem
- **B**rowsers — navegadores mobile
- **I**nterrupts — chamadas, notificações, alarmes
- **L**ook — aparência visual
- **E**nergy Consumption — consumo de bateria
- **A**utomation — cobertura automatizada
- **P**erformance — velocidade e fluidez
- **P**ersonas — perfis de usuário
- **T**ime & Date — fusos e formatos
- **E**rgonomics — usabilidade com uma mão, polegar, etc.
- **S**ecurity — permissões e dados sensíveis
- **T**racking — analytics e rastreamento
- **I**nputs — toque, voz, teclado externo
- **N**etwork — WiFi, 4G, 5G, offline, modo avião
- **G**uidelines — conformidade com diretrizes da plataforma (iOS/Android)

---

## 5. Heurísticas de Teste

Aplique estas heurísticas para expandir a cobertura e profundidade dos testes:

| Heurística | Como aplicar |
|---|---|
| **Variable Analysis** | Identifique tudo que pode mudar de valor — óbvio, sutil ou oculto |
| **TouchPoints** | Interfaces públicas/privadas para provocar, monitorar e verificar o sistema |
| **Boundaries** | Próximo ao limite (quase grande demais, quase pequeno demais) e exatamente no limite |
| **Goldilocks** | Grande demais, pequeno demais, e exatamente certo |
| **CRUD** | Create, Read, Update, Delete — teste todos os estados |
| **Follow the Data** | Sequência de ações verificando integridade: Entrar → Buscar → Relatório → Exportar → Importar → Atualizar → Visualizar |
| **Configurations** | Resolução de tela, velocidade de rede, latência, memória, disco, periféricos (0, 1, muitos monitores) |
| **Interruptions** | Logoff, Shutdown, Reboot, Kill Process, Disconnect, Hibernate, Timeout, Cancelar |
| **Starvation** | CPU, memória, rede ou disco ao limite máximo de capacidade |
| **Position** | Início, Meio, Fim (editar no início/meio/fim de uma linha) |
| **Selection** | Alguns, Nenhum, Todos (algumas permissões, nenhuma, todas) |
| **Count** | 0, 1, Muitos (0 transações, 1 transação, muitas simultâneas) |
| **Multi-User** | Criar, atualizar, deletar simultaneamente de duas contas |
| **Flood** | Múltiplas requisições simultâneas; clicar em submit várias vezes |
| **Dependencies** | Relações "tem um": Cliente tem Faturas → aplicar CRUD, Count, Position e Selection |
| **Constraints** | Violar restrições: campos obrigatórios vazios, combinações inválidas, IDs duplicados |
| **Input Method** | Digitação, Copiar/Colar, Importar, Drag/Drop, GUI vs. API |
| **Sequences** | Variar ordem das operações: Undo/Redo, Reverso, Combinar, Simultâneo |
| **Sorting** | Alfanumérico vs. numérico, através de múltiplas páginas |
| **State Analysis** | Identificar estados e transições; representar em diagrama ou tabela |
| **Map Making** | Estado base → um passo → voltar ao base → repetir em direções diferentes |
| **Users & Scenarios** | Casos de uso, Soap Operas, Personas, Personalidades extremas |

---

## 6. Mnemonics Adicionais

### RCRCRC (Karen N. Johnson)
- **R**ecent — o que foi alterado recentemente?
- **C**ore — funções essenciais que devem continuar funcionando
- **R**isky — funcionalidades inerentemente mais arriscadas
- **C**onfiguration Sensitive — código dependente de configurações de ambiente
- **R**epaired — código corrigido que pode ter gerado novos problemas
- **C**hronic — código que costuma quebrar com frequência

### FAILURE (Ben Simo)
- **F**unctional, **A**ppropriate, **I**mpact, **L**og, **U**I, **R**ecovery, **E**motions

### WWWWWHKE (Darren McMillan)
- **W**ho é para quem? **W**hat é para quê? **W**hen e por quem? **W**here onde é feito? **W**hy por quê? **H**ow como é feito? **K**nowledge & **E**xperience — quais perguntas isso gera?

### TORCH (Simon Tomes)
- **T**imer, **O**racles, **R**isks, **C**onsider these questions, **H**euristics

### MCOASTER (Michael Kelly)
- **M**ission, **C**overage, **O**bstacles, **A**udience, **S**tatus, **T**echniques, **E**nvironment, **R**isk

### TuTTu e TaTTa (Mark Winteringham)
- **Tu**sting the **U**I vs. **T**esting **T**hrough the **U**I
- **T**esting the **A**PI vs. **T**esting **T**hrough the **A**PI

### SACRED (Richard Bradshaw)
- **S**tate Management, **A**ctions, **C**odified Oracle, **R**eporting, **E**xecution, **D**eterministic

### TRIMS (Richard Bradshaw)
- **T**argeted, **R**eliable, **I**nformative, **M**aintainable, **S**peedy

### Diversidade & Inclusão (Callum Akehurst-Ryan / Ash Coleman)
- Funciona para mim?
- Funciona para eles?
- Funciona para alguém que nunca considerei ou conheci?

---

## 7. Frameworks de Análise

| Framework | Descrição |
|---|---|
| **Judgement** (James Lyndsay) | Inconsistências, Ausências e Extras em relação a referências internas, externas específicas ou culturais |
| **Observations** (James Lyndsay) | Input / Output / Linkage |
| **Flow** | Input / Processing / Output |
| **Requirements** (Gause & Weinberg) | Users / Functions / Attributes / Constraints |
| **Nouns & Verbs** | Objetos, ações, atributos (visível, idêntico) e descritores (rápido, lento, repetidamente) |
| **Deming's Cycle** | Plan → Do → Check → Act |

---

## 8. Sabedoria de Testes

- Um teste é um experimento projetado para revelar informação ou responder uma pergunta específica sobre o software.
- Stakeholders têm perguntas; testers têm respostas.
- Não confunda velocidade com progresso.
- Adote uma abordagem contrária.
- Observação é exploratória.
- Quanto mais estreita a visão, mais ampla a ignorância.
- Grandes bugs frequentemente são encontrados por coincidência.
- Bugs aparecem em clusters.
- Varie sequências, configurações e dados para aumentar a probabilidade de encontrar problemas.
- Tudo se resume às variáveis.
- Eu não sou todos os humanos — nem todos fazem as coisas do jeito que eu faço.

---

## 9. Segurança (OWASP-Based) — Complemento Sênior

> Testes de segurança não são responsabilidade exclusiva do time de segurança. Todo QA sênior deve conhecer e aplicar esses vetores.

### OWASP Top 10 — Checklist de Validação

| Risco | O que testar |
|---|---|
| **A01 - Broken Access Control** | Acessar recursos de outro usuário alterando IDs na URL/body; acessar rotas admin sem permissão; IDOR (Insecure Direct Object Reference); escalada vertical e horizontal de privilégios |
| **A02 - Cryptographic Failures** | Dados sensíveis em texto plano (senhas, tokens, PII); cookies sem flag `Secure` e `HttpOnly`; HTTPS forçado em todos os endpoints; algoritmos fracos (MD5, SHA1) |
| **A03 - Injection** | SQL Injection, NoSQL Injection, Command Injection, LDAP Injection, XPath Injection; testar todos os campos de entrada incluindo headers e parâmetros de URL |
| **A04 - Insecure Design** | Lógica de negócio quebrável; ausência de rate limiting em operações críticas; fluxos que podem ser ignorados (ex: pular etapa de pagamento) |
| **A05 - Security Misconfiguration** | Mensagens de erro expondo stack traces; headers de segurança ausentes; serviços desnecessários ativos; diretórios listáveis |
| **A06 - Vulnerable Components** | Dependências desatualizadas com CVEs conhecidos; verificar com ferramentas como `npm audit`, `OWASP Dependency-Check` |
| **A07 - Auth Failures** | Brute force sem bloqueio; tokens JWT sem expiração ou com algoritmo `none`; reset de senha por link previsível; sessão não invalidada no logout |
| **A08 - Software & Data Integrity** | Pipelines CI/CD sem verificação de integridade; atualizações automáticas sem validação de assinatura |
| **A09 - Logging Failures** | Ações críticas sem log (login, acesso a dados sensíveis, alterações de permissão); logs contendo dados sensíveis em texto plano |
| **A10 - SSRF** | Parâmetros de URL que fazem o servidor buscar recursos externos; testar com endereços internos: `http://localhost`, `http://169.254.169.254` (metadata AWS) |

### Headers de Segurança — Validação Obrigatória
```
Content-Security-Policy (CSP)
X-Frame-Options: DENY ou SAMEORIGIN
X-Content-Type-Options: nosniff
Strict-Transport-Security (HSTS)
Referrer-Policy
Permissions-Policy
```

### Testes de Autenticação e Sessão
- Token/cookie de sessão deve ser invalidado no servidor após logout
- Sessão deve expirar após período de inatividade
- Tokens JWT: verificar `alg`, `exp`, `aud` e `iss`; testar com `alg: none`
- Refresh tokens: rotação obrigatória após uso
- Multi-fator (MFA): testar bypass, replay de código OTP, brute force
- Senhas: testar política de complexidade, histórico, e reset seguro

### Dados Sensíveis (PII / LGPD / GDPR)
- Campos sensíveis mascarados na UI e nos logs: CPF, cartão, senha, token
- Dados sensíveis não aparecem em URLs (query string)
- Resposta de API não retorna campos além do necessário (over-fetching)
- Dados pessoais excluídos efetivamente ao solicitar deleção

---

## 10. Performance e Carga — Complemento Sênior

> Performance não é só "está rápido". É sobre comportamento do sistema sob diferentes condições de uso.

### Tipos de Teste de Performance

| Tipo | Objetivo | Quando aplicar |
|---|---|---|
| **Load Test** | Comportamento sob carga esperada | Antes de releases em produção |
| **Stress Test** | Ponto de quebra do sistema | Após mudanças de infraestrutura |
| **Soak/Endurance Test** | Estabilidade ao longo do tempo (memory leaks, degradação) | Sistemas que rodam 24/7 |
| **Spike Test** | Reação a picos súbitos de tráfego | Black Friday, campanhas, lançamentos |
| **Volume Test** | Comportamento com grande volume de dados | Sistemas com crescimento de base |
| **Scalability Test** | Capacidade de escalar horizontalmente | Arquiteturas cloud/microserviços |

### Métricas-Chave para Validar
- **Response Time:** P50, P90, P95, P99 — não apenas média
- **Throughput:** requisições por segundo (RPS) sustentável
- **Error Rate:** deve permanecer < 1% sob carga normal
- **Apdex Score:** índice de satisfação do usuário (alvo > 0.85)
- **Time to First Byte (TTFB):** < 200ms é referência aceitável
- **Concurrent Users:** validar o número definido como SLA
- **Resource Utilization:** CPU < 70%, memória sem crescimento contínuo

### Sinais de Problema a Observar
- Degradação progressiva de response time em soak tests (memory leak)
- Timeouts que aumentam proporcionalmente com a carga
- Erros 5xx que aparecem apenas sob pressão
- Queries N+1 reveladas sob volume de dados real
- Connection pool esgotado em picos

---

## 11. Testes de Contrato (Contract Testing) — Complemento Sênior

> Essencial em arquiteturas de microsserviços. Garante que produtor e consumidor de uma API estejam alinhados sem precisar de testes de integração end-to-end para tudo.

### Conceitos Fundamentais
- **Consumer-Driven Contract:** o consumidor define as expectativas; o produtor as valida
- **Provider Contract:** o produtor publica o que oferece; consumidores validam contra ele
- **Pact:** ferramenta padrão de mercado para contract testing

### O que Validar
- Estrutura do contrato (campos obrigatórios, tipos de dados)
- Contratos não quebram quando o produtor evolui (versionamento)
- Campos removidos ou renomeados no produtor sem comunicação ao consumidor
- Campos adicionados opcionais não quebram consumidores existentes
- Cenários de erro estão documentados e respeitados no contrato

### Estratégia de Versionamento de API
- Versionar APIs (`/v1/`, `/v2/`) antes de fazer breaking changes
- Manter versão anterior ativa por período de deprecação
- Testar que versões antigas continuam funcionando após deploy de nova versão
- Validar documentação OpenAPI/Swagger está sincronizada com a implementação real

---

## 12. Testes de Observabilidade — Complemento Sênior

> Testar não é só encontrar bugs antes do deploy. É garantir que, quando algo falhar em produção, o time consiga diagnosticar rapidamente.

### Os Três Pilares — O que Validar

**Logs**
- Ações críticas geram logs: login, logout, criação, atualização, deleção, acesso a dados sensíveis
- Logs têm nível adequado: `ERROR` para falhas, `WARN` para degradações, `INFO` para fluxos normais
- Logs são estruturados (JSON) e contêm: timestamp, correlation ID, usuário (anonimizado), ação, resultado
- Logs NÃO contêm dados sensíveis: senhas, tokens, CPF, cartão em texto plano
- Logs de erros contêm contexto suficiente para diagnóstico sem acesso ao ambiente

**Métricas**
- Endpoints críticos têm métricas de latência, taxa de erro e throughput
- Alertas configurados para thresholds de negócio (ex: taxa de erro > 1%, latência P99 > 2s)
- Dashboards refletem estado real do sistema, não apenas infraestrutura
- Métricas de negócio monitoradas: pedidos criados, pagamentos processados, conversão

**Tracing Distribuído**
- Requests cross-service têm correlation ID propagado em todos os logs e spans
- É possível rastrear uma requisição do frontend até o banco de dados
- Spans de operações lentas são identificáveis (queries, chamadas externas)

### Testes de Falha Controlada (Chaos Engineering básico)
- O que acontece quando um serviço dependente fica indisponível? (circuit breaker abre?)
- Fallback ou mensagem de erro adequada é exibida ao usuário?
- O sistema se recupera automaticamente quando o serviço volta?
- Timeouts estão configurados? O sistema não fica pendurado indefinidamente?

---

## 13. Testes de Dados e Banco de Dados — Complemento Sênior

### Integridade de Dados
- Constraints de banco (NOT NULL, UNIQUE, FK) refletidas nas validações da aplicação
- Transações: operações que devem ser atômicas falham completamente ou executam completamente (sem estado parcial)
- Rollback funciona corretamente em caso de erro no meio de uma transação
- Concorrência: dois usuários atualizando o mesmo registro simultaneamente — qual ganha? Há tratamento de conflito?

### Migrations e Evolução de Schema
- Migration nova funciona em banco com dados existentes (não só em banco vazio)
- Migration é reversível (rollback de migration disponível e testado)
- Campos removidos do schema não quebram versões anteriores da aplicação ainda em execução (deploy gradual)
- Índices adicionados sem lock de tabela em produção (migrações online)

### Qualidade dos Dados de Teste
- Dados de teste representam diversidade real: diferentes regiões, idiomas, formatos
- Dados de teste cobrem casos extremos: usuário sem pedidos, produto sem estoque, conta bloqueada
- Dados de produção anonimizados para uso em testes (quando aplicável)
- Seed de dados reproduzível: o mesmo estado inicial pode ser recriado a qualquer momento

---

## 14. Testes de Integração e Sistemas Externos — Complemento Sênior

### Integrações com Terceiros
- Testar com sandbox/mock do terceiro antes de usar produção
- Simular falhas do terceiro: timeout, 500, resposta malformada, resposta lenta
- Validar tratamento de webhooks: reentrega, idempotência, assinatura/verificação de origem
- Testar comportamento quando credenciais expiram ou são revogadas

### Filas e Mensageria (Kafka, RabbitMQ, SQS, etc.)
- Mensagem publicada é consumida exatamente uma vez (ou pelo menos uma vez com idempotência)
- Falha no consumidor: mensagem vai para dead-letter queue (DLQ)?
- Processamento fora de ordem: o sistema lida corretamente?
- Backpressure: o que acontece quando a fila acumula?
- Reprocessamento de mensagens da DLQ funciona sem duplicação

### Idempotência
- Reenviar a mesma requisição POST não cria duplicatas
- Operações financeiras e críticas têm chave de idempotência
- Retry automático do cliente não gera efeito colateral duplicado

---

## 15. Acessibilidade Avançada (WCAG 2.2) — Complemento Sênior

> Além do checklist básico. Validação real de acessibilidade exige testes com ferramentas e com usuários.

### Níveis WCAG — Alvo mínimo: AA
- **Nível A:** critérios fundamentais — sem alternativas de texto para imagens é falha Nível A
- **Nível AA:** padrão exigido por leis de acessibilidade (LBI no Brasil, ADA nos EUA, EN 301 549 na Europa)
- **Nível AAA:** melhor esforço — nem sempre 100% alcançável

### Ferramentas de Validação Automatizada
- **axe DevTools** (extensão de browser) — cobertura de ~57% dos critérios WCAG
- **Lighthouse** (Chrome DevTools) — acessibilidade + performance
- **WAVE** (WebAIM) — visualização de erros de acessibilidade no contexto
- **Pa11y** — automação em CI/CD

> ⚠️ Ferramentas automatizadas encontram apenas ~30-40% dos problemas reais. Testes manuais são insubstituíveis.

### Testes com Leitores de Tela
- **Windows:** NVDA (gratuito) + Firefox; JAWS + Chrome
- **macOS/iOS:** VoiceOver nativo
- **Android:** TalkBack nativo

O que validar com leitor de tela:
- Fluxo principal navegável sem mouse do início ao fim
- Formulários: todos os campos têm label lido corretamente
- Modais: foco move para o modal ao abrir; foco retorna ao elemento de origem ao fechar
- Tabelas de dados: headers de linha e coluna anunciados
- Imagens decorativas: `alt=""` para serem ignoradas
- Erros de validação: anunciados automaticamente (live region ou foco movido)

### Critérios WCAG 2.2 Adicionados (2023)
- **2.4.11 Focus Not Obscured (AA):** componente com foco não pode ficar totalmente oculto por outros elementos (ex: header sticky)
- **2.4.12 Focus Not Obscured Enhanced (AAA)**
- **2.4.13 Focus Appearance (AAA):** foco visível com contraste mínimo
- **2.5.7 Dragging Movements (AA):** toda funcionalidade de arrastar deve ter alternativa por clique/toque simples
- **2.5.8 Target Size (AA):** área de toque mínima de 24x24px
- **3.2.6 Consistent Help (A):** mecanismos de ajuda em posição consistente
- **3.3.7 Redundant Entry (A):** não pedir ao usuário informação já fornecida na mesma sessão
- **3.3.8 Accessible Authentication (AA):** não exigir habilidade cognitiva para autenticar (ex: resolver puzzles)

---

## 16. Testes de Regressão Visual — Complemento Sênior

> Mudanças de CSS/layout frequentemente quebram componentes em páginas não relacionadas. Regressão visual pega o que testes funcionais não veem.

### O que Validar
- Componentes não deslocados após mudanças de layout
- Responsividade em breakpoints definidos: 320px, 375px, 768px, 1024px, 1440px
- Dark mode / Light mode: texto legível em ambos, imagens e ícones adequados
- Temas e white-labels: variáveis CSS aplicadas corretamente
- Renderização cross-browser: Chrome, Firefox, Safari, Edge

### Ferramentas
- **Percy** (BrowserStack) — snapshots visuais em CI/CD
- **Chromatic** — regressão visual para Storybook
- **Playwright** — screenshots comparativos nativos
- **BackstopJS** — open source, configurável

### Estratégia
- Capturar baseline após estado estável aprovado
- Comparar a cada PR que toca CSS, componentes ou layouts
- Revisar diffs visualmente antes de aprovar como novo baseline
- Manter cobertura nos estados: default, hover, focus, disabled, error, loading, empty state

---

## 17. Qualidade de Código e Testes Estáticos — Complemento Sênior

> QA sênior não testa só o produto final — contribui com qualidade no processo de desenvolvimento.

### Code Review com Olhar de QA
- Novos endpoints têm validação de input?
- Erros são tratados ou apenas logados silenciosamente?
- Lógica condicional complexa tem testes unitários cobrindo os branches?
- Código novo introduz dependência desnecessária de estado global?
- Migrations de banco são reversíveis?

### Métricas de Cobertura de Testes
- **Cobertura de linha:** métrica mais fraca — código executado não significa testado
- **Cobertura de branch:** mais útil — verifica se `if/else` têm testes para ambos os caminhos
- **Cobertura de mutação (Mutation Testing):** mais poderosa — altera o código e verifica se os testes detectam; ferramentas: Stryker (JS/TS), PIT (Java)
- Alvo razoável: 80% de cobertura de branch em código de negócio crítico; 100% não é meta realista

### Testes de Contrato de Schema
- Respostas de API validadas contra schema OpenAPI/JSON Schema automaticamente
- Schemas versionados e revisados em PRs que alteram contratos

---

## 18. Estratégia de Priorização de Testes — Complemento Sênior

> Um dos maiores gaps de testadores menos experientes: testar tudo igualmente. QA sênior prioriza risco.

### Risk-Based Testing — Matriz de Priorização

Para cada funcionalidade, avalie:

| Critério | Peso | Perguntas |
|---|---|---|
| **Impacto no negócio** | Alto | Envolve dinheiro, dados pessoais, fluxo crítico? |
| **Frequência de uso** | Alto | Quantos usuários usam? Com que frequência? |
| **Complexidade técnica** | Médio | Quantas integrações? Lógica condicional complexa? |
| **Histórico de bugs** | Médio | Já quebrou antes? Código legado? |
| **Tamanho da mudança** | Médio | PR grande ou pequeno? Refatoração ou feature nova? |
| **Cobertura de testes existente** | Baixo | Já tem testes automatizados robustos? |

Funcionalidades com **alto impacto + alta frequência + baixa cobertura** são prioridade máxima.

### Pirâmide de Testes — Proporção Recomendada

```
         /\
        /  \   E2E (5-10%)
       /----\  — fluxos críticos de ponta a ponta
      /      \ Integration (20-30%)
     /--------\ — contratos, APIs, integrações
    /          \ Unit (60-70%)
   /____________\ — lógica de negócio, casos extremos
```

- **Unit:** rápidos, baratos, rodam a cada commit
- **Integration:** validam contratos entre componentes
- **E2E:** validam jornadas do usuário — poucos, mas representativos
- Evitar a pirâmide invertida (muitos E2E, poucos unitários): lento, frágil, caro

### Definition of Done de QA

Antes de considerar uma funcionalidade pronta para produção:

- [ ] Casos de teste cobrindo cenários felizes, alternativos e de erro
- [ ] Data Type Attacks aplicados nos inputs relevantes
- [ ] Testes de regressão executados e passando
- [ ] Testes de segurança básicos (OWASP) verificados
- [ ] Performance validada (se endpoint novo ou alteração de query)
- [ ] Logs e observabilidade validados
- [ ] Acessibilidade verificada (mínimo ferramentas automatizadas)
- [ ] Documentação atualizada (API, casos de uso, release notes)

---

## 19. Testes em Ambientes e Deploy — Complemento Sênior

### Validação de Configuração por Ambiente
- Variáveis de ambiente corretas para cada stage (dev, staging, produção)
- Feature flags: funcionalidade desligada por flag não vaza comportamento
- Secrets não hardcodados no código ou em logs
- URLs de serviços externos apontando para o ambiente correto

### Smoke Tests pós-Deploy
- Suite mínima que valida o sistema está vivo após cada deploy
- Executada automaticamente no pipeline após deploy em cada ambiente
- Cobre: autenticação funciona, fluxo principal responde, integrações críticas ativas
- Deve ser rápida (< 5 minutos) e altamente confiável (zero flakiness tolerada)

### Testes de Rollback
- Processo de rollback testado antes de ser necessário em produção
- Verificar que rollback não corrompe dados criados na versão nova
- Blue/Green ou Canary: validar que tráfego migra corretamente

---

## Como Usar Este Documento

Ao gerar casos de teste, planos de QA ou revisar cobertura:

1. **Identifique o tipo de dado** envolvido e aplique os ataques correspondentes da Seção 1.
2. **Verifique o canal** (Web, API, Mobile) e aplique as heurísticas específicas das Seções 2, 3 e 4.
3. **Aplique heurísticas gerais** da Seção 5 para expandir a cobertura além do óbvio.
4. **Use os mnemonics** da Seção 6 como checklists rápidos.
5. **Estruture a análise** com os frameworks da Seção 7.
6. **Aplique segurança** com o checklist OWASP da Seção 9 em qualquer funcionalidade que envolva autenticação, dados sensíveis ou inputs do usuário.
7. **Considere performance** usando os tipos e métricas da Seção 10 antes de releases.
8. **Valide observabilidade** com a Seção 12 — o sistema deve ser diagnosticável em produção.
9. **Priorize por risco** usando a matriz da Seção 18 quando o tempo for limitado.
10. **Use o Definition of Done** da Seção 18 como gate final antes de aprovar qualquer entrega.
11. **Questione sempre:** o que eu não estou vendo? Quem mais usa isso? O que acontece nos extremos? O que acontece quando falha?

### Mapa de Seções por Contexto

| Contexto | Seções Prioritárias |
|---|---|
| Feature nova com formulários | 1, 2, 9, 15 |
| Novo endpoint de API | 1, 3, 9, 10, 11, 13 |
| Feature com integração externa | 3, 10, 12, 14 |
| Release em produção | 10, 12, 18, 19 |
| Mudança de layout/CSS | 2, 15, 16 |
| Funcionalidade financeira/crítica | 9, 13, 14, 18 |
| Sistema de filas/eventos | 14, 12, 10 |
| Revisão de cobertura geral | 17, 18 |
