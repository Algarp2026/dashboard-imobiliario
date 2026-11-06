# Validacao P4

## Resultado e ambito

**APTA PARA REVISAO/MERGE DO LABORATORIO DESATIVADO. NAO AUTORIZA ATIVACAO NO CRM.**

Base confirmada apos fetch: `b2411d7026ee53dab98e581c3fbf547b90be3e19`. Branch local `codex/p4-content-storage-retention`. Sem push, PR, merge, deployment, acesso Google, dados reais, migracao operacional ou alteracao de limites do arquivo real.

Evidencias agregadas, resultados individuais e SHA-256 dos seis ficheiros de codigo/teste validados: [results.json](results.json). Rastreabilidade: [traceability.csv](traceability.csv). As suites anteriores e os seus timeouts/asserts nao foram modificados.

| Bateria executada | Resultado |
|---|---|
| Todas as suites Node `tests/*.test.js` | 74/74, zero falhas |
| Casos P4 dentro da suite Node | 13/13 |
| Sintaxe JS/CJS/MJS e parse GS sem execucao | 189/189 |
| Catalogo comercial `commercial-browser-regression.cjs` | 34/34, zero falhas |
| P1 original, Chromium/Firefox/WebKit | 3/3 combinacoes, 21 verificacoes |
| P2 original, tres motores desktop/mobile | 6/6 combinacoes, 42 verificacoes |
| P3 original, tres motores desktop/mobile | 6/6 combinacoes, 120 verificacoes |
| P4, tres motores desktop/mobile | 6/6 combinacoes, 72 grupos de verificacoes |
| Hotfix #29 original, desktop/mobile | 2/2, zero erros |

Chromium 157.0.8103.39, Firefox 153.0, WebKit 26.5. Mobile e viewport 390x844 no desktop, nao dispositivo fisico. O catalogo comercial foi executado sequencialmente numa unica chamada; as matrizes independentes utilizaram portas/perfis separados. P1 continua a reproduzir defeitos operacionais caracterizados anteriormente; passar essa caracterizacao **nao** significa que a P4 os corrigiu.

## Verificacoes novas

- Conteudo UTF-16LE com NUL/surrogates isolados; grafos com ciclos, Map, Set, Blob e typed arrays. Distincao rawHash/encodedHash/payloadHash/requestHash.
- Gzip adulterado, tamanhos incoerentes, codec/versao desconhecidos, decoder ausente, expansao real superior a 32 MiB mesmo com envelope a declarar um byte.
- Duas abas deduplicam o mesmo corpo; duas operacoes e uma branch partilham um corpo sem perder a reconstrucao independente.
- Corpo e audit sao atomicos: quota e abortos nao deixam sucesso falso. Colisoes/inconsistencias sao erros, nao substituicoes.
- Analise antiga aborta apos mudanca de pin. Corrida entre GC e nova referencia nao produz referencias pendentes sem corpo. Lista de candidatos adulterada pelo chamador nao e autoridade.
- Compressao corre fora da transacao; alteracao concorrente durante o stream aborta a fotografia obsoleta.
- Preparacao COW duravel e relida antes da troca. Quota na preparacao e no delete final, aborto, reabertura com preparacao pendente e retomada conservam representacoes recuperaveis. P3 continua a operar com preparacao P4 presente.
- Pedidos imutaveis, branch, recibo sintetico, recuperacao idempotente e exportacoes P3 reconstruiveis com corpos comprimidos.
- Hashes de base/pedido incompativeis, metadados desconhecidos, dependencias embutidas e classificacao historica artificialmente alterada bloqueiam GC.
- Fonte legacy nativa ficticia com 15 historicos e aproximadamente 14.84 MiB, os dois slots do hotfix, gzip, checkpoints, pedidos incertos e alteracoes posteriores: hash da origem antes/depois identico; 22 fragmentos reconstruidos integralmente; desconhecidos conservam identity e bloqueiam limpeza.
- Hotfix #29 continua a gravar/reabrir com historico cheio, sem POST sem pedido duravel, sem alteracoes em reservas/precos/eventos, com perda de resposta e recuperacao idempotente.

## Reproducao

Necessarios Node com Web Crypto/CompressionStream, Playwright e motores instalados. Executar na raiz; nenhum teste deve apontar a URL publica ou fonte real.

```powershell
# Todas as suites Node, cada ficheiro deve terminar com exit code 0.
Get-ChildItem tests/*.test.js | Sort-Object Name | ForEach-Object { node $_.FullName; if ($LASTEXITCODE) { throw $_.Name } }
node tests/commercial-persistence-p4.test.js

# PLAYWRIGHT_MODULE aponta para o modulo Playwright instalado; CHROME_EXECUTABLE e opcional.
# PLAYWRIGHT_BROWSERS_PATH aponta para os motores locais de teste.
$env:P4_TEST_PORT='53600'
$env:P4_ARTIFACTS="$env:TEMP/the-view-p4-validation"
node tests/commercial-persistence-p4-browser.mjs

$env:COMMERCIAL_TEST_PORT='53612'
$env:BROWSER_REGRESSION_OUTPUT="$env:TEMP/the-view-p4-commercial"
# PDF_LIB_MODULE aponta para pdf-lib instalado quando nao resolvido localmente.
node tests/commercial-browser-regression.cjs
```

Tambem executados sem alteracoes: `commercial-persistence-p1-browser.mjs`, `commercial-persistence-p2-browser.mjs` e `commercial-persistence-p3-browser.mjs`, cada um com o seu servidor loopback dedicado. Hotfix: `tests/helpers/active-write-preview.cjs` iniciado em processo local com `PHASE2A_TEST_PORT=53630`, seguido de `commercial-active-write-browser.mjs` com `COMMERCIAL_TEST_ORIGIN=http://127.0.0.1:53630`; servidor terminado no finally do controlador.

Sintaxe: `node --check` em cada JS/CJS/MJS encontrado por `git ls-files -co --exclude-standard`; GS apenas analisado por `new vm.Script`, nunca executado. `git diff --check` sem erros. Nenhum teste existente foi removido ou relaxado.

## Alteracoes de compatibilidade

Unico ficheiro anterior alterado: `experimental/persistence-p3/store.mjs`. Opcoes explicitamente fornecidas de codec/stores; por defeito continuam schema 1, codec P2 e os sete stores anteriores. A matriz P3 original passou sem mudancas. A P3 nao importa P4.

P4 usa destino experimental separado, schema 2. Le identity v1 e gzip v2; nao promete que um leitor P3 antigo sem opt-in consiga abrir/escrever essa DB. Tal leitor falha com incompatibilidade de versao, em vez de reinterpretar gzip. As DBs operacionais e shadow antigas nao sao atualizadas.

## Riscos e gates ainda abertos

1. Quota **injetada** demonstrada em transacoes nativas. A sonda CDP limitada a 2 MiB adicionais nao alcancou quota nativa; este gate nao foi dado como aprovado.
2. Crash real de processo Chromium/reabertura testado; Firefox/WebKit apenas reabertura normal. Nenhuma prova de falha de energia ou durabilidade fisica absoluta.
3. WebKit Playwright nao valida Safari/iOS reais. Ausencia de decoder bloqueia leitura do corpo gzip sem o eliminar; outros navegadores exigem validacao propria antes de ativacao.
4. Latencia WebKit piorou em varias operacoes. Ganho de espaco nao e garantia de ganho de velocidade. Ver BENCHMARKS; afinacao e novas medicoes sao necessarias antes de ativacao real.
5. Fotografias completas, verificacao e COW consomem memoria/espaco temporario. Ha limite de 32 MiB por corpo comprimivel; nao e o limite da base comercial operacional. Corpos demasiado grandes falham explicitamente sem substituir o anterior.
6. Arquivos opacos continuam protegidos; GC nao resolve por si o arquivo real cheio. Nao ha limpeza automatica ou desprotecao por idade/exportacao/checksum.
7. Provas remotas autenticadas, fence com escritores antigos, migracao autorizada e politica comercial de pruning pertencem a gates posteriores. Recibos aqui sao exclusivamente sinteticos.
8. Os hashes de proveniencia detetam corrupcao, nao um atacante com acesso total a reescrever a DB. Nao e uma nova camada de autenticacao.

Nenhum risco acima e ocultado por ativacao no produto: **P4 permanece integralmente desativada no CRM**. O parecer positivo limita-se ao codigo experimental para revisao. Nao foi iniciada P5 nem qualquer operacao de publicacao.
