# Consulta historica segura

Entrada estrita: requestId, requestHash, payloadHash, baseRevision, sourceId. O adaptador seleciona a fonte no servidor e calcula os hashes do pedido original; uma fonte arbitraria fornecida pelo browser nao altera o destino. Sessao deve ter scope lookup para essa fonte.

| Resultado | Evidencia | O que NAO autoriza |
|---|---|---|
| COMMITTED | Pedido exato alcancavel e integralmente verificado a partir de B6 | Restaurar a versao ou confirmar uma cabeca local posterior |
| PENDING | Intencao exata/preparacao orfa verificavel sem ativacao | Descartar o original ou reenviar automaticamente |
| BLOCKED | Mesmo ID com identidade/conteudo divergente | Reutilizar o ID com outro conteudo |
| NOT_FOUND | Cadeia completa no dominio consultado, sem correspondencia | Concluir nunca executado noutro dominio ou reenviar automaticamente |
| UNKNOWN | Falta de prova, leitura falhada, fonte movida, formato/cadeia/limite | Qualquer confirmacao ou retoma automatica |

Respostas contem fonte, dominio, motivo fixo, readOnly=true, retryAuthorized=false e metricas sem payloads. COMMITTED inclui recibo minimo e referencias de prova. Nao devolve clientes, precos, emails, contactos, tokens, tickets ou JSON completo.

## Caso A, B e C

R0 -> manifesto A/R1 -> manifesto B/R2 -> manifesto C/R3. Consultar A/B/C fora de ordem devolve as identidades originais e recibos estaveis; B6 permanece em C/R3. Repetir apos reinicio nao muda o resultado. Nenhuma consulta envia pedidos de escrita ou reativa um backup.

Uma versao preparada ou backup de A, mas nao apontada por B6 nem ancestral deste, nao confirma A. Historico anterior sem cadeia demonstravel fica UNKNOWN; nao se cria uma ligacao retroativa.

## Retoma autorizada no laboratorio

1. Conservar o pedido imutavel original.
2. Fazer lookup autenticado exato.
3. COMMITTED permite somente verificar/aplicar o recibo da operacao. verifyReceipt repete a consulta na fonte, nao confia no recibo apresentado pelo cliente.
4. PENDING exige opt-in explicito resume=true, fonte/base ainda compativeis, ticket novo vinculado a ancora e identidade e validacao sob lock. Nao troca ID nem conteudo. Blocos/descritivos preparados validos podem ser reutilizados; restos parciais nao ativados permanecem preservados.
5. UNKNOWN/BLOCKED interrompem. NOT_FOUND isolado nao e autorizacao de retry; uma nova tentativa necessita de uma chamada explicita de preflight e de todas as verificacoes/ticket/CAS. O adaptador nao reenvia por receber NOT_FOUND.

No P3, retry de REMOTE_UNKNOWN continua a exigir a opcao explicita ja existente. recover apenas consulta/aplica prova; nao envia outra gravacao.

## Limites

Profundidade por defeito 256 incluindo GENESIS, configuravel ate 512; orfaos ate 1024 na verificacao de ausencia; orcamento cooperativo por defeito 5000 ms, maximo 10000 ms. Falha, movimento concorrente ou excesso -> UNKNOWN. Nao ha indice de resultados tomado como autoridade nem fallback para backups.

O orcamento e cooperativo e nao cancela uma chamada de armazenamento em curso. O backend laboratorial le uma fotografia completa e pode consumir memoria antes de atingir o limite de percurso; isso e um bloqueio de escalabilidade para uma futura API real, nao uma garantia de uso de memoria constante.
