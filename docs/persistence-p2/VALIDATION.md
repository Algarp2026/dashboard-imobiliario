# Validacao P2 - 6 novembro 2026

## Ambiente

Node 24.22.1, Windows, Chrome 157.0.8103.39, Firefox Playwright 153.0 e WebKit Playwright 26.5. Perfis temporarios, duas origens loopback 53xxx e dados integralmente ficticios. Desktop 1440x1000 e viewport mobile 390x844; nao sao dispositivos fisicos.

A fixture desktop contem 15 copias historicas protegidas de aproximadamente 14,84 MiB, ambas reservas da PR #29, um arquivo gzip e cache/base/pedido/marcador. O mobile usa fixture reduzida para a matriz de compatibilidade; o hotfix existente e testado separadamente com 14,84 MiB em desktop e mobile.

## Testes novos

`node tests/commercial-persistence-p2-reader.test.js`: 14 casos. Hash compativel com servidor, UTF-16 bruto, grafos estruturados, File/Blob, rejeicao de propriedades nao preservaveis, checksum, gzip, pedidos incertos, prova de outra operacao, metadados desconhecidos, bases incompativeis, referencias invalidas e dimensao efetiva da fixture de capacidade.

`node tests/commercial-persistence-p2-browser.mjs`: matriz de seis combinacoes. Cada uma verifica aborto/quota injetados, retomada, repeticao idempotente, reconstrucao exata, nenhuma escrita/versionchange na origem, isolamento do escritor antigo, referencia removida mesmo com READY, reabertura em todas as fases e preservacao de variantes antes/depois de lotes.

IDs estaveis: P2-TX-01, P2-MIG-01/02/03, P2-MIX-01, P2-REF-03 e P2-CHECKPOINT-01. O teste interrompe a transacao antes do checkpoint e verifica que a fotografia anterior permanece igual. O encerramento/reabertura apos commit verifica o lado posterior. O CAS local do checkpoint continua independente do CAS comercial remoto.

## Resultados e limites dos ensaios destrutivos

- **Implementado e testado:** aborto de transacao e QuotaExceededError injetados no store migration, depois de insercoes de corpos, sem checkpoint parcial.
- **Implementado e testado no Chromium desktop:** terminacao forcada apenas dos processos Chrome pertencentes ao perfil temporario do teste, seguida de reabertura do mesmo perfil e verificacao dos originais/referencias. Nao e simulacao de falha de energia.
- **Investigado, nao demonstrado:** override de quota Chromium com alocacao limitada a 100 blocos aleatorios de 128 KiB nao provocou QuotaExceededError nativo. Nao se continuou a encher o disco. A seguranca sob quota fisica esgotada permanece pendente, distinta da prova de aborto injetado.
- **Pendente:** crash abrupto Firefox/WebKit, quota nativa nesses motores, Safari real/iOS, modo privado e eviccao/power loss. WebKit Playwright nao equivale a Safari/iOS.

O primeiro ensaio via Browser.crash nao terminou de forma fiavel e nao foi contabilizado como sucesso; foi substituido pelo encerramento de processos do perfil descartavel. Um frame de outra origem encontrou particionamento de armazenamento no WebKit; a ponte do teste passou a ler duas paginas top-level atraves do controlador de testes, sem ligar esta ponte ao produto. Um aborto injetado revelou excecao nao tratada num callback de checkpoint P2; foi corrigida sem alterar o CRM.

## Regressao existente, sem modificar expectativas

- Todas as 72 suites `tests/*.test.js`, incluindo a suite P2: aprovadas.
- 179 verificacoes de sintaxe JS/CJS/MJS e compilacao sintatica GS: aprovadas.
- Dez suites existentes de navegador: storage-reliability, storage-growth, recovery-archive, loading-persistence, safe-reconciliation, auto-sync, presentation-pdf, pending-local, fraction-draft e profile-followup: aprovadas.
- `commercial-active-write-browser.mjs`: desktop e mobile aprovados, incluindo historico cheio, rotacao vinculada a prova, resposta perdida, recuperacao idempotente, quota injetada, exportacao apos falha e preservacao de reservas/precos/eventos/clientes nao envolvidos.

Nenhum teste existente, timeout, API, Apps Script, dado analitico ou ficheiro comercial foi alterado. Os resultados completos, nomes individuais e logs ficam nos artefactos locais `p2-validation`, fora do repositorio. Nenhum conteudo integral das fixtures grandes e incluido no relatorio.

## Reproducao

Usar o Node instalado e configurar `PLAYWRIGHT_MODULE`, `CHROME_EXECUTABLE` e `PLAYWRIGHT_BROWSERS_PATH` para os motores locais. `P2_ARTIFACTS` determina o diretorio externo dos resultados; `P2_SOURCE_PORT` e `P2_DEST_PORT` permitem portas livres diferentes, sempre no intervalo 53000-53999. Nao apontar a URLs comerciais.

```text
node tests/commercial-persistence-p2-reader.test.js
node tests/commercial-persistence-p2-browser.mjs
node tests/commercial-browser-regression.cjs commercial-storage-reliability-browser.mjs commercial-storage-growth-browser.mjs commercial-recovery-archive-browser.mjs commercial-loading-persistence-browser.mjs commercial-safe-reconciliation-browser.mjs commercial-auto-sync-browser.mjs commercial-presentation-pdf-browser.mjs commercial-pending-local-browser.mjs commercial-fraction-draft-browser.mjs commercial-profile-followup-browser.mjs
```

O teste do hotfix utiliza `tests/helpers/active-write-preview.cjs`, uma fonte ficticia em memoria, com `PHASE2A_TEST_PORT` e `COMMERCIAL_TEST_ORIGIN` na mesma porta isolada. Todos os servidores iniciados para validacao sao terminados apos os testes.

## Conclusao limitada

P2 prepara leitura rigorosa e copia shadow verificavel; nao aprova ativacao em producao. Nenhuma evidencia local autoriza eliminar protegidos ou declarar uma operacao remotamente confirmada. Os bloqueios para P3 estao em PERSISTENCE_P2.md e MIGRATION.md.
