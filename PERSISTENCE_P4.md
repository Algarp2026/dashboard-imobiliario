# P4 - Conteudo, compressao e retencao experimental

Branch local: `codex/p4-content-storage-retention`.
Origem apos fetch: `b2411d7026ee53dab98e581c3fbf547b90be3e19`, com P1, P2, P3 e hotfix #29.

## Implementacao

- `experimental/persistence-p4/codecs.mjs`: identidade logica separada de identity/gzip, verificacao reversivel, limites e metricas.
- `experimental/persistence-p4/references.mjs`: inventario por referencias reais, validacao de bases/pedidos/arquivos e classificacao de protecao.
- `experimental/persistence-p4/store.mjs`: deduplicacao, copy-on-write duravel, dry-run e libertacao transacional restrita ao laboratorio.
- `experimental/persistence-p3/store.mjs`: unico ficheiro anterior adaptado, com codec/stores opcionais explicitamente fornecidos. Sem opcoes novas, schema 1 e comportamento P3 anteriores.
- `tests/commercial-persistence-p4.test.js` e `tests/commercial-persistence-p4-browser.mjs`: verificacoes e benchmarks exclusivamente ficticios.

Documentacao: [arquitetura](docs/persistence-p4/ARCHITECTURE.md), [codecs](docs/persistence-p4/CODECS.md), [referencias](docs/persistence-p4/REFERENCES.md), [retencao](docs/persistence-p4/RETENTION.md), [medicoes](docs/persistence-p4/BENCHMARKS.md), [validacao](docs/persistence-p4/VALIDATION.md), [matriz](docs/persistence-p4/traceability.csv) e [resultados](docs/persistence-p4/results.json).

## Limites

Nenhum import/inicializacao P4 no runtime comercial. Nao ha alteracao de `commercial.js`, API, Apps Script, config, HTML/CSS, precos, estados, dados, PDFs, plantas ou reservas do hotfix. Nenhuma migracao/limpeza de dados reais, push, PR, merge ou deployment.

A retencao nao apaga operacoes ou historicos comerciais. Apenas corpos scratch de proveniencia conhecida, sem qualquer referencia e sem bloqueios, podem ser libertados. Recibos sinteticos, checksums, idade e exportacoes nao constituem prova comercial nem permissao de apagamento. Arquivos desconhecidos continuam a bloquear limpeza.

Ganhos de compressao sao medidos em bytes codificados e metadados serializados, nao em espaco garantido no disco real. A quota nativa e Safari/iOS permanecem gates separados. A ativacao continua a depender de migracao autorizada, leitores compativeis, provas autenticadas e fence coordenado; P5 nao foi iniciada.
