# P7: seguimento comercial e oportunidades

Branch local `codex/p7-commercial-followup`, a partir de
`3e89cb769533d8e8bd75bbf5dc69bdac74f6cc43` (`origin/main`).

**Não apta para merge.** A fonte aceita uma correção histórica que atravessa uma
desistência global e reabre uma oportunidade sem requalificação. A reprodução usa
o construtor e o motor reais com Apps Script em VM; não houve acesso ao Google.
Uma correção só no navegador não garantiria integridade. A proposta para alinhar
cliente, API e fonte está em [Matriz de estados](docs/p7-commercial/STATE_MATRIX.md).

## Correções locais

1. O formulário só inicializa/atualiza `followupV1` quando muda um campo
   efetivamente editável. Repor os valores originais não envia POST. Prioridade
   altera apenas o histórico próprio. Uma data derivada não passa a data manual.
2. O Dashboard e as métricas das frações contam apresentações reais, não
   correções versionadas. Não se eliminam nem reescrevem registos, e uma nova
   apresentação continua a contar.

Código de produto: `commercial-client-followup.js` e `commercial.js`.
O resto são testes, fixtures e documentação. Sem CSS, layout, dados analíticos,
reservas, vendas, comissões, PDFs, plantas, configuração, API ou Apps Script
alterados. Sem migração ou ativação P1–P6. **Um merge poderá colocar as duas
correções operacionais em produção.**

## Evidência

- [Auditoria inicial](docs/p7-commercial/AUDIT.md) e [rastreabilidade](docs/p7-commercial/traceability.csv).
- [Seguimento](docs/p7-commercial/FOLLOWUP.md), [frações](docs/p7-commercial/FRACTION_INDEPENDENCE.md) e [impacto](docs/p7-commercial/SECURITY_IMPACT.md).
- [Validação](docs/p7-commercial/VALIDATION.md) e [resultados](docs/p7-commercial/results.json).

Não houve push, PR, merge, deployment ou Promote. Não avançar para P8.
