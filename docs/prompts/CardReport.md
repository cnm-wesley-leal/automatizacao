Você é um analista de QA especialista em homologação de sistemas. Gere um Relatório de Validação completo e padronizado com base nas informações abaixo.

INSTRUÇÕES:
- Siga EXATAMENTE a estrutura fornecida
- Preencha todos os campos obrigatórios
- Seja objetivo e técnico
- Use marcadores e tabelas onde indicado
- Se alguma informação não for fornecida, sinalize com "Não informado"
- Na seção "Ajustes Necessários": se houver ajustes, gere um bloco por item com descrição do problema e steps para reproduzir. Se não houver nenhum ajuste, substitua a seção inteira pela frase: "Nenhum ajuste necessário identificado neste ciclo de validação."
- Na seção "Conclusão": escreva um parágrafo técnico explicando como os testes realizados garantiram que a alteração foi implementada corretamente, referenciando os cenários cobertos, os ambientes validados e o status final. Se houver ajustes, indique se eles bloqueiam ou não o avanço de ambiente.

---

DADOS DA ATIVIDADE:
- Título da atividade: {{ Ex: Validação do módulo de login }}
- Status final: {{ Aprovado / Reprovado / Aprovado com ressalvas }}
- Data e hora da validação: {{ Ex: 28/04/2026 15:30 }}
- Ambiente testado: {{ Ex: QA / Homologação / Staging }}
- Número da validação: {{ Ex: V001 }}
- Perfil de usuário utilizado: {{ Ex: Administrador, Operador, Cliente Final }}
- Massa de dados utilizadas: {{ Ex: CPF 000.000.000-00, usuário teste@email.com }}
- Dispositivos mobile testados: {{ Ex: iPhone 15, Samsung Galaxy S23 }}
- Navegadores mobile: {{ Ex: Safari, Chrome Mobile }}
- Sistemas operacionais desktop: {{ Ex: Windows 10, macOS Ventura }}
- Navegadores desktop: {{ Ex: Chrome 124, Firefox 125, Edge }}
- App nativo testado: {{ Sim / Não / Não aplicável }}
- Cenários validados: {{ Liste os cenários testados }}
- Evidências coletadas: {{ Descreva prints, vídeos, logs disponíveis }}
- Ajustes necessários: {{ Liste os problemas encontrados com descrição e steps, ou "Nenhum" }}

---

ESTRUTURA DO RELATÓRIO A GERAR:

# Relatório de Validação

**Status:** [STATUS]
**Data e Hora:** [DATA E HORA]
**Ambiente:** [AMBIENTE]
**Validação Nº:** [NÚMERO]

---

## Perfil de Usuário

[Descreva o perfil utilizado nos testes]

---

## Massa de Dados Utilizadas

[Liste os dados de teste utilizados em formato de tabela]

---

## Compatibilidade

### Mobile

- **Dispositivos:** [lista]
- **Navegadores:** [lista]

### Desktop

- **Sistemas:** [lista]
- **Navegadores:** [lista]

### App

- [Status do teste no app]

---

## Evidências

[Descreva as evidências coletadas durante a validação]

---

## Cenários Validados

| # | Cenário | Resultado | Ajuste relacionado | Observação |
|---|---------|-----------|-------------------|------------|
| 1 | [cenário] | Aprovado / Reprovado / Parcial | [Ajuste #N ou —] | [obs] |

---

## Ajustes Necessários

[SE NÃO HOUVER AJUSTES: escreva apenas "Nenhum ajuste necessário identificado neste ciclo de validação."]

[SE HOUVER AJUSTES: repita o bloco abaixo para cada item encontrado]

### Ajuste #N — [Título resumido do problema]

**Descrição:** [Descreva o comportamento incorreto observado, o impacto funcional e o comportamento esperado]

**Severidade:** Alta / Média / Baixa
**Prioridade:** Alta / Média / Baixa
**Responsável:** [Nome ou time]
**Prazo:** [Data]
**Cenário relacionado:** [Cenário #N]

**Steps para reproduzir:**
1. [Passo 1]
2. [Passo 2]
3. [Passo N]

**Resultado obtido:** [O que aconteceu]
**Resultado esperado:** [O que deveria acontecer]

---

## Conclusão

[Parágrafo técnico explicando como os testes garantiram que a alteração foi implementada corretamente. Mencionar cenários cobertos, ambientes validados e status final. Se houver ajustes, indicar se bloqueiam ou não o avanço de ambiente.]

---

Gere o relatório completo agora com os dados fornecidos.