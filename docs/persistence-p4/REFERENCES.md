# Inventario de referencias

O dominio e uma unica DB experimental, sem partilha fisica entre DBs/perfis. As fontes operacionais e shadow nao sao alteradas. Uma futura referencia externa teria de ser inventariada/pinned antes de autorizar GC; esta entrega nao ativa tal partilha.

Stores P3: workspaces, instances, bodies, operations, requests, branches, receipts. Stores adicionais P4: p4Audit, p4Pins, p4Archive, p4Migration e p4Prepared. O destino opt-in e novo, com prefixo the-view-p3-lab.p4.* e schema 2. Nao se atualiza a versao de nenhuma DB do CRM real.

Raizes verificadas:

- Cabeca/base dos workspaces e fotografias das instancias.
- Base/payload de todas as operacoes, inclusive UI_DIRTY, REMOTE_UNKNOWN, LOCAL_ACK_PENDING e SYNCED.
- Bases e propostas das branches, mesmo se resolved ou antigas.
- Recibos e os seus pedidos/dados associados.
- Checkpoints/pins de recuperacao e preparacoes de compressao.
- Arquivos historicos e formatos desconhecidos.
- Referencias b1 encontradas conservadoramente em campos de payload extensivel.

Nao existe contador de referencias tomado como autoridade. A analise reconstroi relacoes a partir da fotografia duravel, verifica checksums dos registos e corpos, cruza os hashes de base/payload/pedido e deriva novamente a classificacao dos arquivos pelo leitor P2. Um header plausivel ou flag de confirmacao nao basta.

Campos estruturais desconhecidos, stores inesperados, corpos ausentes, codec/corpo invalido, provas incompativeis ou classificacao de arquivo incoerente bloqueiam limpeza. Conteudo comercial desconhecido continua preservado nos bytes originais; um token semelhante a bodyRef em payload pode causar protecao adicional conservadora.

Inventario apresenta as quatro categorias: MANDATORY_PROTECTION, OPERATIONAL_SAFETY_RETENTION, POTENTIALLY_RELEASABLE e UNKNOWN_OR_UNVERIFIABLE. As duas primeiras continuam a ter referencias protegidas; nenhuma e eliminavel automaticamente. SYNCED/recibo sintetico nao equivalem a confirmacao oficial ou autorizacao de pruning.

p4Audit regista apenas corpos novos criados por putScratch. Reutilizar um corpo preexistente nao lhe atribui retroativamente proveniencia descartavel. O hash local deste registo deteta corrupcao, nao um atacante capaz de reescrever toda a DB. Autenticacao de utilizadores e provas remotas continuam fora desta fase.
