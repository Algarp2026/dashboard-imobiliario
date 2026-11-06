# Manifestos e cadeia B6

## Formatos versionados

Manifesto format=3: kind, operationId, requestId, requestHash, payloadHash, baseRevision, resultRevision, sourceId, domainId, previousRef, version, requestVersion, height, createdAt, completeHistory e integrity.

- COMMIT: operationId e p5-op- seguido do requestHash. E uma identidade deterministica da operacao na fonte; o operationId local P3 permanece independente e e vinculado atraves do pedido original exato.
- requestHash: SHA-256 do envelope canonico original {action:'save',requestId,baseRevision,data}. Nao inclui ticket/credencial efemeros.
- payloadHash/resultRevision: SHA-256 do JSON canonico completo. Nao identificam sozinhos uma operacao.
- previousRef: hash do manifesto anterior. baseRevision tem de coincidir com resultRevision do pai; height tem de ser pai+1.
- version/requestVersion: descritores format=2 dos blocos do payload e do pedido original completo, respetivamente.
- integrity: SHA-256 da metadata canonica sem o proprio campo. Nao e assinatura digital nem prova de autoria.
- createdAt: timestamp de origem do pedido/preparacao, preservado na retoma e no recibo estavel. Nao e medicao do instante fisico de conclusao da chamada Sheets; a prova de ativacao e a alcancabilidade B6, nunca o timestamp.

GENESIS: altura zero, previousRef/baseRevision/identidades de pedido/requestVersion nulos. Representa exclusivamente o inicio do dominio de laboratorio. completeHistory=true significa historia completa **desse dominio**, nao todos os eventos comerciais anteriores. Para uma origem anterior sem provas usa-se false: nao se fabrica cadeia retroativa.

B6 format=3: sourceId, domainId, manifestRef, resultRevision, legacyChecksum e integrity. Os hashes do apontador, manifesto, dados e pedido sao verificados separadamente. B2 conserva exatamente o texto inicial; mudanca do seu checksum provoca falha fechada.

## Estados derivados, nao flags

1. Preparado: registo existe em Manifests/B5, mas nao e alcancavel a partir da ancora.
2. Ativo: manifesto referenciado pelo B6 atual e validado.
3. Historico confirmado: ancestral verificavel da ancora atual.
4. Orfao: manifesto nao alcancavel; pode indicar preparacao pendente, mas nunca COMMITTED.

BackupsVersions contem descritores e identidade da operacao. Uma linha de backup, mesmo com hash correto, nao ativa nada. Flags adicionais confirmed sao desconhecidas/rejeitadas, nao prova.

## Verificacao

Comecar no B6 autenticado atual, verificar integridade/fonte/dominio/checksum legado, percorrer todos os pais ate GENESIS e verificar em cada passo metadata estrita, hash, altura, base/result, blocos ordenados, comprimentos, SHA-256, JSON comercial e pedido original. A correspondencia com a consulta exige requestId, requestHash, payloadHash, baseRevision e sourceId exatos.

A prova continua conservadora mesmo quando o alvo ja foi encontrado: um ancestral em falta ou corrompido torna o resultado UNKNOWN. Uma referencia circular ou um hash inconsistente nao e tolerado. Um limite ultrapassado nao se transforma em NOT_FOUND.

O hash de conteudo e uma revisao nao monotona: duas operacoes com dados iguais podem ter resultRevision igual e continuam a ter pedidos/manifestos distintos. A referencia de manifesto e a altura separam os ciclos; um retry exato confirmado devolve o recibo sem avancar o B6.

## Imutabilidade e transicoes

B5 guarda identidade exata, descritores e referencia preparada, com integridade. Blocos/manifestos anteriores nao sao substituidos. Antes da ativacao, a fonte valida novamente payload/pedido, a ancora inicial e as identidades. So a escrita autorizada pode apontar B6 para a candidata.

Falha depois de B6 pode deixar B5: o lookup prova COMMITTED sem limpar a intencao. Uma gravacao posterior autorizada pode reconhecer essa intencao como ja ativada e limpar apenas essa intencao sob lock. Nenhuma consulta realiza essa limpeza.
