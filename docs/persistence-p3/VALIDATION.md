# Validacao P3 - 6 novembro 2026

## Ambiente e comandos

Node 24.22.1, Windows, Chrome 157.0.8103.39, Firefox Playwright 153.0 e WebKit Playwright 26.5. Viewports desktop 1440x1000 e mobile 390x844, perfis temporarios exclusivos e servidores loopback 53xxx. Fontes comerciais de teste e fixtures CRM sao sinteticas; as regressoes analiticas verificam os ficheiros versionados existentes, sem os alterar. Nenhuma leitura/escrita Google ou execucao no dashboard real.

```text
node tests/commercial-persistence-p3.test.js
node tests/commercial-persistence-p3-browser.mjs
node tests/commercial-persistence-p1-browser.mjs
node tests/commercial-persistence-p2-browser.mjs
node tests/commercial-browser-regression.cjs
```

Foram tambem executados todos os ficheiros `tests/*.test.js`, verificacao `node --check` dos JS/CJS/MJS e compilacao sintatica dos GS. O hotfix existente foi exercitado com `tests/helpers/active-write-preview.cjs` e `tests/commercial-active-write-browser.mjs`, sem os modificar.

Configurar `PLAYWRIGHT_MODULE`, `CHROME_EXECUTABLE` e `PLAYWRIGHT_BROWSERS_PATH` com dependencias locais. `P3_TEST_PORT` deve deixar livre tambem a porta seguinte. `P3_ARTIFACTS` aponta a resultados externos. O teste PDF de agrupamento suporta `PDF_LIB_MODULE`: foi indicado o `pdf-lib/cjs/index.js` ja instalado no runtime, sem instalar pacotes ou alterar testes.

## Resultado final

| Bateria | Resultado |
|---|---|
| Suites Node existentes e nova P3 | 73/73 aprovadas; oito casos especificos P3 |
| Sintaxe JS/CJS/MJS e GS | 184/184 aprovadas |
| Catalogo comercial de navegador | 34/34 suites com resultado final aprovado: 33 na passagem integral e a suite PDF apos resolver a dependencia local |
| P3 nativa multi-separador | 6/6 combinacoes, 20 grupos por combinacao, 120 resultados aprovados |
| Laboratorio P1 existente | 3/3 motores aprovados, incluindo caracterizacao dos defeitos operacionais ainda nao alterados |
| Laboratorio P2 existente | 6/6 combinacoes aprovadas |
| Hotfix #29 existente | Desktop/mobile aprovados, com 15 historicos e 14,84 MiB |

Nenhuma falha funcional permanece nos cenarios executados. A falha inicial de dependencia e as limitacoes abaixo nao foram omitidas nem reclassificadas como resultados de producao. **APTA PARA REVISAO LOCAL**, exclusivamente como nucleo experimental desativado, sem autorizacao de merge, deployment ou ativacao.

### Criterios de aceitacao

| Criterio | Evidencia |
|---|---|
| CAS IndexedDB real | P3-CAS-01 |
| Sem sobrescrita silenciosa | P3-CAS-01 e P3-HASH-RACE-01 |
| Propostas reconstruiveis apos reabertura | P3-CAS-01 e P3-ORIGINAL-BASE-01 |
| Pedidos imutaveis | P3-IMMUTABLE-01 e P3-ID-AND-DEDUP-01 |
| Estados dependem de provas | P3-STATES-01, P3-LOSS-01, P3-REOPEN-STATES-01 |
| Export de fotografia consistente | P3-EXPORT-01 e P3-BASES-01 |
| Quota/abortos sem falso sucesso | P3-QUOTA-01 e P3-BRANCH-QUOTA-01 |
| Multisseparador nos motores disponiveis | Matriz P3 6/6 |
| Regressoes comerciais mantidas | Node 73/73 e catalogo browser com 34 resultados finais aprovados |
| Nenhuma ativacao no produto | P3-RUNTIME-NOT-ACTIVATED e diff somente aditivo |

## Evidencia nova detalhada

- Oito casos Node exercitam guard de laboratorio, ausencia de ativacao no runtime, maquina de estados P1, tabela de oito combinacoes de versoes, fence independente, idempotencia, commit com resposta perdida, recibo adulterado, pendencia e revisao ultrapassada.
- Vinte grupos de verificacoes por combinacao navegador/viewport, em seis combinacoes. Sao transacoes IndexedDB nativas e paginas distintas da mesma origem/DB; nao e fake-indexeddb ou duas variaveis no mesmo processo.
- P3-CAS-01 inicia A/B em 10, confirma uma cabeca em 11 e uma branch duravel. Reabertura e exportacao reconstroem ambos payloads integralmente, incluindo precos, reservas, historicos e campos desconhecidos sinteticos.
- P3-HASH-RACE-01 suspende explicitamente crypto antes da transacao e permite outro separador gravar. O CAS impede sobrescrita depois da preparacao antiga.
- P3-EXPORT-01 captura snapshot, suspende verificacao/hash e altera o workspace noutra pagina. O envelope continua ligado a propria base/instancia; checksum e verificado independentemente.
- Os nove estados sao reabertos nos cenarios CAS, staging, resposta perdida, ack falhado, STORAGE_BLOCKED e reabertura explicita SENDING/REMOTE_COMMITTED. SYNCED tambem e verificado depois de reabrir.
- Recibo inventado, ID repetido com outro conteudo, operationId colidente, indice removido e corpo com versao adulterada nao provocam confirmacao nem substituicao silenciosa.

## Falhas exercitadas

QuotaExceededError e abortos sao **injetados** em operacoes reais IndexedDB. Foram testados staging, aceitacao da cabeca, preservacao da branch e ack. Verifica-se rollback, cabeca anterior, original recuperavel, ausencia de sucesso falso e retoma sem nova escrita remota ficticia. Nao sao ensaios de quota fisica esgotada.

O simulador reside no controlador de testes, fora do processo do navegador. Falha antes do envio, apos preparacao e apos commit conserva a identidade original. Uma resposta perdida depois de commit e recuperada sem segunda escrita. PENDING na fonte continua bloqueado, sem limpar operacao ou inventar novo ID.

No Chromium desktop foi forcado o encerramento apenas dos processos pertencentes ao perfil temporario P3. A reabertura do mesmo perfil recupera e valida a proposta original. Nao foi ensaiada falha de energia. Firefox/WebKit exercitam reload/reabertura normal, nao crash de processo.

## Compatibilidade e problemas encontrados

P1, P2 e hotfix #29 permanecem byte-logicamente inalterados no Git. A regressao P1 continua a reproduzir os dois defeitos do escritor/exportador operacional antigo: esta P3 desativada nao os corrige no produto. A nova biblioteca evita-os somente no laboratorio.

O piloto revelou que eventos de aborto subsequentes podiam substituir o erro original de quota: corrigido na biblioteca P3. A revisao encontrou tambem o ack de uma operacao SYNCED antiga a indicar incorretamente o estado de uma cabeca posterior: corrigido e coberto por P3-HISTORICAL-ACK-01. Indices de pedidos e metadados dos corpos passaram a ter protecoes explicitas contra reutilizacao/integridade insuficiente.

A inicializacao foi igualmente reforcada: uma base fornecida pelo chamador so e aceite se corresponder a leitura da fonte ficticia compativel. P3-BASES-01 rejeita uma base de outro conteudo sem criar workspace e depois testa duas fontes/bases distintas, cada uma corretamente vinculada.

P3-ORIGINAL-BASE-01 cobre uma proposta staged antes do ack de outra operacao da mesma instancia. Se o ack avancar a base e o commit da proposta antiga conflitar, a branch conserva a base original, nao a base nova da instancia. Esta correcao impede misturar base e proposta durante a exportacao.

Nos pilotos, uma rejeicao esperada retornada diretamente por page.evaluate surgiu como pageerror no Firefox. O controlador novo passou a capturar o resultado/erro dentro da pagina e a assertar o codigo no Node; erros inesperados continuam a reprovar o teste. Houve um timeout de arranque Firefox com erro grafico numa primeira tentativa; nao foi aumentado o timeout nem alterado o produto. As repeticoes completas usam os mesmos motores e limites.

Uma suite do catalogo comercial falhou inicialmente antes das assercoes por `MODULE_NOT_FOUND: pdf-lib`. Foi repetida com a dependencia local identificada atraves da variavel ja suportada pelo teste. Os resultados iniciais e a repeticao sao conservados separadamente em results.json; nao se apresenta a primeira passagem como integralmente verde.

## Limites e gates

- Provas de commit sao de laboratorio; nenhuma confirmacao oficial Google, OAuth ou cadeia B6 nova foi implementada.
- Quota nativa, eviction, modo privado, power loss e Safari/iOS reais permanecem pendentes. WebKit Playwright nao e Safari real.
- O CAS de snapshot completo e conservador e pode produzir contencao/BUSY sob muita atividade. Nao e uma otimizacao de desempenho nem politica final de retencao.
- O chamador conserva o handle de instancia; perda dessa capacidade exige recuperacao administrativa futura, nao identidade inventada.
- Nao existe migracao real, reconciliador comercial novo, GC, restauro remoto ou ativacao parcial. O rollback operacional futuro depende de leitores compativeis, nao de regressar cegamente ao escritor LS antigo.
- Antes de qualquer push manual, o utilizador deve confirmar as politicas de preview/deployment e ausencia de permissoes de escrita sobre producao. Nenhuma configuracao Vercel foi alterada aqui.

Os totais e resultados individuais finais constam de results.json. A aptidao e exclusivamente para revisao desta implementacao experimental; nao autoriza merge/publicacao nem iniciar P4.
