# P2 - Leitor seguro e migracao shadow

Branch local: `codex/p2-shadow-local-reader`.
Base confirmada depois de `git fetch origin main`: `eb85a7d85b11ad1ab53c43ec05066da226b6d73a` (inclui PR #29).

## Alcance

Implementacao preparatoria em `experimental/persistence-p2/`. Nao existe importacao, inicializacao ou migracao no runtime comercial. Nenhum escritor, autoridade local, protocolo remoto ou mecanismo de limpeza foi substituido.

- `codec.mjs`: hash comercial compativel com `serializedStore`, bytes UTF-16LE exatos para textos e representacao versionada de valores structured-clone.
- `reader.mjs`: leitura readonly das origens explicitamente fornecidas; classificacao, relacoes, formatos gzip/legacy e vinculacao local de comprovativos.
- `shadow.mjs`: destino exclusivamente de laboratorio, corpos imutaveis, referencias verificaveis, lotes limitados e checkpoints transacionais retomaveis.
- Testes novos: `tests/commercial-persistence-p2-reader.test.js`, `tests/commercial-persistence-p2-browser.mjs` e fixture exclusivamente sintetica.

Os ficheiros existentes, incluindo `commercial.js`, HTML, dados, API, Apps Script, configuracao e testes anteriores, permanecem inalterados. As duas reservas da PR #29 nao sao modificadas.

## Documentacao

- [Estrutura fisica e contratos](docs/persistence-p2/SCHEMA.md)
- [Inventario e compatibilidade](docs/persistence-p2/FORMATS.md)
- [Migracao, recuperacao e limites](docs/persistence-p2/MIGRATION.md)
- [Validacao e reproducao](docs/persistence-p2/VALIDATION.md)
- [Rastreabilidade especifica](docs/persistence-p2/traceability.csv)

`READY` significa apenas que o conjunto observado pode ser reconstruido no destino shadow. Nao significa que uma operacao foi confirmada pelo Google, que conflitos comerciais foram resolvidos ou que o destino pode ser ativado.

## Bloqueios para P3

Ainda sao necessarios: identidade de instancia verificavel, workspace operacional com CAS local, fotografia coerente entre cache/base/pedido, politica de escritor e fencing remoto coordenado, provas autenticadas de commit, tratamento de divergencias e migracao autorizada. A P2 nao corrige os defeitos atuais de concorrencia local e exportacao incoerente caracterizados na P1.

Safari real/iOS, falha de energia e esgotamento fisico de disco nao foram demonstrados. Os resultados de quota injetada nao devem ser apresentados como quota nativa. Ver o relatorio de validacao para a distincao completa.

Nenhum push, PR, merge, deployment, acesso a dados reais ou alteracao de backups do utilizador faz parte desta entrega.
