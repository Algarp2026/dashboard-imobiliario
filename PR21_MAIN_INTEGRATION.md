# PR #21: integracao final com a main

Main incorporada: `a6727b63fe42418da21b8b52e6351444cba6e9ec` (PR #20).
CRM aprovado: `9d939f3b6c76a1ef47519c3f1457732526815634` (PR #21).
Os quatro conflitos foram combinados manualmente, sem escolher ficheiros inteiros.

## Resolucao

- `tests/commercial-browser-regression.cjs`: uniao integral dos catalogos,
  incluindo BelaFormosa, renovacao/auto-sync e reconciliacao segura: 26 suites.
- `tests/commercial-client-complete-regression.cjs`: guardas de rollback, arquivo,
  CAS, autenticacao e reconciliacao mantidas; tabela analitica verificada pelos
  testes exatos, em vez de congelar os dados anteriores ao PR #20.
- `tests/commercial-composition-d2.test.js`: preservacao dos dados operacionais e
  alteracoes analiticas autorizadas combinadas com protecao do novo modulo.
- `vercel.json`: configuracao completa preservada; ambas as branches continuam
  com deployment desativado, especialmente `codex/safe-crm-reconciliation`.

As expectativas historicas de igualdade do CRM anterior ao PR #21 foram
substituidas por igualdade exata ao CRM aprovado, nao por exclusao de verificacoes.
`pr21-main-integration.test.js` compara integralmente os dois catalogos e
configuracoes e congela os ficheiros de cada origem aprovada.

## Verificacoes novas

- Runtime CRM, autenticacao, API, Apps Script, bundle/regras de integridade e
  `config.js` identicos ao PR #21 aprovado.
- `app.js`, CSS do comparador, `data.xlsx`, `data.json` e importador identicos a main.
- 39 recomendados conferidos individualmente: 29.675.000 EUR; Apt. 30-35 mantidos
  fora de comercializacao e Apt. 3/11 sem estacionamento.
- 216 fracoes BelaFormosa e 280 concorrentes anteriores preservados.
- Testes de precos mantem precos atuais ficticios independentes dos recomendados,
  sem alteracao de historico ou escrita ao consultar.
- Testes de reconciliacao verificam unidades distintas/mesma unidade, pedidos
  pendentes, eventos, arquivo, respostas perdidas, read tickets, CAS e conflitos.
- Navegador real: dispositivos independentes, propagacao sem F5, formularios
  abertos, Comercial/Precos/Comparador e recuperacao idempotente.
- Excel/JSON: correspondencia canonica, partes nativas, idempotencia e preservacao
  em copias temporarias; nenhuma alteracao ao ficheiro de dados do projeto.

Resultados desta execucao, incluindo eventuais falhas e repeticoes:
[`main-integration.json`](docs/safe-reconciliation/main-integration.json).
Nao foram reutilizados passes antigos como prova desta integracao.

Resultado: 58/58 suites Node, 26/26 suites de navegador, 4/4 testes Excel/JSON
e 127 verificacoes de sintaxe aprovados. Nenhuma suite falhou nesta execucao;
nao foi necessario repetir testes ou alterar regras comerciais.

Comandos executados: `node tests/commercial-client-complete-regression.cjs`,
`node tests/commercial-browser-regression.cjs`,
`python tests/test_belaformosa_workbook.py` e `node --check` dos ficheiros JS.
Servidores dedicados em loopback, CRM exclusivamente ficticio em memoria e
rede externa bloqueada. Nao houve leitura/escrita Google real, migracao real,
deployment ou merge para main. Manter PR #21 em Draft para auditoria.
