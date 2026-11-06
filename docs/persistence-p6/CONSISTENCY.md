# Fotografia oficial e consistencia

capture le uma fotografia duravel da fonte e valida fonte/geracao, B6, versao/blocos, comprimentos, hashes e estrutura comercial. Rele a fonte e exige geracao e autoridadeHash identicas. Uma fonte em movimento devolve SOURCE_CHANGED; a tentativa nao e completada com dados de espelhos.

| Formato | Tratamento |
|---|---|
| B6 operacional format=2 | Valida checksum legado e versao ativa, conserva receipt/previous, sem fabricar cadeia historica |
| P5 format=3 | walk valida a cadeia ancorada e pedidos; ancestrais podem sustentar comparacoes historicas |
| B2 sem B6 | LEGACY_UNANCHORED; nao e fallback automatico nem base autorizada de reparacao |
| B6 desconhecido/corrompido | SOURCE_UNVERIFIED e bloqueio |

O snapshot inclui JSON completo/raw, revisao, descritor, ancora/provas, identidade, B5, historia disponivel e imagem integral da autoridade. Um B5 PENDING nao significa commit. B5 desconhecido ou semanticamente invalido bloqueia a fotografia; BLOCKED e identificado e impede manutencao automatica.

## Estados por folha

- CONSISTENT: igualdade exata com a projecao atual, nao uma declaracao de origem historica.
- MISSING: folha ausente.
- PARTIAL: clear vazio ou prefixo estrito das linhas esperadas.
- CORRUPT: cabecalho/forma/tipos estruturais invalidos.
- AHEAD_OF_AUTHORITY: tabela corresponde exatamente a uma candidata B5 verificada e tem evidencia VM correspondente; a candidata continua nao ativada.
- STALE: tabela/evidencia corresponde a um ancestral verificado P5, nao ao atual.
- UNKNOWN: diferenca sem evidencia suficiente da origem/circunstancia. Um valor manual, truncado ou tipo de celula diferente pode cair aqui sem se inventar causalidade.
- SOURCE_UNVERIFIED: nao e possivel verificar a autoridade.

mirrorRevision permanece null: mesmo a igualdade total de celulas nao prova em que momento a folha foi escrita. association identifica apenas a projecao verificada com que coincide e a sua evidencia tecnica. Claims sao metadata derivada local, nao assinaturas ou comprovativos comerciais; nao podem confirmar uma operacao ou fazer avancar B6.

Relatorios mostram folha, revisao oficial, snapshotHash, estado, contagens/indices de linhas/colunas, zonas header/body, bloqueios e tempos. Nao mostram valores das celulas, clientes, contactos ou precos. Planos privados contem as projecoes para execucao e nao devem ser registados em logs ou publicados.

Uma segunda leitura apos gerar/comparar as projecoes deteta mudancas concorrentes, inclusive nos espelhos. O resultado e reproduzivel apos reabertura com os mesmos registos. Em caso de incerteza, P6 bloqueia ou conserva UNKNOWN, nunca confirma pela semelhanca de valores.
