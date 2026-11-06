# Schema P3 - laboratorio versao 1

Nome permitido: `the-view-p3-lab.*`; origem HTTP `127.0.0.1:53xxx`, explicitamente synthetic=true. O ponto de entrada rejeita origens comerciais e nomes operacionais antes de abrir DB. Nenhum modulo inicializa automaticamente armazenamento.

| Store | Chave | Responsabilidade |
|---|---|---|
| workspaces | workspaceId | Cabeca partilhada, base remota conhecida, revisao local monotona, operacao ativa, epoch e sourceId. |
| instances | instanceId | IdentityHash, workspace vinculado, generation e fotografia persistente da instancia. |
| bodies | bodyRef | Corpos imutaveis do codec P2, enderecados por representacao e SHA-256. |
| operations | operationId | Pedido original por referencias, identidade, estado, sequence e ligacao ao recibo. |
| requests | requestId | Indice unico de operationId/requestHash; colisoes rejeitadas. |
| branches | branchId | Operacao divergente, base, payload e revisoes esperada/observada. |
| receipts | requestId | Prova sintetica verificada, nunca usada como confirmacao oficial. |

Registos mutaveis sao versionados e incluem recordHash calculado fora da transacao; corpos sao verificados por codec/comprimento/rawHash. Hashes locais detetam corrupcao acidental, nao um atacante capaz de reescrever simultaneamente os conteudos e todos os hashes.

O laboratorio guarda o hash da capacidade de instancia, nao o token original. O chamador conserva o handle proprio `{instanceId, token}` e fornece-o na reabertura. Um token de outra instancia falha. O harness de testes conserva esses handles fora do processo do navegador para provar retoma, sem os incluir nas exportacoes. Perder o handle nao autoriza assumir automaticamente outra identidade; recuperacao/adocao administrativa exige desenho futuro.

Revisoes locais, sequence e generation sao inteiros seguros crescentes; o limite numerico provoca erro explicito, nunca wraparound. IDs aleatorios sao adicionalmente verificados contra reutilizacao no armazenamento.

Base e cabeca podem partilhar o mesmo corpo. Pedidos guardam apenas header e referencias; dois payloads identicos reutilizam um corpo. Nenhum GC, compressao nova, limpeza de historico ou politica de retencao e executado.

Transacoes strict sao obrigatorias; se o motor recusar, a operacao bloqueia. Strict e uma garantia solicitada ao motor, nao prova contra falha de energia ou avaria fisica. Nao se atualiza a versao/schema das bases operacionais ou shadow existentes.
