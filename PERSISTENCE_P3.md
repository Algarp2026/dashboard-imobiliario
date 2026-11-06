# P3 - Persistencia transacional experimental

Branch: `codex/p3-transactional-local-store`.
Origem confirmada por fetch: `9f37202d04fb06c3821010e391423a9a2b55646d`, main com P1, hotfix #29 e P2.

## Entrega

Nucleo efetivo de IndexedDB, isolado do produto: workspace, identidade local de instancia, propostas duraveis, CAS, branches, pedidos imutaveis, estados por operacao, exportacao coerente e recuperacao. Reutiliza os codecs/validadores P2 sem os modificar. O simulador nao e uma API Google nem prova de ativacao B6.

Ficheiros adicionados:

```text
experimental/persistence-p3/contracts.mjs
experimental/persistence-p3/store.mjs
experimental/persistence-p3/simulator.mjs
tests/commercial-persistence-p3.test.js
tests/commercial-persistence-p3-browser.mjs
PERSISTENCE_P3.md
docs/persistence-p3/CONTRACTS.md
docs/persistence-p3/SCHEMA.md
docs/persistence-p3/CONCURRENCY.md
docs/persistence-p3/EXPORT.md
docs/persistence-p3/ACTIVATION_GATES.md
docs/persistence-p3/VALIDATION.md
docs/persistence-p3/traceability.csv
docs/persistence-p3/results.json
```

Nao ha alteracao de ficheiros existentes, nem inicializacao, imports comerciais, migracao, limpeza ou novo escritor ativo no website. `commercial.js`, `app.js`, HTML/CSS, API, Apps Script, dados, precos, estados, PDFs, plantas e arquivos reais permanecem intactos.

## Leitura do relatorio

- [Contratos e correspondencia P1](docs/persistence-p3/CONTRACTS.md)
- [Schema fisico e identidade](docs/persistence-p3/SCHEMA.md)
- [CAS, durabilidade e branches](docs/persistence-p3/CONCURRENCY.md)
- [Exportacao transacional](docs/persistence-p3/EXPORT.md)
- [Corte futuro e rollback](docs/persistence-p3/ACTIVATION_GATES.md)
- [Resultados, comandos e limitacoes](docs/persistence-p3/VALIDATION.md)
- [Matriz especifica](docs/persistence-p3/traceability.csv)

O destino usa origem loopback sintetica e perfis descartaveis. Nao reutiliza nem altera o schema operacional ou o destino shadow da P2. Isso e isolamento de laboratorio, nao decisao de migracao/ativacao real.

A aptidao para revisao local nao constitui seguranca de producao: fence remoto real, provas autenticadas ancoradas na fonte, gestao de identidades reais, quota nativa, Safari/iOS e corte operacional continuam gates separados.
