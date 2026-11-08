# Matriz de estados e proveniência

| Situação sintética | Projeção/efeito | Verificação |
|---|---|---|
| Reserva 9 com origem confirmada, proposta e encerramento 24, proposta 30 | Reservada / Não concretizada / Em negociação; carteira Reservado | `commercial-p7-browser`; consulta sem POST e dados iguais |
| Reserva vigente e desistência noutra fração | Reserva permanece e a desistência não se torna global | `commercial-stage-engine`, `commercial-cycle-boundaries` |
| Venda confirmada, movimento incompatível posterior | Venda e respetiva origem mantidas; contradição requer revisão | `commercial-stage-engine`, `commercial-audit-defects` |
| Aceitação sem reserva / rejeição sem desistência | Em negociação; sem mutação de disponibilidade | `crm-reform-browser`, `commercial-post-audit` |
| Estado manual contraditório ou origem ausente/ambígua | Prevalece operação com prova; sem atribuição automática | `commercial-p7-browser`, `commercial-stage-engine` |
| Reserva de fração indisponível, venda sem validação, cancelamento | Bloqueio de operações inválidas; cancelamento apenas com origem coerente | `crm-reform-safety-browser`, `commercial-stage-engine`, `commercial-integrity` |
| Editar/eliminar origem de estado, preço ou comissão | Bloqueio atómico quando não for seguro; notas sem reaplicar efeito | `commercial-event-provenance`, `commercial-audit-defects` |
| Corrigir a data de uma apresentação atravessando desistência global | **Deveria bloquear.** A fonte aceita e o cliente passa indevidamente a Apresentado | `commercial-p7-cycle-diagnostic.cjs` |

## Bloqueio de cronologia

Fixture: apresentação a 01/10, desistência global explícita a 03/10, correção do
original datada de 04/10. Uma nova apresentação a 04/10 sem correção é bloqueada.
O caminho `corrects` está excluído da validação de ciclo em `build` e em
`project`; a correção substitui o original para projeção, é ordenada depois da
desistência e reabre. O diagnóstico usa a API real com sessão autenticada,
ticket obtido por GET e revisão válida; a fonte fictícia executa `crmWrite`
em VM com o CAS atual. A API devolve HTTP 200 e `persisted: true`. Antes:
Desistiu / Não concretizada / inativa. Depois:
Apresentado / Apresentada / ativa. Original e disponibilidade permanecem iguais;
o problema é a decisão comercial projetada, não uma alteração ao stock.

Proposta separada: verificar que a data corrigida continua no ciclo do registo
original, usando as mesmas fronteiras/ordenação no produtor e no validador da
fonte sob o lock antes de B5. Manter correções no mesmo ciclo, permitir novo ciclo
só com requalificação efetiva e sinalizar contradições já persistidas sem
reescrever o histórico. Testar dias iguais, cadeias de correções e pedidos
concorrentes; confirmar paridade entre o núcleo JavaScript e o núcleo Apps
Script. A publicação coordenada desta validação requer autorização. Não se
introduziu uma restrição apenas visual nem uma alteração de contrato na P7.

## Consumidores

A carteira, o cabeçalho da ficha, o Dashboard, filtros e relatórios de clientes
reutilizam a projeção comercial. Oportunidades detalha a relação por fração;
Frações/Vendas usa a disponibilidade e proveniência registadas. As métricas de
apresentação não determinam disponibilidade, preço, titularidade ou PDF.
