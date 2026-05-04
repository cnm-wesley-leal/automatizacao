Quando usar: Para gerar todos os testes de um módulo de uma vez, com base nos casos de teste documentados.

Com base nos casos de teste do módulo [NOME DO MÓDULO] e na configuração do agente definida, gere a suite de testes completa.

## Casos de Teste do Módulo
[Cole aqui os casos de teste CT01, CT02... do módulo, no formato Markdown]

## Instruções

1. Agrupe todos os casos em um único arquivo usando describe/suite com o nome do módulo
2. Cada caso de teste vira um bloco de teste independente dentro do describe
3. Mantenha o ID do caso (ex: CT01) como parte do nome do teste para rastreabilidade
4. Aplique todas as regras de localizadores, asserções e isolamento definidas
5. Salve em `[DIRETÓRIO]/[nome-do-modulo].spec.[ext]`
6. Execute a suite completa e itere até todos os testes passarem
7. Informe o resultado final: quantos passaram, quantos falharam, e o motivo das falhas (se houver)

## Formato de Rastreabilidade Esperado
O nome de cada teste deve seguir o padrão:
`[CT-ID] - [nome descritivo do caso de teste]`

Exemplo: `CT01 - deve realizar cadastro com dados válidos`