# Validacao P6

## Parecer e ambito

**APTA PARA REVISAO/MERGE DO LABORATORIO DESATIVADO. NAO AUTORIZA ATIVACAO REAL.**

Base `145736d9ee77b9abdd614e991be01f69d5d10e27`, confirmada por fetch. Branch local `codex/p6-mirror-recovery-copy`, inicialmente limpa. Todos os ficheiros desta entrega sao novos. Nenhum ficheiro P1-P5, operacional, configuracao, preco, estado, PDF, planta ou interface foi alterado.

Resultados individuais e hashes dos ficheiros testados: [results.json](results.json). Requisitos e limites: [traceability.csv](traceability.csv).

| Bateria executada | Resultado |
|---|---|
| Suites Node tests/*.test.js | 76/76 aprovadas |
| Casos P6 no nucleo | 19 grupos aprovados, com varias matrizes de falhas |
| Sintaxe JS/CJS/MJS e parse GS | 208/208 aprovadas |
| Catalogo comercial de navegador | 34/34 aprovadas, uma execucao sequencial |
| P1 original | 3/3 motores, 21 verificacoes |
| P2 original | 6/6 combinacoes, 42 verificacoes |
| P3 original | 6/6 combinacoes, 120 verificacoes |
| P4 original | 6/6 combinacoes, 72 verificacoes |
| P5 original | 6/6 combinacoes, 48 verificacoes |
| P6 nativa | 6/6 combinacoes, 49 verificacoes incluindo crash Chromium |
| Hotfix #29 original | 2/2 desktop/mobile, sem erros |
| Benchmarks P6 | Sete cenarios; sem Google real |

P1 continua a caracterizar/reproduzir defeitos preexistentes: passar esses testes nao significa que P6 os corrigiu. Nenhum teste anterior, timeout ou assercao foi removido/relaxado.

## Fidelidade Apps Script

O projector-node reutiliza o helper Apps Script existente e executa as funcoes reais das seis folhas, sem copiar regras para outra implementacao. Testes exercitam cabecalhos, colunas, ordem, numeros/zero/false/vazios, datas, ids, reservas, uma venda ficticia com agente/comissao/receita liquida, precos/historico e campos desconhecidos.

O escritor operacional real em VM confirma reescrita seletiva por mudanca aninhada desconhecida e recriacao de folha ausente. O cenario Clientes=R1/Eventos=R0/B6=R0 foi produzido interrompendo crmWrite real antes de clear Eventos, nao por uma flag committed.

VM nao comprova formatacao/formulas/locale ou RPCs reais Google. A referencia e a matriz enviada a setValues; nao se afirma equivalencia de apresentacao Excel/Sheets.

## Seguranca e falhas

- Fotografia valida formato=2/3, blocos, hashes, JSON e controlos repetidos. Fonte em movimento -> SOURCE_CHANGED. B6/versao invalidos ou desconhecidos -> SOURCE_UNVERIFIED, sem fallback B2.
- B5 PENDING exige autorizacao ficticia opaca especifica de manutencao; continua preservado e nao e confirmado. BLOCKED/desconhecido nao e autorizado.
- Espelhos ausentes/parciais/cabecalhos errados/truncados/manuais/mistos sao detetados. STALE/AHEAD exigem evidencia correspondente; nao se atribui uma revisao pela semelhanca dos valores.
- Plano antigo, duas reparacoes, lock ocupado, escritor concorrente e mudanca de fonte bloqueiam ou terminam PARTIAL. Novo plano reavalia o trabalho; repeticao concluida e idempotente.
- Reparacoes preservam a imagem de autoridade completa e nao modificam pedidos, eventos, reservas, vendas, precos, comissoes ou recibos. O journal e exclusivamente tecnico.
- Copia verificada conserva dados completos e provas disponiveis; fonte primaria e backend independente falham separadamente. Quota, corpo/referencia/manifesto corrompidos e id reutilizado nao substituem copias protegidas.
- BodyRef e envelope devem coincidir exatamente com o manifesto; um JSON semanticamente igual sob outro endereco e recusado. Planos, claims e manifestos com versao desconhecida continuam bloqueados/forenses mesmo com checksum recalculado.
- STAGED sobrevive a interrupcao/reabertura como evidencia forense; VERIFIED com resposta perdida e recuperado idempotentemente. A mesma revisao/corpo nao e confundida com outra identidade.
- Criacao concorrente da mesma copia deduplica por corpo e usa CAS; captura durante mudanca permanece associada a fotografia original, sem declarar latest.
- Recuperacao administrativa e somente relatorio. mayChangeAuthority/automaticRecovery/commercialConfirmed permanecem false.
- P3/P4 mantem pedido original REMOTE_UNKNOWN durante reparacoes/copias. P5 continua a confirmar A depois de B, sem reativar A.

## Navegadores e persistencia

Chromium, Firefox e WebKit, desktop 1440x1000/mobile 390x844. A fonte/copia sao duas DBs nativas diferentes no perfil descartavel. Projecoes sao calculadas pelo Node VM atraves de uma funcao de teste local; todas as requisicoes externas sao bloqueadas e o servidor de laboratorio so aceita GET para modulos/pagina.

Reabertura normal e persistencia em ficheiros temporarios foram verificadas. Em Chromium desktop, o teste persiste um lock e clear parcial, termina apenas os processos Chrome cujo comando contem o perfil temporario unico e reabre esse perfil. Lock e copia sobrevivem, autoridade permanece igual e nao ocorre limpeza automatica do lock.

Isso e crash de processo, nao falha de energia/maquina/Google. Firefox/WebKit usam reabertura normal. Mobile e viewport, nao aparelho fisico. WebKit Playwright nao equivale a Safari/iOS real. QuotaExceededError e injetado numa transacao IDB real; nao se afirma quota fisica esgotada. A matriz P5 original tambem preserva o teste de erro assincrono nativo IDB.

## Reproducao

Node com Web Crypto/streams, Playwright e motores instalados. Apenas dados ficticios e localhost 53xxx.

```powershell
node tests/commercial-persistence-p6.test.js
$env:P6_ARTIFACTS="$env:TEMP/the-view-p6-validation"
node tests/commercial-persistence-p6-browser.mjs
$env:P6_BENCHMARK_OUTPUT="$env:TEMP/the-view-p6-benchmarks.json"
node tests/commercial-persistence-p6-benchmarks.mjs
Get-ChildItem tests/*.test.js | Sort-Object Name | ForEach-Object { node $_.FullName; if ($LASTEXITCODE) { throw $_.Name } }
$env:COMMERCIAL_TEST_PORT='53820'
$env:BROWSER_REGRESSION_OUTPUT="$env:TEMP/the-view-p6-commercial"
node tests/commercial-browser-regression.cjs
```

PLAYWRIGHT_MODULE/PLAYWRIGHT_BROWSERS_PATH/CHROME_EXECUTABLE e PDF_LIB_MODULE apontam para dependencias locais quando necessario. Matrizes anteriores executadas sequencialmente: P1=53842, P2=53844/53845, P3=53846/53847, P4=53848/53849, P5=53850. Hotfix em 53860 com active-write-preview.cjs, processo terminado no finally. P6 em 53800. Sintaxe de cada JS/CJS/MJS por node --check; GS apenas por vm.Script, nunca executado fora da VM ficticia.

Durante a revisao foram reforcadas as assercoes P6 de venda/comissao, crash nativo, referencia exata e versoes desconhecidas. A bateria Node/sintaxe e a matriz P6 foram repetidas no codigo final; nao houve mudanca do nucleo operacional ou dos testes anteriores.

## Riscos e condicoes pendentes

Independencia apenas logica, mesmo dispositivo/perfil, sem OAuth/Sheets reais; ausencia de prova de energia/quota fisica/Safari; custo de snapshots completos, limite P4 32 MiB e historia crescente; lock apos crash exige procedimento futuro aprovado; claims/checksums nao sao assinaturas nem prova contra administrador que reescreva toda a fonte. Ver RECOVERY_GATES e BENCHMARKS.

Nenhum dado real, backup do utilizador, configuracao, endpoint, PR, merge, deployment, migracao ou recuperacao comercial foi utilizado/executado. P6 esta desligada; P7 nao foi iniciada.
