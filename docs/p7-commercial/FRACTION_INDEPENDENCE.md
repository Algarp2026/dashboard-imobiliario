# Independência por fração

- Cenário combinado em navegador real: 9 reservada com evento de origem, 24
  encerrada após proposta e 30 em negociação, para o mesmo cliente. A marcação
  manual contraditória Desistiu não supera a reserva. A origem do encerramento
  continua consultável. Abertura, fecho e alternância de ficha não escrevem.
- `commercial-pr6-regression-browser`: preparação [9,24,30], apresentação
  apenas de 24, rascunho ao trocar de separador, seleção [9,30], correção sem
  tocar no original ou na seleção, refresh e reapresentação real. O evento
  original continua único e a correção referencia o original.
- `commercial-client-workflow.test.js`: além do percurso atual, preserva o
  comportamento de preparação/realização e revisão do formato anterior.
- `crm-reform-browser`, `crm-post-audit-browser` e `crm-reform-safety-browser`:
  rondas, decisões, acordo sem reserva, reabertura, cancelamento, venda, agente,
  comissões e validação de disponibilidade. As suites de proveniência testam
  alterações administrativas e eliminação protegida.
- Contagem corrigida no Dashboard: seis apresentações da fixture, original
  da Apt. 7 e reapresentação real = 8. Antes, a correção da Apt. 7 também
  incrementava o contador (9). O teste Node `commercial-construction` mede
  também a contagem específica da fração e confirma histórico byte a byte.

As correções de preço dentro do mesmo ciclo não consomem preparação nem
representam novo contacto. O caso de correção que atravessa desistência global
continua bloqueador; ver [matriz de estados](STATE_MATRIX.md).
