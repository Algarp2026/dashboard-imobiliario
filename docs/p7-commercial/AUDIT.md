# P7: auditoria da base

Base: `3e89cb769533d8e8bd75bbf5dc69bdac74f6cc43`. Branch local:
`codex/p7-commercial-followup`. Revisão inicial anterior a edições no produto.
Toda a evidência vem de fixtures isoladas.

| Funcionalidade | Já existe? | Classificação inicial | Evidência | Defeito / alteração necessária |
|---|---|---|---|---|
| Resposta, pendência, duas datas, observação, prioridade e lembretes | Sim | IMPLEMENTADO E VALIDADO | `commercial-profile-followup-browser`: gravação, refresh, lembrete concluído/removido; eventos e demais dados iguais | Preservar |
| Guardar sem alterações | Sim | IMPLEMENTADO COM DEFEITO REPRODUZIDO | `commercial-p7-browser` na base: editar e apagar observação de cliente sem `followupV1` enviou 1 POST em vez de 0 | O adaptador inicializa `followupV1` com valores derivados mesmo sem alteração efetiva. Separar a comparação da ficha visível da decisão de persistir |
| Precedência de decisões, dados legados e desconhecidos | Sim | IMPLEMENTADO E VALIDADO | Modelo `decisionState`, `contactInfo`, `priority`; testes dirigidos de campos desconhecidos, dois contadores e prioridade | Preservar a precedência aprovada |
| Apresentação e preparação | Sim | IMPLEMENTADO E VALIDADO | `commercial-client-workflow`, `commercial-pr6-regression-browser`; [9,24,30] passa a [9,30] e mantém-se após correção de preço e refresh | Preservar seleção e original |
| Correção datada após desistência global | Sim | IMPLEMENTADO COM DEFEITO REPRODUZIDO / BLOQUEADO POR DEPENDÊNCIA | Núcleo real + Apps Script em VM: o original é preservado, mas a correção passa de Desistiu a Apresentado e a fonte aceita | Exige alinhar validação e projeção no cliente/API/fonte; sem correção parcial |
| Relações por fração e precedência de reserva/venda | Sim | IMPLEMENTADO E VALIDADO | Projeções `relation`, `project`, `clientProjection`; `commercial-p7-browser` e `commercial-stage-engine` | Sem alteração às regras de stock; exceção de cronologia acima |
| Contagem de apresentações no Dashboard e em Frações/Vendas | Sim | IMPLEMENTADO COM DEFEITO REPRODUZIDO | Dashboard Chromium fictício: 9 em vez de 8, incluindo a correção histórica | O predicado conta pelo tipo e não distingue a correção de uma apresentação efetiva |
| Relatórios e PDF | Sim | IMPLEMENTADO E VALIDADO | `commercial-presentation-pdf-browser`, `commercial-client-complete-exports`, `crm-reform-report-browser` | Sem alteração |
| D2, foco, Escape, modais secundários, scroll e ausência de overflow | Sim | IMPLEMENTADO E VALIDADO em Chromium | `commercial-profile-followup-browser`: quatro tamanhos, sticky, diálogo e retorno do modal | Cobrir restantes motores; sem redesenho |
| Rascunhos, GET concorrente e falha remota | Sim | IMPLEMENTADO E VALIDADO em Chromium | `commercial-profile-followup-browser`: duas sessões, rascunho, erro e refresh | Completar bateria de sincronização e recuperação |
| P1–P6 e #29 | Sim | IMPLEMENTADO E VALIDADO no âmbito isolado | Laboratórios e hotfix separados; P1 reproduz os defeitos preexistentes P1-CUR-01/02 | Sem ativação ou alterações; defeitos de persistência fora das correções P7 |
| Produção, migração, P8/P9 | Não aplicável | FORA DO ÂMBITO | Restrições da P7 | Não executar |

`commercial.html` carrega os módulos na ordem de dependência e não referencia
laboratórios P1–P6. `commercial-opportunity-ui.js` integra seguimento e ações
da ficha, `commercial-client-workflow-ui.js` trata comunicações históricas.
A navegação D2 e os overlays são geridos por `view-workspace.js`,
`commercial-client-workspace.js` e pelos estilos existentes. A validação
de efeito e proveniência é partilhada com `server/commercial-integrity.js`
e `google_commercial_integrity.gs`; a auditoria não altera esse contrato.

Ver `VALIDATION.md` e a matriz de rastreabilidade para o resultado final.
