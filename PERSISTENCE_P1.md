# The View - P1: contratos e testes

Branch local: `codex/p1-commercial-contracts`.
Origem: `origin/main` em `0eb44f20ebf0404a86e26be507769c285e259109`.

Esta entrega prepara a arquitetura hibrida C, sem ativar novas leituras/escritas, migracao ou IndexedDB no produto.

- [Contratos, estruturas, invariantes, estados e compatibilidade](docs/persistence-p1/CONTRACTS.md)
- [Manifesto versionado usado pelos modelos](docs/persistence-p1/contracts.v1.json)
- [Matriz P1 com teste especifico, resultado e alcance](docs/persistence-p1/traceability.csv)
- [Validacao, comandos, medidas por fase e riscos](docs/persistence-p1/VALIDATION.md)

## Ficheiros adicionados

```text
PERSISTENCE_P1.md
docs/persistence-p1/CONTRACTS.md
docs/persistence-p1/VALIDATION.md
docs/persistence-p1/contracts.v1.json
docs/persistence-p1/traceability.csv
docs/persistence-p1/results.json
tests/commercial-persistence-p1-current.test.js
tests/commercial-persistence-p1-contracts.test.js
tests/commercial-persistence-p1-browser.mjs
tests/helpers/persistence-p1-current.cjs
tests/helpers/persistence-p1-model.cjs
tests/helpers/persistence-p1-lab.js
```

Nao ha alteracoes a ficheiros existentes. Os testes de caracterizacao extraem apenas funcoes relevantes da aplicacao, nao os registos pessoais incorporados noutros trechos do codigo. Fixtures e resultados sao sinteticos. Os modelos de teste nao sao uma biblioteca de persistencia pronta para importar no produto.

## Resultado e limites

70 suites Node, 166 verificacoes de sintaxe e dez suites existentes de navegador aprovadas. Laboratorio em tres motores aprovado nos cenarios especificados, com 15 casos de contrato Node e dois defeitos atuais explicitamente reproduzidos, nao corrigidos.

P2 depende de autorizacao, validadores/migracao shadow, quota fisica/crash e Safari real. Fence de API/fonte, lookup historico e novo escritor nao foram implementados. Nao fazer publicacao coordenada com base apenas nestes modelos.

Trabalho exclusivamente local. Nenhum push, PR, merge, deployment, configuracao de producao, preco, reserva, estado, PDF, planta, backup ou dado comercial real foi alterado.
