# P5 - consulta historica ancorada ao B6

Branch local: `codex/p5-historical-commit-proofs`.
Base apos fetch: `f7cf18ae2f7b4427e2f608fd772d74f7251a0f22`.
Estado: implementacao experimental isolada, **nao ativada no CRM**.

## Implementado

- Contratos estritos e versionados; identidade original separada de revisao de conteudo.
- Fonte ficticia persistente com B2 preservado, intencao B5, blocos format=2, backups, manifestos imutaveis format=3 e B6 como unico ponto de ativacao.
- Consulta exclusivamente de leitura, iniciada no B6 atual, com validacao integral da cadeia, pedidos, blocos, hashes, fonte e bases/resultados.
- COMMITTED/PENDING/BLOCKED/NOT_FOUND/UNKNOWN, sem reenvio ou reativacao automaticos.
- Fence independente na fonte, tickets efemeros, CAS remoto e autenticacao/autorizacao ficticias vinculadas a fonte escolhida pelo servidor.
- Adaptador P3/P4: confirma a operacao antiga sem confirmar a cabeca posterior nem eliminar historico.
- Harness do Apps Script atual em VM, falhas por etapa, IndexedDB real nos tres motores, reinicio e benchmarks sinteticos.

Codigo novo em `experimental/persistence-p5/`. Nenhum modulo P1-P4 foi modificado. Testes novos em `tests/commercial-persistence-p5*` e `tests/helpers/persistence-p5-lab.cjs`.

Documentacao: [arquitetura](docs/persistence-p5/ARCHITECTURE.md), [manifestos](docs/persistence-p5/MANIFESTS.md), [consulta](docs/persistence-p5/HISTORICAL_LOOKUP.md), [seguranca](docs/persistence-p5/SECURITY.md), [compatibilidade](docs/persistence-p5/COMPATIBILITY.md), [validacao](docs/persistence-p5/VALIDATION.md), [medicoes](docs/persistence-p5/BENCHMARKS.md), [matriz](docs/persistence-p5/traceability.csv) e [resultados](docs/persistence-p5/results.json).

## Limite da entrega

Nenhuma rota comercial nova, OAuth real, escritor ativo, migracao, limpeza de backups ou alteracao de B5/B6 reais. API, Apps Script, frontend, UX/UI, precos, estados, PDFs e dados operacionais permanecem inalterados. Nao houve push, PR, merge ou deployment. P6 nao foi iniciada.

Uma prova local ou recibo sintetico nunca confirma a fonte Google real. A ativacao futura exige fonte/API autenticadas efetivamente publicadas, capacidades negociadas, fence coordenado e autorizacao separada. Nao existe transacao distribuida entre navegador, API e Google.
