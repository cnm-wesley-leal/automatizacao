Quando usar: Para revisar, refatorar ou padronizar testes já escritos conforme as regras do projeto.

Revise o(s) teste(s) abaixo e aplique as correções necessárias para conformidade com os padrões definidos.

## Arquivo(s) a Revisar
[cole o código ou informe o caminho do arquivo]

## Checklist de Revisão

### Localizadores
- [ ] Prioriza seletores por papel/função acessível?
- [ ] Evita seletores CSS/XPath frágeis?
- [ ] Evita dependência de índice ou ordem?

### Asserções
- [ ] Usa apenas asserções nativas com auto-retry?
- [ ] Valida estado inicial antes de interagir?
- [ ] Possui checkpoint após cada ação crítica?
- [ ] Confirma estado final ao término do fluxo?

### Tempo e Esperas
- [ ] Ausência de esperas fixas desnecessárias?
- [ ] Timeouts customizados justificados e documentados?

### Isolamento
- [ ] O teste é independente de outros testes?
- [ ] Cria seu próprio estado inicial?

### Organização
- [ ] Arquivo no diretório correto?
- [ ] Nomenclatura seguindo o padrão definido?
- [ ] Tipagem adequada (se aplicável)?

## Ação Esperada
Para cada item não conforme, explique o problema encontrado, mostre o trecho original e apresente a versão corrigida. Ao final, entregue o arquivo completo corrigido.