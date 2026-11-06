# Exportacao coerente P3

exportInstance executa uma unica transacao readonly para workspace, instancias, corpos, operacoes, indices, branches e recibos. Depois de oncomplete, os dados capturados sao clones independentes; reconstrucao, hashes e checksum nao consultam localStorage, readSyncMeta ou UI global.

O conteudo selecionado e a fotografia persistente da propria instancia, nao a cabeca mais recente de outro separador. refresh e explicito e nao altera pedidos/branches ja capturados. Se uma cabeca adotada referencia outra operacao, essa operacao indispensavel e incluida; isto nao e mistura de metadados de instancias sem relacao.

O envelope inclui identidade sem token, revisao local, dados da cabeca, base selecionada, revisao dessa base, pedido original, restantes operacoes relacionadas, branches, comprovativos vinculados, corpos e hashes, versao, problemas e checksum.

RECOVERABLE exige referencias presentes, corpos validos, hashes das bases/pedidos e indices coerentes. Significa recuperabilidade local daquela fotografia, nao ausencia de conflitos nem autorizacao para restaurar/escrever na fonte. Uma branch pode ser recuperavel e continuar em CONFLICT.

FORENSIC preserva o disponivel, identifica referencias/provas incoerentes e nao promete recuperacao automatica. Uma base ausente permanece ausente; nao e preenchida com metadados globais. Uma proposta apenas em memoria e incluida separadamente com MEMORY_DRAFT_NOT_DURABLE; nao e apresentada como cabeca duravel. Dados e base validos podem ser incluidos sem esconder problemas noutros corpos.

Corpos usam arrays de bytes no JSON exportado e conservam o mediaType/rawHash originais. O checksum cobre o envelope completo sem o campo checksum. O token da instancia e tickets efemeros nao sao exportados. Nao existe importador/restauro remoto ou libertacao de backups nesta P3.

Testes especificos: P3-EXPORT-01 altera o workspace durante a fase de hashes do export e demonstra fotografia coerente; uma referencia removida numa fixture produz FORENSIC. P3-BASES-01 demonstra duas bases distintas sem contaminacao. P3-CAS-01 reconstitui ambas propostas apos reabertura.
