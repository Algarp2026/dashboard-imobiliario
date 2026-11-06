# Recuperacao administrativa - apenas planeamento

recoveryReport consulta os diagnosticos e a copia, sem escrever em qualquer lado.

| Situacao | Decisao tecnica |
|---|---|
| Fonte saudavel, espelhos divergentes e copia correspondente | DERIVED_REPAIR_POTENTIALLY_AUTHORIZABLE |
| Fonte saudavel, sem copia verificavel | VERIFIED_INDEPENDENT_COPY_NEEDED |
| Fonte/copia correspondentes | SOURCE_AND_COPY_MATCH, sem declarar atualidade eterna |
| Fonte saudavel e copia de outra autoridade | DIVERGENCE_REQUIRES_INVESTIGATION |
| Fonte corrompida, copia integra | ADMINISTRATIVE_RECOVERY_PROPOSAL_ONLY |
| Fonte indisponivel, copia integra | SOURCE_UNAVAILABLE_COPY_NOT_KNOWN_LATEST |
| Fonte e copia nao verificaveis | INSUFFICIENT_EVIDENCE |

Todas as decisoes devolvem automaticRecovery=false, mayChangeAuthority=false, commercialConfirmed=false e copyKnownLatest=false. Um pedido remoto incerto conserva identidade/conteudo e continua a necessitar de consulta P5 autenticada quando a fonte estiver disponivel. Um resultado P6 nao altera a fase da operacao P3 nem fabrica recibos.

## Nao implementado por desenho

Nao existe metodo de restaurar JSON oficial, apontar B6 para uma versao antiga, limpar B5, forcar CAS, marcar manualmente COMMITTED ou reativar backup. Uma copia local com cadeia consistente nao substitui a ancora autenticada atual da fonte. A apos B/C continua historica, nao cabeca atual.

## Gates antes de qualquer integracao real

1. Aprovacao separada de arquitetura/seguranca e dos procedimentos administrativos, sem dados reais nos ensaios.
2. Ambiente Google real de TESTES com dados ficticios, caller/sessao/scopes reais, recurso selecionado pelo servidor e identidades confirmadas.
3. Verificacao de formatos e fidelidade das folhas no servico, incluindo locale/formulas/tipos/limites, latencia, quotas e falhas RPC.
4. Desenho de manutencao que partilhe efetivamente o mesmo lock/codigo-fonte do escritor e revalide B5/B6, com autorizacao administrativa para manutencao de pendencias.
5. Contrato seguro de recuperacao de locks persistidos. Nao expirar locks apenas pelo tempo.
6. Backend realmente independente (conta/dispositivo/servico conforme risco), permissoes, protecao dos dados pessoais, cifragem, retencao e verificacao por restauracao numa copia isolada.
7. Validacao de armazenamento fisico/eviction/modo privado, Safari/iOS reais e falha de energia. Nao confundir quota injetada ou crash de processo com essas provas.
8. Plano de publicacao coordenada com leitores/escritores antigos, backups independentes verificados e rollback sem reativar escritor incompativel.
9. Autorizacao especifica antes de qualquer recuperacao oficial, nova escrita CAS ou publicacao. Nenhuma dessas operacoes foi executada.

P6 permanece desligada; P7-P9 nao foram iniciadas. As configuracoes de Preview/Production e acesso de escrita devem ser revistas antes de qualquer publicacao futura pelo utilizador; esta entrega nao as altera nem garante isolamento de um deployment que nao foi criado.
