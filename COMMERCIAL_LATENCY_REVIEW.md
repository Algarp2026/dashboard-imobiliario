# CRM: latencia de leitura e gravacao

## Ambito e referencia

- Base: `a4a04ab` (main apos PR #17).
- Branch: `codex/measure-commercial-latency`.
- Apenas dados ficticios, rede Google simulada e navegador em loopback.
- Sem acesso a Google real, alteracoes de configuracao, merge ou deployment.

## Diagnostico

Tempos reais fornecidos pelo utilizador, nao recolhidos nesta intervencao:

| Operacao | Observacao de producao |
| --- | ---: |
| Gravacao completa | 7.371 ms |
| OAuth | 86 ms |
| Preflight Google | 1.097 ms |
| Chamada Google de gravacao | 6.170 ms |
| Leituras GET | aproximadamente 2.100 a 3.600 ms |

A chamada de gravacao representa aproximadamente 83,7% do total. O tempo da
Execution API inclui arranque, autenticacao no Script, operacoes Sheets,
processamento e transporte; nao identifica sozinho qual destas partes domina.
Nao existe evidencia para atribuir os 6.170 ms exclusivamente aos espelhos.

O percurso atual ja reutiliza OAuth dentro do pedido, usa preflight de capacidades
sem abrir Sheets e atualiza apenas espelhos com dependencias alteradas. Estas
otimizacoes dos PRs anteriores foram mantidas, nao apresentadas como trabalho novo.

### Custos preservados

Leitura: abrir fonte, snapshot B2:B6, reconstruir blocos, verificar comprimento,
SHA-256 e estrutura, verificar operacao pendente, repetir snapshot B2:B6.
Uma mudanca no controlo exige nova tentativa. Nao ha lock de escrita nas leituras.

Gravacao: autenticar, validar payload, esperar lock, ler baseline autoritativa,
serializar e calcular revisao, validar CAS/identificadores/recuperacao, validar
transicao comercial sob lock antes de B5, preparar backup e blocos imutaveis,
reler e validar blocos, verificar arquivo, atualizar espelhos afetados, confirmar
B6 e o JSON ativo, limpar B5. Timeouts continuam a significar resultado incerto,
nao autorizam um novo identificador nem repeticao com conteudo diferente.

## Alteracoes pequenas e justificadas

1. Reutilizar B5/B4 do snapshot ja adquirido sob o mesmo lock. Nenhum cache
   persiste entre pedidos. Na fonte em blocos evita uma releitura; na legada, duas.
2. Reutilizar o numero da ultima linha de BackupsVersions na mesma secao critica.
   Apendice, flush e releitura de verificacao continuam obrigatorios.
3. Escrever cabecalho e linhas de cada espelho numa unica chamada `setValues`.
   Manter limpeza de linhas antigas, cabecalho vazio e congelamento.
4. Devolver telemetria opcional de fases internas exclusivamente ao servidor
   autenticado. A API regista `source-summary`, associado ao identificador de
   correlacao que ja existia; nao propaga telemetria ao frontend.

Nao foram removidos preflight, barreiras flush, verificacao pos-escrita,
checksums, tickets, validacao comercial, revisoes, backups ou controlo B5/B6.
Nao foram alterados frontend, API publica, autenticacao, modelo de dados ou bundle
`google_commercial_integrity.gs`.

O agrupamento de operacoes segue as boas praticas oficiais:
https://developers.google.com/apps-script/guides/support/best-practices

## Instrumentacao e privacidade

`sourceMetrics.version=1` e opt-in via `diagnosticsVersion=1`, ja utilizado pela
API. Inclui tempo total interno e duracao/contagem por fase: abertura, metadados,
blocos, validacao dos blocos, validacao estrutural, preparacao do JSON/revisao,
validacao comercial, espera pelo lock, lock adquirido ate confirmacao, backup,
staging, arquivo, cada espelho, ativacao e limpeza.

`prepare` agrega serializacao canonica e hash; `chunk-validation` agrega
reconstrucao/hash/parse/validacao. Estas subdivisoes CPU nao foram artificialmente
separadas nem usadas para atribuir latencia Sheets. Fases aninhadas sao inclusivas:
nao somar todas as duracoes. O total interno nao inclui toda a autenticacao,
arranque do runtime nem serializacao/transporte da resposta Execution API.

A API aceita apenas nomes fixos, duracoes finitas e contagens limitadas; copia
exclusivamente os numeros permitidos. Dados extras ou telemetria malformada nao
invalidam uma gravacao confirmada. Sem payloads, nomes, emails, precos, revisoes,
IDs de pedidos ou mensagens livres nos novos logs. Fontes antigas sem telemetria
continuam compativeis.

## Comparacao local, nao Google

Fixture superior a 150.000 caracteres, 65 clientes ficticios e reservas ficticias
dos apartamentos 8 e 24. Comparacao com o codigo exato de `a4a04ab` no mesmo runner.

| Operacao medida no modelo | Antes | Depois |
| --- | ---: | ---: |
| Gravacao: operacoes instrumentadas, fonte em blocos | 32 | 28 |
| Gravacao: operacoes instrumentadas, fonte legada | 44 | 37 |
| Escritas de um espelho nao vazio | 2 | 1 |
| Barreiras flush, fonte em blocos | 7 | 7 |
| Barreiras flush, primeira migracao ficticia legada | 8 | 8 |
| Leitura em blocos: operacoes instrumentadas | 4 | 4 |

O modelo aplica 5 ms por operacao instrumentada: 160 -> 140 ms e 220 -> 185 ms.
Nao e uma previsao do tempo real. O fake inclui a chamada interna a getLastRow
do appendRow; estas contagens nao correspondem a pedidos HTTP observados.
O ganho demonstrado e a eliminacao de operacoes redundantes. Nao foi demonstrado
ganho real na leitura, nem um novo tempo de gravacao Google. Valores CPU locais
constam do ficheiro de metricas e nao fundamentam promessas de desempenho.

## Validacao

- Validacao inicial do commit `468dc53`: 52/52 suites Node, 4/4 suites de navegador relevantes e
  repeticao do teste de confirmacao lenta aprovadas. Sintaxe: 118 JS/TS e
  os dois ficheiros Apps Script aprovados. `git diff --check` sem erros.
- A repeticao integral pedida antes do merge encontra-se em
  [PR18_FULL_REGRESSION.md](PR18_FULL_REGRESSION.md), incluindo resultados iniciais,
  repeticoes, a correcao da espera exclusivamente num teste e riscos residuais.
- 52 suites Node: integridade comercial sob lock, CAS/conflitos, blocos/checksum,
  recuperacao PR #14/Apt.16, falsos rollback e quota/IndexedDB PR #15,
  diagnosticos e falhas OAuth/Execution API/Sheets PR #16, CRM PR #17.
- Nova suite de latencia compara a main, preserva estados/precos/eventos,
  verifica I/O, leitura consistente, espelhos vazios/encolhidos e interrupcoes
  em blocos, arquivo e antes/depois de B6; recuperacao/replay nao duplica backups.
- Suite de desempenho inclui telemetria malformada sem falha de confirmacao e
  compatibilidade nas duas ordens: API nova + Script anterior e API anterior +
  Script novo. Fonte anterior sem validacao comercial continua bloqueada.
- Navegador: quota real, pending antigo/reconciliacao, seguranca comercial e
  contactos, em desktop/mobile, com servidor e fonte ficticia em memoria.
- Teste adicional atrasa cada chamada ficticia 700 ms: copia local preservada,
  indicador de espera durante gravacao e sincronizado apenas apos confirmacao.

Os testes de contagem foram atualizados para exigir exatamente as reducoes
revistas, nao para aceitar qualquer reducao arbitraria. O agregador continua a
congelar o bloco inteiro de persistencia frontend e as funcoes fonte nao alteradas.
As seis funcoes fonte modificadas sao cobertas pelas suites obrigatorias de
latencia, integridade, recuperacao e concorrencia.

Comandos de reproducao:

```powershell
node tests/commercial-latency.test.js
node tests/commercial-persistence-performance.test.js
node tests/commercial-client-complete-regression.cjs
node scripts/build-commercial-integrity.js --check
node tests/commercial-browser-regression.cjs commercial-local-quota-browser.mjs commercial-pending-local-browser.mjs crm-reform-safety-browser.mjs commercial-contacts-browser.mjs
```

O navegador exige Playwright/Chrome e porta loopback dedicada entre 53000 e 53999;
ver variaveis `PLAYWRIGHT_MODULE`, `CHROME_EXECUTABLE`, `COMMERCIAL_TEST_PORT` no
runner existente. Nao usar dashboard, credenciais ou ficheiros de producao.

## UX durante a espera

Sem alterar a UI: os dados locais ficam preservados enquanto o indicador mostra
`Gravacao solicitada - A aguardar confirmacao`. So uma resposta valida, com
requestId e revisao esperados, permite marcar sincronizado. Falhas mantem pedido
original e exportacao/recuperacao acessiveis. O teste de espera cobre desktop e
mobile; nao transforma gravacao local em promessa de persistencia remota.

## Publicacao bloqueada e riscos residuais

- Branch com deployment Git automatico desativado; nao ha workflows GitHub neste
  repositorio. Nao foi iniciado qualquer deployment.
- A PR deve permanecer Draft. Sem merge, mudancas Google ou recuperacoes reais.
- Para medir Google: criar Sheet/Script de teste independentes, dados ficticios,
  `CRM_ENVIRONMENT=test`, API Preview autenticada e escrita restrita a essa fonte.
  Confirmar IDs antes de qualquer POST de teste. Este ambiente nao foi utilizado
  nem assumido existente.
- Comparar versoes anterior/nova na mesma fonte ficticia e condicoes, separar
  execucoes frias/quentes, recolher amostras repetidas e p50/p95. Correlacionar
  OAuth/preflight/read/write Vercel com source-summary e logs por fase Script.
- Manter teste de perda de confirmacao e recuperacao com mesmos IDs. Nunca usar
  dados reais ou disparar teste de falha sobre a Sheet comercial.
- Antes de futura autorizacao de producao, manter os dois ficheiros .gs no mesmo
  projeto: o bundle de integridade e indispensavel, embora nao tenha mudado aqui.
- Latencia e variabilidade reais do Google, custos de arranque e eventuais
  formulas Sheets continuam por medir. Nao foi removida integridade para obter
  ganho. Leituras nao ficaram mais baratas nesta entrega.

Ficheiros: `google_apps_script.gs`, `server/commercial-store.js`, `vercel.json`,
nova suite de latencia, quatro testes/agregadores adaptados, este relatorio e
resultados resumidos em `docs/commercial-latency/`.
