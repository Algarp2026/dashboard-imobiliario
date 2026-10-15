# Correções da auditoria comercial

Base: `main` em `87dab88`. Branch: `codex/fix-commercial-audit-defects`.
Esta revisão complementa o relatório histórico `COMMERCIAL_STAGE_ENGINE.md`, sem refazer a arquitetura.

## Cinco correções

1. **Reabertura:** a desistência global passa a delimitar o histórico relevante da relação. Contactos, notas, documentação e preferências não recuperam a proposta antiga. Apenas movimentos comerciais válidos, datados e ligados à fração podem reabrir a oportunidade; uma proposta de B não reabre A.
2. **Estado manual:** `manualStage` fica preservado, mas Em negociação não ultrapassa uma desistência global válida. `updatedAt` genérico não é inventado como data da decisão manual. Divergências ficam sinalizadas; reservas/vendas confirmadas continuam prioritárias.
3. **Cancelamentos/proveniência:** eliminar ou alterar efeitos de um cancelamento que ainda é origem da disponibilidade exige revisão e é bloqueado antes de qualquer mutação. Notas continuam editáveis. Referências de estado, preço ou comissão fora das frações indicadas bloqueiam o plano, sem alargar a operação a outras frações. Referências órfãs já existentes são sinalizadas, não reparadas automaticamente.
4. **Desistência manual:** associação histórica deixou de significar oportunidade ativa. Ao guardar Desistiu no editor de estado existe confirmação global explícita, registada como evento Desistência com `globalWithdrawal: true`, data/hora e origem manual. Associações, reservas e vendas não são removidas. Tentativas repetidas não duplicam o encerramento. Um Desistiu manual legado sem confirmação continua histórico e exige revisão.
5. **Disponibilidade manual:** ajustes não podem criar nem contrariar Reservado/Vendido, mesmo com titularidade ambígua. O caminho é o evento comercial validado. Ajustes administrativos Disponível/Indisponível continuam possíveis quando não existem conflitos; exigem motivo/confirmacão, verificam alterações da base durante o diálogo e registam um evento como nova origem. Preços e comissões não são recalculados nem apagados. Cancelar o diálogo é uma operação sem efeitos.

`globalWithdrawal()` rejeita datas inválidas, indicação global explicitamente falsa e combinações com libertação de reserva. O suporte legado sem fração mantém-se apenas quando os dados são inequívocos e não administrativos. As novas funções entram na verificação de módulos para detetar carregamentos incompatíveis.

## Testes e resultados

| Verificação direcionada | Resultado |
| --- | --- |
| Desistência seguida de contacto recebido/enviado, nota, documentação ou preferências | Continua Desistiu |
| Desistência seguida de nova proposta válida | Em negociação apenas na fração correspondente |
| Em negociação manual antigo, inclusive com updatedAt posterior genérico | Desistência prevalece; revisão sinalizada |
| Desistência global com frações simplesmente associadas | Encerra interesses, mantém associações |
| Desistência manual legada sem confirmação | Não é convertida automaticamente em encerramento global |
| Reservas/vendas confirmadas e desistência global | Precedência e proveniência preservadas |
| Eliminar/mover cancelamento referenciado | Bloqueio atómico, JSON intacto |
| Editar notas de cancelamento | Mesmo ID e referência preservados |
| Origem fora das frações indicadas ou já órfã | Bloqueio/sinalização, sem limpeza automática |
| Ajustar manualmente reservas/vendas próprias ou alheias | Bloqueio, sem alterações em preços/comissões/fontes |
| Ajuste administrativo legítimo | Nova origem válida, preços preservados |
| Cancelar diálogo ou base mudar durante o diálogo | Sem gravação do ajuste |
| Editor real de estado, confirmar/cancelar e repetir | Confirmação respeitada; um evento global, sem libertar reserva |
| Eventos em ordem invertida | Mesmos resultados |

- `tests/commercial-audit-defects.test.js`: aprovado com dados fictícios, adapters reais em VM e zero acessos à rede/armazenamento real.
- `tests/commercial-stage-engine.test.js`: aprovado. Dois casos foram ajustados: desistência manual agora tem evidência de confirmação; chamada com proveniência fora do âmbito deve bloquear, em vez de ignorar silenciosamente.
- Todas as **28 suites** `tests/*.test.js`: aprovadas.
- `node --check`: aplicação comercial, workflow, app, config e novos testes aprovados.
- `tests/commercial-audit-defects-browser.mjs`: desktop 1440x1000 e mobile 390x844 aprovados; bloqueios de disponibilidade, cancelamento dos dois diálogos, refresh, cache inalterada, zero POSTs comerciais e zero erros JS.
- Uma execução inicial do teste de navegador falhou por selecionar dois botões Cancelar/fechar. O seletor do teste foi corrigido; não era uma falha da aplicação. Nenhuma falha permanece na validação final.
- API, Apps Script, autenticação, dados, plantas e bloco do protocolo de sincronização comparados com a base: sem alterações. Não há regularização automática de estados no carregamento.

## Ficheiros

- `commercial-client-workflow.js`: fronteira de encerramento, oportunidades efetivas, decisões manuais e proteção das referências.
- `commercial.js`: planos de efeitos, ajustes administrativos, confirmação explícita de desistência e verificação de módulos.
- `tests/commercial-audit-defects.test.js`, `tests/commercial-audit-defects-browser.mjs`: novos testes direcionados.
- `tests/commercial-stage-engine.test.js`: compatibilidade dos dois casos acima.
- `vercel.json`: deployment Git automático desativado exclusivamente para esta branch.
- Este relatório.

## Segurança e limites

Sem migração destrutiva ou reescrita histórica. A confirmação manual acrescenta apenas um evento no formato extensível existente; não altera KEY, Store, API ou protocolo CAS. Clientes legados não recebem esse evento automaticamente. A UI e os relatórios continuam a consumir a mesma projeção central.

Cancelamentos com disponibilidade anterior desconhecida, referências já órfãs, titularidade ambígua e desistências manuais sem cronologia exigem revisão específica. Esses bloqueios são intencionais; não se tenta reconstruir ou restaurar uma reserva por inferência.

Antes da publicação da branch, verificar `git.deploymentEnabled["codex/fix-commercial-audit-defects"] === false`, branch atual e diff. A regra é suportada pela [documentação oficial da Vercel](https://vercel.com/docs/project-configuration/git-configuration#git.deploymentenabled). Não há workflows GitHub neste checkout. A regra não autoriza deployments manuais ou publicação na main.

Não houve consulta/escrita na Google Sheet real, publicação de branch, merge, deployment ou promoção durante esta implementação. Os testes utilizaram exclusivamente fonte fictícia isolada. A criação da única PR para `main` depende da publicação desta branch pelo GitHub Desktop, conforme preferência do utilizador.

## Revisão complementar da PR #10

Correção localizada sobre `4fe64ec`, na mesma branch e PR:

- Indicadores contraditórios (`globalWithdrawal: false` com `scope: global`, ou `true` com `scope: fraction`) não produzem encerramento global nem encerramento implícito da fração. São preservados e sinalizados para revisão. Indicadores desconhecidos também não são aceites como prova de encerramento.
- Preferências administrativas continuam sem reabrir o cliente. A opção Qualificado no editor de estado de um cliente desistente exige confirmação de requalificação; acrescenta um evento administrativo no formato existente, `Preferências recebidas`, com `requalificationConfirmed: true`, data/hora e origem manual. Não é contacto efetivo, não altera preferências nem reaplica snapshots antigos. Não existe conversão automática de dados legados.
- A requalificação confirmada delimita um novo ciclo. Uma desistência posterior pode encerrá-lo novamente. Repetir a gravação não duplica a decisão.
- `relation().presented` considera apenas apresentações do ciclo atual; `historicallyPresented` e o histórico integral conservam as anteriores. Reabrir como Interessado resulta em Qualificado, não em Apresentado. Um estado manual Apresentado antigo também não ultrapassa esta fronteira.
- Reservas/vendas confirmadas, controlos de revisão, cancelamentos e fontes comerciais continuam protegidos.

Testes direcionados em `commercial-cycle-boundaries.test.js`: contradições com/sem frações, combinações coerentes, atualização administrativa vs requalificação confirmada, requalificação retroativa, novo encerramento, Interessado legado/version 1, nova apresentação/proposta, decisão manual antiga, ordem invertida, histórico preservado, imutabilidade e precedência de reservas/vendas. Todos aprovados.

O adapter real de edição de estado foi testado com confirmação/cancelamento/repetição, preservação de preferências editadas manualmente e dos quatro eventos anteriores, preços, estados, fontes e comissões. O teste local de navegador inclui agora cancelar a requalificação em desktop/mobile: cache intacta, zero POSTs comerciais e erros JS.

Regressão: **29 suites aprovadas**, incluindo os testes anteriores de auditoria, motor, relatórios, sincronização e concorrência. Sintaxe aprovada. Sem alteração à API, Apps Script, autenticação, dados, plantas ou bloco de sincronização. Não foram repetidas capturas nem a auditoria visual completa.

Ficheiros desta revisão: `commercial-client-workflow.js`, `commercial.js`, novo `tests/commercial-cycle-boundaries.test.js`, extensões dos dois testes de auditoria e este relatório. A alteração em `commercial.js` limita-se à confirmação/registo da requalificação no editor existente, à idempotência de um encerramento posterior e à verificação de compatibilidade dos módulos.

Os casos legados contraditórios ou sem evidência de confirmação continuam a exigir revisão. O marcador novo é aditivo em eventos novos, preservado pelo JSON existente; nenhuma migração é necessária ou executada. Sem acesso à base real, merge, deployment ou promoção. Atualização da PR existente pendente do Push origin pelo utilizador.
