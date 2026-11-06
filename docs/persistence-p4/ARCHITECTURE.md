# P4 - desenho e compatibilidade

P4 e exclusivamente experimental. Nenhum ficheiro operacional ou schema do CRM real e alterado.

Adaptacao indispensavel da P3: openLocal aceita explicitamente um bodyCodec de laboratorio e stores adicionais apenas num destino experimental novo. Sem estas opcoes a P3 conserva codec P2, schema versao 1 e comportamento anterior. A P3 nao importa P4 automaticamente.

Identidade logica: o bodyRef b1 e rawHash P2 continuam a identificar bytes originais e familia de representacao (UTF-16LE ou grafo structured-clone). A compressao nao altera esses identificadores, payloadHash ou requestHash. Representacao fisica gzip tem version 2, codecVersion 1 e encodedHash independente. A P4 le corpos P2 identity e envelopes legacy atraves do leitor P2. Um leitor antigo sem suporte nao deve escrever sobre representacoes desconhecidas.

Deduplicacao verifica bytes descodificados antes de reutilizar uma representacao fisica diferente. Nao usa apenas revisao comercial, ID de cliente ou hash de outro dominio.

Compressao de um corpo persistido usa copy-on-write: nova representacao preparada duravel, releitura/validacao, depois troca atomica por CAS. Uma falha conserva o original e/ou a preparacao protegida. Nao se elimina a unica copia recuperavel.

Retencao primeiro analisa toda a fotografia duravel. Nenhuma operacao ou recibo e removido por idade/flag/export. Apenas corpos scratch explicitamente criados pelo laboratorio, sem referencias e com proveniencia verificavel, podem ser candidatos. Formatos desconhecidos e dependencias incompletas bloqueiam limpeza. Isto nao e uma politica aprovada para apagar historicos comerciais reais.
