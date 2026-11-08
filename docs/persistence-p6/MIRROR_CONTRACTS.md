# Contratos das seis projecoes

Referencia executada: funcoes mirrorChanged_, mirrorClientes_, mirrorEventos_, mirrorAgentes_, mirrorEstadosVendas_, mirrorPrecosHistorico_, mirrorVendasComissoes_ e writeSheet_ do google_apps_script.gs atual. rulesHash e SHA-256 do ficheiro normalizado apenas em finais de linha. O harness recusa uma mudanca do codigo durante a sua vida, em vez de atribuir um hash antigo a regras novas.

| Folha | Dependencias completas | Colunas, por ordem |
|---|---|---|
| Clientes | clients | ID; Nome; Contacto; Email; NIF; Nacionalidade; Origem; AgentId; Agente; Agencia; Orcamento; Estado; Fracoes; Notas; Atualizado |
| Eventos | events | ID; Data; Hora; Tipo; ClienteId; Fracoes; Valor; Interesse; FollowUp; DataFollowUp; Objecoes; Notas; ComAgente; AgentId; TipoComissao; ValorComissao; Comissao |
| Agentes | agents | ID; Nome; Agencia; AMI; Contacto; Email; ComissaoPadrao; Notas; Atualizado |
| EstadosVendas | statuses; salePrices; unavailableReasons | Fracao; Estado; PrecoReservaVenda; MotivoIndisponivel |
| PrecosHistorico | priceHistory | Fracao; Data; Preco; PrecoAnterior; Motivo |
| VendasComissoes | saleCommissions | Fracao; ComAgente; AgentId; TipoComissao; ValorComissao; Comissao; ReceitaLiquida; EventoId; Data |

## Fidelidade

- Arrays mantem ordem de origem; os mapas usam sortKeys_ real, com ordenacao numerica quando aplicavel. Historicos mantem a ordem das entradas.
- text_ preserva a conversao atual: null/ausente para vazio, objetos por JSON.stringify, outros valores por String.
- numberOrBlank_ conserva numeros finitos/zero e conversao atual de strings numericas; campos vazios continuam vazios. Uma projecao com numeros nao finitos e recusada pelo contrato seguro, nao truncada ou corrigida.
- bool_ produz os textos Sim/Nao do codigo atual; list_ junta arrays com virgula/espaco. Datas sao os valores/textos enviados pelo codigo atual, sem conversao de fuso horario adicional.
- EstadosVendas conserva inclusive o fallback textual atual Disponivel para chaves provenientes de outros mapas. **Nao se preenche ou altera statuses na autoridade** com base nesse texto derivado.
- Identidades cliente/agente/evento, precos, valores de venda, comissao e receita liquida sao apenas projetados pelas funcoes existentes, sem novos joins ou calculos comerciais.

Hash de dependencia inclui cada estrutura completa, campos desconhecidos aninhados e a distincao entre chave ausente e valor presente. Um campo que nao aparece nas colunas pode mesmo assim obrigar a reescrita seletiva, como no escritor atual. Igualdade visual da tabela nao prova que o espelho foi criado numa revisao especifica.

Testes populam reservas, uma venda ficticia com agente, comissao/receita liquida, historico de precos, datas, zero/false, campos ausentes e desconhecidos. O teste seletivo executa crmWrite real em VM: mudar um campo aninhado desconhecido de events reescreve Eventos, e uma folha Agentes ausente e recriada sem eliminar verificacoes de outras folhas.

P6 compara valores enviados a Sheets, cabecalhos, linhas, colunas e tipos, nao screenshots de Excel/Sheets nem resultados calculados por formulas Google. A equivalencia com a apresentacao/locale/formulas do servico real continua pendente.
