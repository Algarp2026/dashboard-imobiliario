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
| Corrigir a data de uma apresentação atravessando desistência global | Cliente bloqueia, API 422 e fonte recusa antes de B5; um registo já existente fica no histórico, sem reabrir | `commercial-p7-cycle-integrity.test.js` |
| Editar no próprio registo de uma apresentação legada | Com fronteira global/requalificação, bloquear alterações de cronologia e identidade. Notas e preço histórico podem ser corrigidos | `commercial-event-provenance.test.js`, `commercial-p7-cycle-integrity.test.js` |

## P7-11: Causa e regra

Fixture: apresentação a 01/10, desistência global explícita a 03/10, correção do
original datada de 04/10. Uma nova apresentação a 04/10 sem correção é bloqueada.
Em `063684c`, o caminho `corrects` estava excluído da validação de ciclo
em `build` e `project`. O original era substituído na projeção e a correção
era ordenada pela própria data, depois da desistência. A API autenticada, com
ticket e revisão válidos, devolvia HTTP 200 e `persisted: true` através de
`crmWrite` em VM. A oportunidade passava de inativa a ativa, sem mudar o stock.

Agora a cadeia válida de `corrects` é resolvida até ao movimento original.
Na projeção comercial, as versões usam a posição desse movimento, inclusive
quando uma desistência ocorre no mesmo dia. A data efetiva e `recordedAt`
continuam nos registos sem reescrita; uma alteração de data é admitida dentro
do ciclo, mas é bloqueada se o intervalo entre a data original e a nova tocar
uma desistência global ou requalificação. Os extremos são inclusivos porque
uma data sem hora não prova de que lado da fronteira ocorreu o movimento.

O validador rejeita também reordenação de eventos já existentes do mesmo
cliente e dia do movimento original, para que um pedido não contorne a
âncora. Um movimento novo, válido e distinto pode evoluir após requalificação
explícita. O histórico apresenta os originais e as versões; as versões não
contam como comunicação, nova apresentação ou prova de reserva/venda.
A fonte rejeita sob o lock antes de B5. Correções incompatíveis legadas são
sinalizadas e excluídas da projeção, não apagadas ou regravadas. Não é possível
continuar uma cadeia ambígua automaticamente.

O editor legado altera o mesmo evento, sem um `corrects` autónomo. Foi
reproduzida também nessa via a mudança de Desistiu para Apresentado com gravação
aceite. Para um registo realizado que tenha uma fronteira global/requalificação,
o cliente e a fonte conservam a identidade, data/hora, frações e posição
relativa dos eventos já existentes no mesmo dia. Edições de notas e preços
históricos permanecem possíveis sem alterar preços oficiais. Registos legados
já sobrescritos em produção podem não ter proveniência suficiente para
reconstrução automática; devem ser avaliados separadamente, sem migração ou
reescrita nesta fase.

## Consumidores

A carteira, o cabeçalho da ficha, o Dashboard, filtros e relatórios de clientes
reutilizam a projeção comercial. Oportunidades detalha a relação por fração;
Frações/Vendas usa a disponibilidade e proveniência registadas. As métricas de
apresentação não determinam disponibilidade, preço, titularidade ou PDF.
