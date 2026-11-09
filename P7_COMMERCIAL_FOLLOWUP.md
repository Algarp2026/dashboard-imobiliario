# P7: seguimento comercial e oportunidades

Branch local `codex/p7-commercial-followup`, a partir de
`3e89cb769533d8e8bd75bbf5dc69bdac74f6cc43` (`origin/main`).

**P7-11 corrigido localmente.** A revisão técnica do código é independente da
publicação. Não fazer merge que desencadeie publicação automática, nem autorizar
escrita sem cumprir o [plano coordenado](docs/p7-commercial/COORDINATED_RELEASE.md).

## Correções locais

1. O formulário só inicializa/atualiza `followupV1` quando muda um campo
   efetivamente editável. Repor os valores originais não envia POST. Prioridade
   altera apenas o histórico próprio. Uma data derivada não passa a data manual.
2. O Dashboard e as métricas das frações contam apresentações reais, não
   correções versionadas. Não se eliminam nem reescrevem registos, e uma nova
   apresentação continua a contar.
3. As correções versionadas atualizam detalhes na posição do movimento original.
   Uma mudança de data que atravesse uma desistência global ou requalificação
   é rejeitada pelo cliente e pela fonte. Registos versionados incompatíveis
   já gravados continuam auditáveis, sem efeito na projeção nem no último contacto.
   A edição legada no próprio registo também protege a cronologia, mas mantém
   as correções de valores e notas que não alteram a identidade do movimento.

Além de `commercial-client-followup.js` e `commercial.js`, já concluídos no
commit `063684c`, a correção mexe em `commercial-opportunities.js`,
`commercial-client-workflow.js`, `server/commercial-integrity.js` e nos dois
bundles gerados. `commercial.js` chama ainda a mesma política no editor
legado, antes da mutação local. A rota da API, `google_apps_script.gs`, CAS, read tickets,
B5/B6, dados, D2, preços, vendas e reservas não foram alterados. Sem migração
ou ativação P1–P6. **O bundle novo do Apps Script requer publicação coordenada.**

## Evidência

- [Auditoria inicial](docs/p7-commercial/AUDIT.md) e [rastreabilidade](docs/p7-commercial/traceability.csv).
- [Seguimento](docs/p7-commercial/FOLLOWUP.md), [frações](docs/p7-commercial/FRACTION_INDEPENDENCE.md) e [impacto](docs/p7-commercial/SECURITY_IMPACT.md).
- [Validação](docs/p7-commercial/VALIDATION.md) e [resultados](docs/p7-commercial/results.json).

Não houve push, PR, merge, deployment ou Promote. Não avançar para P8.
