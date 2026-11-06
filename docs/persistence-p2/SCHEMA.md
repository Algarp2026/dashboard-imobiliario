# Estrutura IndexedDB P2

## Isolamento

O destino requer opt-in `synthetic: true`, nome `the-view-p2-shadow-lab.*` e duas origens HTTP diferentes em `127.0.0.1:53xxx`. A origem declarada deve corresponder a pagina executora. Nomes operacionais e origens comerciais sao rejeitados antes de abrir IndexedDB.

A base operacional `theView.crmCommercial.v2.recovery.v1`, store `copies`, nunca e aberta com upgrade pelo leitor. O chamador fornece um handle ja aberto; apenas transacoes readonly sao utilizadas. O laboratorio cria a origem sintetica explicitamente, em perfil descartavel, e o destino numa segunda origem. Nao existe inicializacao automatica no website.

Nao e suficiente usar outro nome de DB na origem real: isso partilharia quota e poderia comprometer as gravacoes. A separacao de origens e perfis desta P2 e obrigatoria. Nao representa uma estrategia aprovada de quota para migracao real.

## Stores de destino, versao 1

| Store | Chave | Conteudo |
|---|---|---|
| workspaces | id | Reservado; nenhum workspace operacional ou head ativo criado. |
| bodies | bodyRef | Corpo imutavel com version, rawHash, codec, mediaType, decodedBytes, encodedBytes, bytes. |
| operations | id | Projecao shadow com requestId, requestHash, payloadHash, requestRef, payloadRef, baseRef, baseRevision; REMOTE_UNKNOWN. |
| branches | id | Variantes da origem, ausencia de fragmentos ou colisao de identidade; referencias aos originais. |
| receipts | id | Referencia ao original e resultado de vinculacao LOCAL; nunca COMMITTED. |
| migration | id | Fase, revisao local, cursor, items, bodyRefs, projectionProofs, blocked e checkpointHash. |
| archive | id | Identidade da origem, bodyRef, classificacao, problemas e protecao PRESERVE. |

Todas as projecoes incluem `activationAllowed: false`. Nao existe metodo activate, envio, reconciliacao ou confirmacao comercial.

## Contrato logico P1 versus representacao fisica

P1 continua vinculativa; os registos P2 nao fingem satisfazer os contratos de um escritor operacional. Nao se inventam instanceId, writerEpoch, localRevision da ficha ou prova de commit.

O envelope original e guardado uma unica vez por hash/representacao. As projecoes usam pointers verificados para o pedido, dados e base, em vez de duplicar snapshots. A base candidata so e ligada quando a revisao e o hash canonico correspondem; isso nao prova identidade de instancia. Campos comerciais desconhecidos permanecem no original.

Textos localStorage sao sequencias de code units UTF-16LE, inclusive NUL e surrogates isolados. Objetos IndexedDB sao preservados por um grafo tagged versionado: ciclos, aliases, ArrayBuffer/views, Map, Set, Date, RegExp, Blob/File e valores nao JSON suportados. Nao se afirma conhecer os bytes fisicos internos de IndexedDB. Tipos/propriedades sem representacao segura abortam a captura, preservando a origem.

`rawHash` identifica a representacao original; `payloadHash` identifica o JSON comercial canonico; `requestHash` identifica o envelope canonico. Referencias incluem a familia do codec para impedir alias entre texto e grafo. Os envelopes gzip antigos permanecem exatamente comprimidos no corpo original; a descompressao serve apenas validacao/projecao.

## Atomicidade

Hashes, codecs e leituras da origem ocorrem antes da transacao. Corpos, referencias, projecoes, cursor e checkpoint sao escritos numa unica transacao strict. Um CAS sobre checkpointHash impede avancar sobre outro lote. `oncomplete` e necessario para devolver sucesso.

A verificacao reconstrui corpos, hashes, pedidos, bases e projecoes; nao aceita apenas a fase READY ou um checksum declarado. A transicao VERIFIED/READY compara novamente o snapshot de destino na transacao. Nenhuma operacao de rede ocorre dentro de transacoes.
