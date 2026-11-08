# Impacto e limites de segurança

| Classe | Alteração P7 | Impacto |
|---|---|---|
| Produto | Adaptador do seguimento | Só persistir alteração efetiva. Mesma versão, mesma gravação confirmada; nenhuma migração |
| Produto | Predicado dos contadores | Apenas leitura. Não altera o histórico, preços, operações, relatórios exportados ou cálculos de PDFs |
| Testes e documentação | Cenários sintéticos, auditoria e registos de resultados | Sem carga no produto. As verificações exatas antigas só normalizam o predicado P7 e as duas chamadas de contagem autorizadas |
| Protocolo/API/fonte | Nenhuma alteração | B5/B6, CAS, read tickets, autenticação, confirmação, recuperação e backups intactos |
| P1–P6 | Nenhuma alteração nem ativação | Laboratórios isolados; IndexedDB P3 não é autoridade operacional |

O Apps Script de produção não foi executado. Fixtures com Apps Script em VM
exercitam validação e gravação sem a rede Google. Não se consultou a Sheet, nem
se abriram backups do utilizador. Não houve merge, publicação ou alteração de
configuração. **As correções no código carregado pelo CRM podem entrar em
produção por merge.**

Não aprovar merge enquanto persistir o bloqueio de cronologia descrito em
[Matriz de estados](STATE_MATRIX.md). Também continuam os dois limites
preexistentes reproduzidos por P1: sobreposição de caches offline em separadores
e possibilidade de exportação com dados e base de instâncias diferentes. Os
testes P1 demonstram esses limites; não os marcam como resolvidos. Não confundir
esta regressão com ativação de armazenamento experimental ou uma reparação do
fluxo multi-separador. Nenhuma intervenção em produção é autorizada por este
relatório.
