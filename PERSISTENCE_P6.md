# P6 - espelhos e recuperacao independente, laboratorio

Branch local: `codex/p6-mirror-recovery-copy`.
Base apos fetch: `145736d9ee77b9abdd614e991be01f69d5d10e27`.
Estado: **experimental e desativado no CRM**.

Implementados separadamente:

1. Fotografia oficial coerente, distinguindo B6 operacional format=2, P5 format=3 e historico legado sem ancora.
2. Diagnostico dos seis espelhos usando as funcoes reais do Apps Script num harness VM.
3. Plano sem escrita e reparacao explicita sob o mesmo lock/CAS da fonte ficticia, sem modificar autoridade, pedidos ou backups.
4. Copia imutavel verificavel num backend separado, com corpos P4 deduplicados/comprimidos, staging duravel e reabertura.
5. Analise administrativa de recuperacao, **sem metodo de restauracao ou escrita comercial**.

Codigo: `experimental/persistence-p6/` (contracts, snapshot, mirrors, copy, recovery e projector-node). Testes: `tests/commercial-persistence-p6.test.js`, `tests/commercial-persistence-p6-browser.mjs`, `tests/commercial-persistence-p6-benchmarks.mjs` e `tests/helpers/persistence-p6-lab.cjs`.

Documentacao: [arquitetura](docs/persistence-p6/ARCHITECTURE.md), [projecoes](docs/persistence-p6/MIRROR_CONTRACTS.md), [consistencia](docs/persistence-p6/CONSISTENCY.md), [reparacao](docs/persistence-p6/REPAIR.md), [copia](docs/persistence-p6/INDEPENDENT_COPY.md), [gates](docs/persistence-p6/RECOVERY_GATES.md), [validacao](docs/persistence-p6/VALIDATION.md), [medicoes](docs/persistence-p6/BENCHMARKS.md), [matriz](docs/persistence-p6/traceability.csv) e [resultados](docs/persistence-p6/results.json).

Nenhum ficheiro existente foi alterado. Sem Google real, acesso a backups do utilizador, push, PR, merge, deployment, mudanca de credenciais ou endpoints. P1-P5, hotfix #29, CRM, API, Apps Script, dados, precos, estados, PDFs, plantas e UX/UI permanecem inalterados.

A independencia testada e entre backends/DBs/diretorios ficticios separados, **nao** entre dispositivos, contas ou servicos reais. Uma copia recuperavel nao prova atualidade, nao confirma uma operacao e nunca se torna automaticamente autoridade. P7 nao foi iniciada.
