# Formatos e compatibilidade

| Origem/formato | Tratamento | Confirmacao comercial |
|---|---|---|
| Cache JSON atual | Estrutura, IDs, referencias comerciais e hash; original preservado | Nunca inferida |
| syncMeta.v1 | Base, revisao e data; hash da base deve corresponder | Nao autentica instancia |
| pendingWrite.v1 save/recover | Pedido original, ID, baseRevision e hash imutaveis | PENDING |
| pendingSync | Marcador estrutural, mesmo sem pedido | PENDING |
| Recovery format 1 | Data/base/pedido/metadados, checksums e relacoes | Nunca pela flag |
| legacyRaw | Wrappers conhecidos ate oito niveis; original integral | Pendentes continuam protegidos |
| recoveryStorageFormat 1 gzip | Codec, base64, comprimento, SHA e limite de expansao | Compressao nao e confirmacao |
| active-write.v1 | Mesmo formato de pedido; reserva identificada | Original incerto preservado |
| active-write-confirmed.v1 | Conteudo e comprovativo verificados separadamente | LOCAL_CONTENT_BOUND_ONLY no maximo |
| Checkpoint e needsReview | Metadados preservados e validados | Nenhuma eliminacao |
| Envelope/metadados/comprovativo desconhecido | UNKNOWN, opaco e protegido | Sem interpretacao automatica |
| JSON invalido/checksum errado/referencia quebrada | CONFLICT ou INSUFFICIENT_INTEGRITY | Bloqueia conclusao automatica quando necessario |

As classes sao RECOVERABLE, PENDING, CONFLICT, UNKNOWN e INSUFFICIENT_INTEGRITY. Todas as entradas permanecem protegidas; classificacao nao e autorizacao para limpeza.

Comprovativos de conteudo local sao vinculados a ID, base, hashes e metodo. Mesmo uma vinculacao perfeita nao prova ativacao autenticada em B6. Prova reconciled exige futura validacao semantica e nunca e promovida a confirmacao remota nesta fase.

## Matriz entre versoes

| Versao | Leitura P2 | Origem alterada | Destino operacional |
|---|---|---|---|
| Legacy conhecido | Reconhecido ou protegido por falta de evidencia | Nao | Nao |
| Antes da PR #26 | Preserva payload e wrappers/checkpoints | Nao | Nao |
| PR #26 comprimido | Descompressao com verificacao; bytes originais mantidos | Nao | Nao |
| Hotfix PR #29 | Ambas reservas reconhecidas | Nao | Nao |
| Futuro/desconhecido | Opaco ou captura recusada sem escrita | Nao | Nao |

Um separador antigo nao participa no CAS shadow. A protecao contra escrever no destino provem de origens diferentes no laboratorio, nao de cooperacao do codigo antigo. Fencing de escritores na API/Apps Script permanece trabalho futuro e nao foi ativado.
