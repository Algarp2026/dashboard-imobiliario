# The View - Verificacoes finais direcionadas

Base: branch codex/fix-commercial-auth-sync, commit 26e00731b091137a842d2f4f77ae801e57098239. Esse commit foi preservado, sem amend/rebase. Esta intervencao acrescenta apenas verificacoes pedidas, diagnostico administrativo e correcao de preflight. Nao houve auditoria completa, merge ou publicacao em producao.

## Capacidade exata

Em google_apps_script.gs, STORE_MAX_CHARACTERS=50000. crmWrite verifica JSON deterministico desejado e conteudo anterior integral de B2 antes de B5/backups; saveStore_ volta a verificar antes de gravar. crmRecover reutiliza crmWrite; testWrite chama saveStore_. crmRead nao aplica esse limite. A API traduz STORE_SIZE_LIMIT para HTTP 413 e o cliente conserva a alteracao local.

Foi corrigida uma inconsistencia: o preflight comparava raw.trim().length, mas o backup recebe o texto integral. Agora usa storedRaw.length, incluindo espacos exteriores. Uma base de 50 001 caracteres com JSON compacto menor nao cria B5 nem backup antes da recusa.

| JSON exato | Leitura simulada | Gravar a partir de base pequena | Base anterior desse tamanho |
| --- | --- | --- | --- |
| 40 000 | Aceite | Persistencia e backup exato | Backup preservado |
| 49 000 | Aceite | Persistencia e backup exato | Backup preservado |
| 50 000 | Aceite | Persistencia e backup exato | Backup preservado |
| 60 000 | Aceite | STORE_SIZE_LIMIT; nenhuma mutacao | Substituicao recusada; original preservado |
| 100 000 | Aceite | STORE_SIZE_LIMIT; nenhuma mutacao | Substituicao recusada; original preservado |

Testes: node tests/commercial-capacity.test.js. Conferem B2/B3/B4/B5, backup, espelhos, recusa sem mutacao e medicao sem exposicao de conteudo.

O limite permanece **preventivo nesta aplicacao**. [Google documenta celulas acima de 50 000 caracteres na conversao Excel para Sheets](https://support.google.com/drive/answer/37603?hl=en). Isso nao comprova o limite efetivo de setValue/setValues na conta utilizada. Sem fonte/credenciais Google de testes configuradas, nao foram executadas escritas reais para medir essa capacidade. Os casos 60/100 mil existentes sao fixtures em memoria, nao prova de que esses textos cabem numa celula Google real. Nao foi removido o limite nem repartido/truncado o JSON.

## Medir B2 sem dados pessoais

scripts/measure-store-read-only.gs e um diagnostico independente, nao um endpoint publico. Para medir uma fonte autorizada, o administrador cria um projeto Apps Script de diagnostico separado, contendo somente esse ficheiro. Concede a identidade dedicada permissao de **leitor** na Sheet e configura CRM_SPREADSHEET_ID e CRM_API_CALLER_EMAIL nas Script Properties desse projeto.

Manifesto desse projeto de diagnostico: scopes https://www.googleapis.com/auth/spreadsheets.readonly e https://www.googleapis.com/auth/userinfo.email. Executar measureStoreReadOnly no editor, autenticado como essa identidade. Consultar somente o retorno; nao registar raw, nomes ou contactos. Nao e necessario publicar um Web App. Nao usar testWrite.

Retorno exclusivo: characters (comprimento real do texto integral, incluindo espacos), counts (clientes/eventos/agentes), revision (SHA-256 de raw.trim(), igual ao protocolo CRM). Comprimento e unidades UTF-16 de String.length, nao bytes nem tamanho do JSON reserializado. Uma leitura unica de B2 fornece dimensao/contagens/revisao do mesmo snapshot, sem criar/alterar abas, espelhos ou backups. JSON invalido ou identidade diferente sao recusados sem expor conteudo. Nenhuma execucao Google real foi feita nesta entrega.

check-google-read.js continua util para validar o transporte OAuth/fonte test, mas o seu serializedCharacters e do JSON deterministico reserializado; nao o confundir com esta medicao integral de B2.

Se a base real ultrapassar o limite, a escrita permanece bloqueada. Proposta sujeita a autorizacao: manifesto versionado e blocos numa aba separada, hash/CAS da base completa, backups integrais, migracao reversivel mantendo B2 original e suporte de leitura antigo. Nao implementar sem medir a fonte, validar a alternativa numa Sheet ficticia e obter autorizacao explicita.

## Concorrencia sem simulacao visual

node tests/commercial-concurrency.test.js executa duas instancias do cliente JavaScript com caches locais separadas e sessoes HMAC distintas, pela API real, sobre o Apps Script real num Spreadsheet em memoria. Nao usa badges simulados nem painel de falhas.

Resultados: mesma revisao inicial; primeiro POST 200 persistido; segundo 409; dados do primeiro intactos; alteracao do segundo conservada em estado e localStorage. Manipular a revisao mantendo o comprovativo antigo recebe 403. Reconciliar exige nova leitura; uma nova escrita concorrente entre essa leitura e o envio causa outro 409. Operacoes da fonte verificadas sob script lock. Implementacao de concorrencia nao foi alterada. Isto nao substitui validacao LockService/Google real.

Regressoes diretamente afetadas: commercial-sync-api.test.js e commercial-write-integrity.test.js aprovadas. Sintaxe de commercial.js, app.js, config.js, novos testes e dois ficheiros .gs validada. Nao foram repetidas suites de UX, PDFs, pricing ou auditorias anteriores.

## Google de testes: passos administrativos

1. Criar Sheet/Apps Script e identidade de testes sem acesso de escrita a producao. Inicializar apenas a Sheet ficticia com tests/fixtures/google-test-store.json em Store!B2; nao copiar dados pessoais. Identidade do CRM precisa de editor nessa Sheet e acesso ao projeto Script; identidade diagnostica pode ter apenas leitor.
2. Associar Apps Script e cliente OAuth ao mesmo projeto Google Cloud standard. Ativar Apps Script API, configurar consentimento e cliente OAuth. Rever scopes efetivos (Sheets e userinfo.email neste codigo). A Execution API exige todos os scopes do projeto e nao suporta service accounts. Obter refresh token offline por canal administrativo seguro; nunca chat/Git/log/URL.
3. Script Properties do projeto CRM de testes: CRM_SPREADSHEET_ID, CRM_ENVIRONMENT=test, CRM_API_CALLER_EMAIL e CRM_API_WRITES_ENABLED=false.
4. Publicar somente o Script de testes como API Executable, restrito a identidade autorizada. Usar deployment ID, nao URL /exec; devMode=false. [Procedimento Google](https://developers.google.com/apps-script/api/how-tos/execute).
5. Variaveis Vercel somente Preview/projeto de testes: COMMERCIAL_ACCESS_PASSWORD e COMMERCIAL_ACCESS_SECRET novos; CRM_GOOGLE_CLIENT_ID, CRM_GOOGLE_CLIENT_SECRET, CRM_GOOGLE_REFRESH_TOKEN, CRM_GOOGLE_DEPLOYMENT_ID e CRM_GOOGLE_SPREADSHEET_ID. Manter CRM_GOOGLE_WRITES_ENABLED=false e CRM_GOOGLE_TEST_WRITES_ENABLED=false. Nao reutilizar segredos de producao nem prefixos publicos.
6. Com variaveis injetadas num processo seguro, executar node scripts/check-google-read.js com CRM_GOOGLE_READ_CHECK=true e VERCEL_ENV=preview. Exige fonte test e gates false, so chama crmRead e devolve metadados. Medir B2 com o diagnostico acima. Validar autenticacao e tamanho antes de escrita.
7. Com autorizacao para escrever somente na Sheet ficticia, ativar os dois gates Vercel e CRM_API_WRITES_ENABLED=true. Criar cliente, aguardar recibo, refresh, editar e testar duas sessoes; conferir B2/B3, backup e seis espelhos. Desativar gates no fim.
8. Antes de qualquer ativacao futura de producao, inventariar todas as publicacoes /exec/API, versoes antigas, scripts e outros escritores. Publicacao nova nao atualiza /exec antigo. Escritores que ignorem CAS/lock devem ser retirados ou atualizados apenas com autorizacao. Nao alterar permissoes/publicacoes reais nesta fase.

## Impedimentos e entrega

Pendente: configuracao OAuth/API Executable/Sheet de testes e verificacao do limite, quotas e locks no Google real; medicao real da carteira; validacao manual independente; autorizacao de producao. Se B2 nao couber, e necessaria autorizacao para migracao estrutural.

A pre-visualizacao manual usa projeto separado e fonte inteiramente ficticia, com autenticacao CRM/painel e bloqueio de rede Google. URL, password de testes e expiracao sao entregues fora do Git. A duracao depende do plano: [Vercel documenta 45 minutos em Hobby e 24 horas em Pro/Enterprise](https://vercel.com/kb/guide/vercel-sandbox-duration-and-persistence). Nao renovar silenciosamente ou substituir a fonte por dados de producao para contornar esse limite.
