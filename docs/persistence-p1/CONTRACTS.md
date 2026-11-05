# P1 - Contratos de persistencia, versao 1

Estado: desenho adotado para evolucao faseada; **nao ligado ao produto**.
Base de origem: `0eb44f20ebf0404a86e26be507769c285e259109` (`origin/main`).
Contrato legivel por testes: [contracts.v1.json](contracts.v1.json).

## Limite desta entrega

A P1 adiciona contratos, fixtures e modelos de teste. Nao altera HTML, modulos comerciais, API, Apps Script, configuracao, precos, dados, arquivo ou percursos atuais. O contrato JSON e um manifesto versionado de campos/estados/guards; **nao e um JSON Schema completo nem um validador de producao**. Os modelos em `tests/helpers/persistence-p1-*` sao especificacoes executaveis isoladas. Nao se pode importa-los no frontend ou servidor para saltar a revisao de P2-P5.

Referencias de desenho: relatorios A/B/C da Fase 1, decisoes D01-D12, especificacao v1.0 e adenda 1.1. Esta entrega detalha D01-D07 e apenas prepara os pontos de extensao de D08-D12. Nao implementa novas regras comerciais.

## Autoridades e fronteiras

- Google: versao ativa verificada e apontador B6 continuam autoridade comercial partilhada.
- API: autentica/autoriza e comunica; Apps Script valida CAS e integridade sob lock antes de B5.
- Workspace local: autoridade da recuperacao da instancia, nunca prova de gravacao oficial.
- Operacao: pedido original imutavel, nao o estado editavel atual da ficha.
- Arquivo: recuperacao historica; nem idade, checksum, exportacao ou flag confirmam comercialmente uma operacao.
- Cache/`data.json`/espelhos: nao podem inventar confirmacao da fonte oficial.

Nao existe transacao distribuida entre navegador, Vercel e Google. CAS remoto nao substitui CAS local, nem Web Locks/BroadcastChannel substituem uma transacao multi-store.

## Tipos e estruturas versionadas

Todos os registos conhecidos contem `version: 1`. IDs sao strings nao vazias, tecnicamente unicas (UUID aleatorio no modelo; testar colisoes e rejeitar reutilizacao com outro conteudo). Revisoes/hashes sao SHA-256 hex de 64 caracteres. Contadores sao inteiros seguros nao negativos; datas tecnicas sao ISO-8601 UTC validas. Campos adicionais do JSON comercial permanecem intactos. Envelope de armazenamento desconhecido deve ser preservado como opaco e bloqueado para interpretacao/escrita automatica, nao descartado nem tratado como confirmado.

| Registo | Campos e semantica obrigatoria |
|---|---|
| workspace | `workspaceId`, `localRevision`, `headRef`, `baseRef`, `baseRemoteRevision`, `activeOperationId` (null ou ID), `writerEpoch`. Revisao local e independente da remota; baseRef e cabeca nao sao necessariamente iguais. |
| operation | `operationId`, `requestId`, `instanceId`, `expectedLocalRevision`, `baseRemoteRevision`, `baseRef`, `payloadRef`, `payloadHash`, `requestHash`, `originalRequest`, `phase`, `writerEpoch`. Identidade original e conteudo nao mudam depois de persistidos. Novas edicoes geram nova proposta/ID. |
| body | `bodyRef`, `rawHash`, `codec`, `mediaType`, `decodedBytes`, `encodedBytes`, `bytes`. `codec` inicialmente identity/gzip, comprimentos em bytes; bytes sao ArrayBuffer/Uint8Array. Conteudo conhecido tem representacao canonica identificada; conteudo desconhecido preserva representacao opaca. |
| branch | `branchId`, `operationId`, `baseRef`, `payloadRef`, `expectedLocalRevision`, `observedLocalRevision`, `conflictPaths` (array). Nao substitui cabeca nem perde pedido original. |
| receipt | `requestId`, `baseRevision`, `resultRevision`, `payloadHash`, `requestHash`, `commitRef`, `status`, `confirmedAt`, `sourceId`; autor autenticado opcional apenas se existe evidencia. E necessario provar ligacao a ativacao, nao apenas validar campos. |
| migration | `sourceKey`, `sourceRawHash`, `destinationRefs` (array), `phase`, `cursor`. Cursor e corpos indispensaveis pertencem a mesma transacao; origem nao e eliminada ao mudar fase. |
| export | `kind`, `instanceId`, `data`, `base`, `baseRevision`, `operation`, `receipts`, `snapshotRevision`, `checksum`. Em modo forense base/operacao podem ser null; razao explicita. |

Nomes de stores e detalhes de envelope sao proposta de contrato. P2 valida se reutiliza a DB existente com stores aditivos; nao mudar nome/chave/versao real nesta fase.

### Hashes que nao devem ser confundidos

1. `payloadHash`: SHA-256 da serializacao canonica dos dados comerciais, compativel com `serializedStore` atual. No modelo tambem e `payloadRef`/revisao resultante.
2. `requestHash`: SHA-256 do envelope original canonico `{action,requestId,baseRevision,data}`; vincula identidade e conteudo. O read ticket e credencial efemera, nao faz parte do pedido arquivado nem deve entrar na exportacao.
3. `rawHash`: identificacao dos bytes exatos de um corpo. Um texto bruto localStorage e uma sequencia UTF-16: preservar code units, inclusive surrogates isolados, com representacao UTF-16LE identificada. Nao usar TextEncoder UTF-8 diretamente no texto bruto e perder unidades. Bytes IndexedDB opacos mantem a sua codificacao original.
4. Checksum do export protege o envelope exportado, mas nao comprova commit comercial. Codec/comprimento/hash e identidade comercial sao verificacoes distintas.

Um novo formato de serializacao exige nova versao e testes de compatibilidade. Nao normalizar silenciosamente Unicode, numeros, campos desconhecidos ou pedidos antigos.

## Invariantes formais

| ID | Regra | Prova P1 |
|---|---|---|
| I-LOCAL-CAS | Verificar revisao esperada e escrever cabeca/operacao/corpos ou branch numa transacao. Divergencia preserva ambas propostas. | P1-CUR-01 reproduz defeito; P1-IDB-01/03 demonstram modelo. |
| I-ATOMIC-SNAPSHOT | Exportar dados/base/pedido/provas da mesma fotografia, nunca memoria de A com metadata global de B. | P1-CUR-02; P1-EX-01/02/03; P1-IDB-01. |
| I-IMMUTABLE-REQUEST | Mesmo ID + outro requestHash e rejeitado; retry identico nao duplica. Resultado incerto preserva original. | P1-OP-01/02/04 e browser P1-IDB-01. |
| I-DURABLE-BEFORE-SEND | LOCAL_DURABLE depende de oncomplete/reconstrucao; envio exige ticket/revisao/compatibilidade e diagnostico pendente resolvido. | P1-ST-01 verifica guards do contrato, nao ativa envio. |
| I-EXACT-RECEIPT | ID/base/result/hash/ambito e prova de ativacao devem corresponder; flags e conteudo semelhante nao bastam. | P1-OP-03 e P1-REC-01. |
| I-NO-HISTORICAL-ACTIVATION | Lookup de A depois de B nao escreve, restaura ou reativa A. Orfao preparado nao e COMMITTED. | P1-REC-01, modelo puro. |
| I-PROTECTED-REFERENCES | Pedido incerto/branch/checkpoint desconhecido nao e apagado nem desprotegido por quota ou export. | P1-IDB-02/03, P1-MIG-01/02/03/04; produto sem alteracao. |
| I-UNKNOWN-BYTES | Origem opaca permanece exata, inclusive apos aborto, quota e reabertura. | P1-MIG-01 e P1-MIG-03; teste com NUL, acento e surrogate isolado. |
| I-NO-FALSE-SYNC | Ack remoto de pedido anterior nao confirma rascunho posterior; ack local falhado e distinto de falha remota. | P1-ST-02; integracao real futura pendente. |
| I-MIXED-WRITERS | API e fonte devem rejeitar escritor incompativel no corte futuro. Fence remoto nao protege cache antiga offline. | P1-MIX-01 (tabela de contrato) e P1-MIX-02 (laboratorio). |

## Maquina de estados por operacao

As arestas e guards exatos constam do JSON. A ausencia de uma aresta significa bloqueio, nao transicao implicita. O modelo passa cada aresta com todas as provas e rejeita cada guard ausente/falso. No produto futuro, as provas sao derivadas de transacoes/respostas verificadas, **nunca de booleans fornecidos pelo utilizador**.

```text
UI_DIRTY -> LOCAL_DURABLE -> SENDING -> REMOTE_COMMITTED -> SYNCED
    |              |          |              |
STORAGE_BLOCKED  CONFLICT   REMOTE_UNKNOWN   LOCAL_ACK_PENDING
```

- REMOTE_UNKNOWN so permite retry original quando retoma exata foi explicitamente autorizada por diagnostico/ticket/CAS; nao basta receber timeout ou NOT_FOUND.
- LOCAL_ACK_PENDING exige prova remota para fechar localmente; nao cria outra operacao comercial.
- SYNCED e relativo ao pedido confirmado. A instancia com formulario/proposta posterior continua por guardar, mesmo se uma operacao anterior foi confirmada.
- CONFLICT nao permite reaproveitar o ID com conteudo fundido. Preservar original, obter fonte atual e criar nova proposta com nova identidade, apos resolucao segura da incerteza anterior.
- Retoma de STORAGE_BLOCKED/reconciliacao nao significa alterar pedido anterior. Uma nova tentativa prepara nova proposta ou continua o original exato, conforme o estado verificavel. Estas acoes sao coordenacao futura, nao arestas cegas do reducer.

## Contrato de transacao local e exportacao

P2-P3: preparar hash/compressao fora da transacao. Dentro de uma unica transacao, verificar expectedLocalRevision, verificar imutabilidade, inserir referencias/corpos e gravar cabeca ou branch. Nao esperar por rede/timer/crypto/codec dentro da transacao; nao anunciar durabilidade so com put. Pedir `strict` e verificar suporte/comportamento; um hint nao elimina falhas fisicas.

Exportacao recuperavel exige existencia e integridade de todas as referencias, base realmente usada pela instancia, revisao dessa base, pedido original exato e provas que lhe pertencem. Recolher numa transacao readonly; serializar/hash/download apos clone do conjunto. Se ha edicoes apenas em memoria sem fotografia duravel coerente, nao usar metadata global para inventar base: preservar como forense ou capturar primeiro uma proposta duravel segura. Corrupcao, referencia ausente ou formato desconhecido nunca produz export com rotulo recuperavel.

O modelo browser demonstra snapshot por transacao e exports independentes de cada operacao. Ainda nao e um exportador do CRM nem demonstra streaming de ficheiros grandes.

## Consulta historica de resultado - contrato futuro

Consulta autenticada somente de leitura por `requestId` + `requestHash`/`payloadHash` + ambito da fonte. Resultados: COMMITTED, PENDING, BLOCKED, NOT_FOUND e UNKNOWN. Ausencia de recibo/index nao prova nunca executado.

Manifesto imutavel inclui pai/ID/base/result/hash/fonte e referencia da versao. B6 e a ancora de ativacao; indice de recibos e derivado. Lookup verifica cadeia alcancavel e integridade; manifesto preparado orfao nao confirma. Se cadeia/limite impedem conclusao, UNKNOWN. Apos A confirmado e B confirmado, consultar A nao altera B6. Backup preparado antes de B6 nao serve sozinho como recibo. Auth/lock/CAS/read tickets/validacao comercial e B5/B6 permanecem obrigatorios.

O P1-REC-01 e um modelo de alcance/hash em memoria; nao e a implementacao do Apps Script nem prova de atomicidade distribuida. Servidor deve validar fonte, ID e autorizacao; cliente nao pode fabricar recibos a partir de um objeto com campos plausiveis.

## Migracao - contrato futuro

`DISCOVERED -> COPYING -> VERIFIED -> READY -> ACTIVATED`. Cursor so acompanha os corpos efetivamente duraveis. Fase repetida retoma pelo checkpoint verificado, sem repetir efeitos nem confiar apenas numa flag isolada.

Preservar origem, inclusive desconhecida. Hash/comparacao antes de ativar deteta alteracao concorrente; preservar variante e parar em vez de sobrescrever. Nao apagar unica copia para ganhar espaco. Falta de capacidade para o minimo coerente bloqueia envio e permite export forense/coerente dos dados disponiveis. Export externo nao confirma nem autoriza limpeza. Separacao de limites ativos/historicos e compressao segura sao P2-P4, nao implementadas aqui.

O browser testa reabertura normal entre lotes e quota injetada, nao falha eletrica nem quota fisica esgotada. O modelo puro testa retoma a partir de cada fase. Falhas abruptas, corpus legacy completo e pressao fisica continuam gates de P2.

## Compatibilidade antiga/nova - sem ativacao nesta fase

| Frontend | API | Fonte | Resultado exigido apos corte futuro |
|---|---|---|---|
| Antigo | Antiga | Nova | Fonte recusa escrita incompativel antes de B5; API antiga nao contorna fence. |
| Antigo | Nova | Nova | API recusa, fonte tambem verifica independentemente. |
| Novo | Antiga | Nova | Nao enviar sem capacidades verificadas; fonte impede perda da cadeia/contrato. |
| Novo | Nova | Antiga | Nao habilitar percurso novo; capacidade ausente e bloqueio explicito. |
| Novo | Nova | Nova | So habilitar apos CAS/ticket/integridade e contrato efetivamente publicados e validados. |

`writerEpoch:2` e valor proposto no laboratorio, nao configuracao ativada. Fonte deve derivar capacidades do seu proprio codigo/ambiente; nao confiar so no header livre enviado pelo frontend. O modelo da tabela nao e um teste da API/Apps Script reais.

Corte futuro exige inventario de pendencias, exportacoes verificadas, suspensao controlada, fence em API e fonte, adapters de leitura/consulta, fecho/reabertura de tabs antigas e validacao antes de reabrir escrita. JS antigo offline pode continuar a alterar LS; a nova DB isolada nao o torna cooperante. Se existirem alteracoes antigas nao capturadas, declarar impedimento. Pedido antigo incerto conserva ID/conteudo; so retomar atraves de adapter controlado com identidade, revisao e prova suficiente, sem forcar ID novo nem reativar dados antigos.

## Dependencias de P2-P5 e reversao

Antes de P2: aprovacao deste contrato, corpus sintetico legacy, storage adapters rigorosos, migracao shadow, quota fisica/crash e Safari real. Antes de P3: CAS local e export integrados, fence coordenado e formularios/drafts preservados. Antes de P4: politica de referencias e compressao/reconstrucao sem perda. Antes de P5: lookup autenticado, cadeia verificavel, falhas B5/B6/indice, comparacao de APIs/fontes antigas e novas em Google ficticio.

Rollback da P1: retirar apenas docs/testes novos; zero dados migrados, zero formatos ativos alterados. Rollback futuro nao pode reativar escritor antigo que descarta campos/provas; usar leitor compativel/so-leitura preservando DB e pedidos novos.
