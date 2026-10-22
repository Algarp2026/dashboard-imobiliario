# Validacao de latencia comercial

Relatorio: [COMMERCIAL_LATENCY_REVIEW.md](../../COMMERCIAL_LATENCY_REVIEW.md).

Os resultados sao locais e usam dados exclusivamente ficticios. Nao sao
medicoes Google, nao contem bases de clientes nem credenciais.

- `local-metrics.json`: comparacao com a main `a4a04ab`.
- `node-results.json`: suites Node e invariantes protegidos.
- `browser-results.json`: quatro suites de navegador relevantes.
- `slow-confirmation-results.json`: repeticao do pending com atraso ficticio.

## Catalogo completo antes do merge

Relatorio: [PR18_FULL_REGRESSION.md](../../PR18_FULL_REGRESSION.md).

Os quatro resultados acima pertencem a validacao inicial. Os novos ficheiros
`full-browser-first-run.json`, `full-browser-second-run.json` e
`full-browser-results.json` distinguem as tres passagens integrais;
`full-node-results.json` identifica as 52 suites
Node repetidas. Nenhum resultado inicial reprovado foi reclassificado como aprovado.
