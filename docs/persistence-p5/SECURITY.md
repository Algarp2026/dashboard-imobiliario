# Seguranca e contrato futuro

## Implementado apenas no laboratorio

labSessions cria credenciais opacas e associa, num registo privado do controlador, sourceId, scopes e apiEpoch. O browser nao inscreve credenciais num endpoint nem escolhe uma Sheet por header. A fonte valida o principal antes de ler resultados. Credencial ausente, revogada, fonte incorreta ou scope insuficiente falham explicitamente.

O fence de escrita verifica epoch do codigo-fonte, epoch do principal autenticado da API e protocolo do pedido. Um header writerEpoch=2 sem principal compativel e sem ticket vinculado nao passa. A API antiga ficticia nao contorna a fonte nova. Tickets efemeros ficam em memoria do controlador, ligados a credencial, requestHash, payloadHash, base e referencia da ancora, com expiracao; nao sao arquivados nem exportados.

Mesmo com ticket, a fonte adquire lock por CAS e verifica a ancora/base e validacao comercial antes de B5. Mesmo requestId com requestHash diferente e rejeitado. Mesmo payload com ID diferente nao identifica a mesma operacao. Uma operacao incerta nao e substituida por outra para desbloquear a escrita.

verifyReceipt ignora qualquer alegada autoridade do cliente: volta a consultar a fonte e compara o recibo completo com a prova ancorada. O hash nao e assinatura/autoria. Um atacante com acesso administrativo para reescrever toda a fonte/B6 fica fora da prova de integridade por hashes; exigem-se autenticacao e controlo de acesso reais no futuro.

Nao ha logs de payloads ou credenciais. Os diagnosticos usam estados/motivos fixos e contagens/tempos. Os relatorios contem exclusivamente metadata de testes ficticios.

## Contrato de integracao futura, nao publicado

- Futura rota GET autenticada, private/no-store, com scope de consulta e fonte resolvida pela configuracao administrativa do servidor.
- Negociar capacidade historicalLookup e writerEpoch no codigo da API e da fonte; nao confiar so em valores fornecidos pelo frontend.
- Validar o envelope/limites, identidade original e ambito; nao aceitar um recibo ou prova do browser como autoridade.
- Resposta minima de resultado; nunca devolver a base completa para consultar uma operacao.
- Executable Apps Script com identidade administrativa/caller autorizados, ambiente de testes separado e fence independente antes de B5.
- Publicacao coordenada apenas apos autorizacao, teste OAuth/Execution API real num ambiente ficticio e inventario dos escritores antigos.

Nenhuma destas linhas regista uma rota, altera permissoes, credenciais, variaveis de ambiente ou configuracao Vercel/Google. A autenticacao de laboratorio **nao e OAuth Google**.

## Preservacao

UNKNOWN, PENDING, quota e falhas deixam pedidos e preparacoes intactos. So a limpeza normal de uma intencao ja comprovadamente ativada e permitida na fonte ficticia. Nao ha pruning de backups, branches ou comprovativos. Exportacoes/checksums locais nao conferem autorizacao de eliminacao. P4 mantem todas as referencias protegidas, inclusive recibos laboratoriais.
