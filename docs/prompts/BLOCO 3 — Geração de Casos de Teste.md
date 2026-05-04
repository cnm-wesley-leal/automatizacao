Quando usar: Para gerar o documento de casos de teste funcional (.md) antes da automação. É a base para o Bloco 4.

Com base no contexto do sistema fornecido, crie um documento completo de Casos de Teste funcional (blackbox) seguindo rigorosamente o modelo e as instruções abaixo.

## Escopo Obrigatório
Cubra:
- Cenários positivos (fluxo feliz)
- Cenários negativos (dados inválidos, erros esperados)
- Validação de campos obrigatórios
- Validação de regras de negócio
- Fluxos alternativos
- Controle de acesso por perfil de usuário (quando aplicável)

Não inclua:
- Testes de performance ou carga
- Testes de segurança avançados
- Testes automatizados (este documento é para execução manual)

## Modelo de Caso de Teste

Cada caso deve seguir exatamente este formato:

---

### CT[NN] - [Nome descritivo]

#### Objetivo
[O que está sendo validado, em uma frase clara.]

#### Pré-Condições
- [Condição necessária para executar o teste]

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1  | [Ação do usuário] | [Comportamento esperado do sistema] |

#### Resultados Esperados
- [Estado final esperado do sistema após todos os passos.]

#### Critérios de Aceitação
- [Critério objetivo e verificável]

---

## Instruções de Geração
1. Numere sequencialmente: CT01, CT02, CT03...
2. Gere no mínimo 2 casos por módulo: um positivo e um negativo
3. Cada ação nos passos deve ser clara o suficiente para execução sem ambiguidade
4. Inclua casos específicos para cada regra de negócio descrita
5. Inclua casos para cada perfil de usuário com comportamentos distintos
6. Gere o resultado em formato Markdown, pronto para salvar em `docs/tests/[nome-do-modulo].md`