# Compatibilidade e limites de ativacao

Nenhum modulo P1-P4 ou ficheiro operacional foi alterado. A P5 e importada explicitamente apenas pelos testes/laboratorio. Nao ha inicializacao no website.

## Matriz de contrato simulada

| Frontend | API | Fonte | Resultado |
|---|---|---|---|
| Antigo | Antiga | Nova | Fonte rejeita principal/protocolo incompativeis antes de B5 |
| Antigo | Nova | Nova | Epoch antigo bloqueado; header falsificado sem ticket/principal nao serve |
| Novo | Antiga | Nova | Adaptador bloqueia capacidade; fonte tambem rejeita o principal antigo |
| Novo | Nova | Antiga | Capacidade historica ausente -> UNKNOWN; escrita nova bloqueada |
| Novo | Nova | Nova | Somente com autorizacao, ticket, CAS e integridade; consulta continua readonly |

As oito combinacoes de epochs 1/2 sao testadas no nucleo. Fonte antiga e API antiga nessa matriz sao papeis/capacidades simulados, nao deployments reais. O formato B6 antigo tambem e testado negativamente: nunca e interpretado como cadeia completa. O harness executa o Apps Script atual em VM para comparar comportamento real dos seus formatos/blocos. A integracao OAuth/API/Apps Script reais continua pendente.

## P3 e P4

createRemote adapta os metodos preflight/write/inspect/verifyReceipt/read ja esperados pela P3. Recibos mantem os campos anteriores, version=1 e laboratoryOnly=true; nao se altera o schema local.

Apos A ficar REMOTE_UNKNOWN e B ser ativada externamente, recover(A) consegue confirmar A pela cadeia. Se existir proposta posterior, a P3 conserva essa cabeca, pedido, branch e fase por confirmar. Confirma a operacao A, mas devolve headSynced=false. A base conhecida pode avancar apenas para o resultado de A, nao para B nem para uma versao inventada; uma tentativa posterior exige nova verificacao CAS com a fonte.

O teste nativo grava uma proposta posterior, confirma A historicamente, exporta de forma coerente, reabre o perfil e repete a recuperacao. A fonte permanece na versao B/C e o rascunho local nao e substituido. P4 continua a proteger os corpos/recibos, sem candidatos de limpeza fabricados.

Uma prova gravada localmente nao basta para confirmar offline: verifyReceipt consulta novamente a fonte. Fonte indisponivel implica bloqueio conservador, nao reconfirmacao por flags locais.

## Historico anterior e rollback

Nao existe migracao real nem cadeia retroativa. Uma origem preexistente sem provas recebe dominio com completeHistory=false, preserva o conteudo e responde UNKNOWN onde faltar prova. Esta implementacao conservadora bloqueia novas escritas nesse dominio ate existir um procedimento explicitamente aprovado; nao pretende resolver esse corte automaticamente.

Remover os modulos experimentais reverte apenas o laboratorio. Uma futura ativacao nao pode ser revertida reativando escritores antigos que desconhecem as provas. Exige plano de suspensao/escritores/leitores compativeis, backup verificado, identidade administrativa e coordenacao separada.

P6-P9, migracao/ativacao, reparacao de locks apos crash, GC de historico e compatibilidade Google real nao foram implementadas.
