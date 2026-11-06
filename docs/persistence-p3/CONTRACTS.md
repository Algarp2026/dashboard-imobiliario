# Contratos P3

Referencias: manifesto P1 versao 1, contratos/traceability P1, inventario e schema P2, hotfix #29, relatorios A/B/C, especificacao v1.0 e adenda 1.1. D01-D07 orientam este nucleo; D08-D12 nao autorizam funcionalidades comerciais, migracao remota, identidade de utilizadores ou saneamento nesta fase.

## Fronteiras

Google continua autoridade oficial; o nucleo P3 e autoridade apenas do laboratorio local. WriterEpoch 2 e proposta experimental. Nao existe transporte para `/api/commercial-data`, Web App ou Google. O adaptador remoto exige identificador `fiction-p3-*` e `labOnly`, alem dos guards locais; esses campos nao sao uma autenticacao de producao.

createWorkspace exige uma leitura atual da fonte ficticia, epocas compativeis, sourceId correspondente e igualdade dos dados/revisao. Uma base arbitraria apenas com hash plausivel e rejeitada antes de qualquer escrita. Isto e verificacao no simulador, nao autenticacao Google; uma alteracao posterior da fonte continua sujeita ao CAS/preflight no envio.

Correspondencias fisicas/logicas:

| P1 | P3 |
|---|---|
| workspace | Campos P1 preservados, acrescidos de sourceId, hash do registo e ambito LABORATORY_ONLY. |
| operation.originalRequest | Header original imutavel + payloadRef. getOperation/export reconstroem o envelope completo e verificam requestHash. Sem triplicar data no envelope/base/operacao. |
| operation.instanceId | Identidade local com capacidade aleatoria vinculada a origem e workspace. Nao e identidade/autoria de uma pessoa. |
| branch | Base e proposta originais, expected/observedLocalRevision, conflito de cabeca e ligacao a operacao. Sem fusao automatica. |
| receipt | Campos P1 e laboratoryOnly=true, ligados ao registo privado do simulador. Nunca recibo Google autenticado. |
| export | Fotografia da instancia, bases, operacoes, branches, corpos, recibos, revisao e checksum. |

## Estados e evidencias

Nao existe metodo publico para forcar fase ou fornecer booleans de guards. As funcoes consultam IndexedDB, reconstroem pedidos e verificam o simulador.

- `stage`: guarda proposta/pedido UI_DIRTY; ainda nao e cabeca aceite. A proposta ja pode ser recuperada, mas nao autoriza envio.
- `commit`: verifica CAS e referencias na transacao; LOCAL_DURABLE apenas depois de oncomplete. Divergencia grava CONFLICT e branch na mesma transacao.
- `save`: stage + commit; falha de armazenamento pode persistir STORAGE_BLOCKED se houver espaco para esse registo. Se nem isso couber, o erro e explicito e mantem-se a ultima fase comprovada, nao uma fase inventada.
- `send`: exige pedido LOCAL_DURABLE, ou retoma original explicitamente autorizada de REMOTE_UNKNOWN, e preflight fresco vinculado a conteudo/base/epoca na fonte ficticia. SENDING e persistido antes da chamada.
- Falha depois do envio conserva pedido e REMOTE_UNKNOWN. Se a persistencia desse estado tambem falhar, a ultima fase duravel pode ser SENDING; recover trata-a como incerta.
- `acceptReceipt`: consulta o verificador do simulador e valida ID/base/result/requestHash/payloadHash/sourceId antes de persistir REMOTE_COMMITTED.
- `acknowledge`: usa comprovativo vinculado e transacao local. Falha no ack tenta guardar LOCAL_ACK_PENDING, sem fabricar sucesso. Uma edicao/proposta posterior impede headSynced=true. Um lookup historico nao reativa uma cabeca antiga.
- `recover`: consulta somente o pedido original. PENDING/UNKNOWN nao autorizam reenvio automaticamente; a retoma explicita precisa novo preflight positivo. Uma base ultrapassada bloqueia, sem alterar o pedido.

Detalhe de adaptacao P1: UI_DIRTY tem uma captura de proposta duravel separada da aceitacao como workspace; a recuperacao explicita de STORAGE_BLOCKED permite novo commit do mesmo original verificado. Nao sao arestas cegas nem alteram o manifesto P1. CONFLICT e terminal para aquela identidade; uma resolucao futura exige proposta distinta.

Um ack pode ser localmente aplicado sem marcar o workspace inteiro SYNCED. Nesse caso a operacao conserva REMOTE_COMMITTED com ackApplied e a proposta posterior permanece independente. COMMITTED/SYNCED nesta biblioteca tem sempre ambito de laboratorio.
