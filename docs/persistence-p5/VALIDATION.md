# Validacao P5

## Ambito

Branch local `codex/p5-historical-commit-proofs`, criada limpa a partir de origin/main apos fetch, exatamente em `f7cf18ae2f7b4427e2f608fd772d74f7251a0f22`. Sem push, PR, merge, deployment, Google real, migracao, limpeza de backups ou ativacao operacional.

Codigo e testes inteiramente novos. P1-P4, commercial.js, API, Apps Script, autenticacao operacional, UI, config, dados, precos, estados, PDFs e plantas permanecem inalterados. Evidencias agregadas e hashes dos ficheiros efetivamente testados em [results.json](results.json); requisitos em [traceability.csv](traceability.csv).

## Baterias

| Bateria | Cobertura |
|---|---|
| Todas as suites Node tests/*.test.js | 75/75 aprovadas; P1-P5, comercial, integridade, CAS, tickets, recuperacao e hotfix |
| Sintaxe | 198/198 aprovadas; JS/CJS/MJS por node --check; GS somente parse vm.Script |
| Catalogo comercial de navegador | 34/34 aprovadas; commercial-browser-regression.cjs sem alterar catalogo/testes/timeouts |
| P1 original | 3/3 motores, 21 verificacoes; caracterizacoes anteriores continuam a reproduzir os defeitos conhecidos |
| P2/P3/P4 originais | 6/6 combinacoes cada, 42/120/72 verificacoes; sem modificacoes |
| P5 nucleo | 17 grupos aprovados, com matriz de falhas e negativos independentes de navegador |
| P5 navegador | 6/6 combinacoes, 48 verificacoes; oito grupos por motor/viewport |
| Hotfix #29 | 2/2 aprovadas; fonte local ficticia com 15 copias/14.84 MiB, desktop/mobile |
| Benchmarks | 1/10/100 operacoes, recente/antiga/inexistente/limitada/incompleta |

Os resultados numericos finais constam de results.json. Nenhuma falha e escondida por aumento de timeout ou remocao de assercoes. As suites anteriores nao foram editadas. Chromium, Firefox e WebKit sao processos reais de navegador; a fonte e exclusivamente ficticia. Mobile e viewport em desktop, nao aparelho fisico.

## Dez pontos de interrupcao

| Falha injetada | Consulta posterior | Versao ativa |
|---|---|---|
| before-b5 | NOT_FOUND no dominio novo completo | Anterior |
| after-b5 | PENDING | Anterior |
| partial-chunks | PENDING | Anterior |
| after-chunks | PENDING | Anterior |
| after-manifest | PENDING | Anterior |
| after-backup | PENDING | Anterior |
| before-b6 | PENDING | Anterior |
| during-b6, apontador aplicado e resposta perdida | COMMITTED apenas apos releitura/prova | Nova |
| after-b6, B5 ainda presente | COMMITTED com prova integral | Nova |
| after-cleanup | COMMITTED com prova integral | Nova |

A matriz usa JSON ficticio superior a 150 mil caracteres. As retomadas autorizadas preservam identidade/conteudo e terminam com um unico commit. Blocos parciais/orfaos nao sao automaticamente eliminados. B6 malformado e ancestrais corrompidos sao testados separadamente: UNKNOWN, nao confirmacao por presumir que a escrita terminou.

## Provas essenciais

- A com resposta perdida, depois B e C: consultas fora de ordem, repetidas e apos reinicio retornam a prova exata, sem alterar B6 ou a fonte. Mesmo requestId com outro conteudo e BLOCKED. Conteudo igual com outro ID nao e reconhecido automaticamente como mesma operacao.
- UUIDs normais gerados pela P3 continuam aceites sem reescrever IDs. Duas operacoes distintas com payload igual podem ser explicitamente gravadas e provadas separadamente; retry exato nao duplica o commit.
- Manifesto orfao, flag confirmed, backup isolado, cadeia truncada, referencia circular/hash adulterado, blocos/versoes ausentes, descritor/pai incompativeis e formato antigo nunca produzem COMMITTED.
- Limites e falhas de leitura/timeout -> UNKNOWN. Consulta concorrente com gravacao muda a geracao e aborta a confirmacao; nova consulta coerente pode confirmar.
- Duas escritas com a mesma base/tickets: apenas uma confirma. A outra e recusada por CAS/lock sem substituir dados.
- Sessao ausente/revogada, scope ou fonte errados: acesso negado. Fonte aplica fence mesmo com API antiga ou ticket/header fabricado.
- Backend em ficheiro temporario e IndexedDB persistente reabrem sem perder historia ou fabricar ativacoes. Consultas nao modificam o ficheiro nem a fotografia da fonte.
- Fonte P5 ligada a P3/P4: A REMOTE_UNKNOWN, proposta local posterior e B remoto. Confirmar A preserva proposta/pedido/exportacao, devolve headSynced=false e mantem a fonte em B. Reabertura repete o resultado. Recibos laboratoriais continuam protegidos contra GC.
- Quota injetada antes de B6 numa transacao IDB nativa conserva B5 e pedido local; retoma explicita e recuperacao terminam em um commit, sem duplicacao nem sucesso falso.
- Erro assincrono nativo de pedido IndexedDB (ConstraintError provocado na fixture) rejeita compareExchange e aborta a transacao, sem sucesso falso. A fonte tambem verifica a referencia/resultRevision da ativacao antes de limpar B5 e devolver recibo.
- Uma intencao com checksum recalculado, mas timestamp semanticamente invalido, devolve UNKNOWN e nao pode ser retomada/ativada. Integridade de checksum nao substitui validacao de campos.
- Harness executa Apps Script operacional inalterado em VM para validar o formato de blocos e o limite da recuperacao historica atual. A validacao comercial real da VM corre no callback confiavel sob o lock ficticio antes de B5 nos ensaios Node.

## Reproducao

Node com Web Crypto e streams de compressao; Playwright e os tres motores locais. Todas as URLs de laboratorio devem ser http://127.0.0.1 em portas 53xxx. Nao configurar URL publica, credencial ou Sheet real.

```powershell
node tests/commercial-persistence-p5.test.js
$env:P5_ARTIFACTS="$env:TEMP/the-view-p5-validation"
node tests/commercial-persistence-p5-browser.mjs
$env:P5_BENCHMARK_OUTPUT="$env:TEMP/the-view-p5-benchmarks.json"
node tests/commercial-persistence-p5-benchmarks.mjs

Get-ChildItem tests/*.test.js | Sort-Object Name | ForEach-Object { node $_.FullName; if ($LASTEXITCODE) { throw $_.Name } }
$env:COMMERCIAL_TEST_PORT='53720'
$env:BROWSER_REGRESSION_OUTPUT="$env:TEMP/the-view-p5-commercial"
node tests/commercial-browser-regression.cjs
```

PLAYWRIGHT_MODULE/PLAYWRIGHT_BROWSERS_PATH/CHROME_EXECUTABLE apontam para dependencias locais, quando necessario; PDF_LIB_MODULE para pdf-lib do catalogo. Matrizes originais executadas sequencialmente com portas P1=53742, P2=53744/53745, P3=53746/53747 e P4=53748/53749. Hotfix: helper active-write-preview.cjs em 53760 e commercial-active-write-browser.mjs com origem exclusiva correspondente, encerrado pelo controlador no finally.

## Limitacoes e gates

- Autenticacao e autorizacao sao simuladas; OAuth/Execution API/Sheets reais nao foram integrados nem testados. Fonte/API futuras exigem publicacao coordenada e autorizacao separada.
- Snapshot por etapa em IDB/ficheiro nao demonstra atomicidade distribuida nem todas as falhas RPC Google. Quota e injetada; nao se afirma quota fisica esgotada.
- Reinicio normal e reabertura persistente testados na P5; nao se afirma resistencia a falha de energia. Crash Chromium pertence a matriz P4 original e nao constitui prova de crash do servidor Google.
- WebKit Playwright nao e Safari/iOS real. Navegadores/eviction/modo privado reais continuam gates posteriores.
- Lock persistido apos crash sem finally bloqueia conservadoramente; nao existe limpeza automatica/lease nem procedimento administrativo de desbloqueio nesta fase.
- Consulta verifica a cadeia inteira e copia a fonte; tempo/memoria crescem com o historico. Limites sao cooperativos, nao cancelam uma leitura em curso. Sem garantia de latencia de producao.
- Historico antigo sem provas nao e retroativamente confirmado e nao e migrado. A politica conservadora pode bloquear escrita de um dominio legacy ate resolucao aprovada.
- Hashes nao sao assinaturas nem defesa contra administrador que reescreva a fonte inteira. A integridade de B6 depende de fonte/autorizacao confiaveis.

O parecer desta entrega e **APTA PARA REVISAO/MERGE DO LABORATORIO DESATIVADO**. Nao e autorizacao de ativacao, recuperacao real, publicacao ou inicio de P6.
