# PR25 - Fiabilidade local e consultas

## Decisao e ambito

Complemento seletivo a `49d5ba839e78b36b5adc4bb883edfc46ec27f105`, na mesma branch `codex/fix-local-recovery-archive`. O sistema de deteccao/notificacao/actualizacao obrigatoria de publicacoes foi integralmente retirado, sem substituto. Nao foi feito reset da branch nem retirada qualquer correcao de backups, filtros ou rascunhos.

## Remocao e configuracao

- Eliminados o monitor JS/CSS, build de identidades, documentos e capturas especificos, testes exclusivos e respectivos helpers. [Inventario completo dos ficheiros](docs/local-reliability/changes.json).
- `commercial.js`: retirados adaptador, snapshot exclusivo, verificacao de origem, excepcoes de refresh, codigo de erro de versao e todos os bloqueios de GET/POST por versao. O aviso `beforeunload` continua a proteger alteracoes comerciais reais e falhas de armazenamento.
- `vercel.json` volta integralmente ao conteudo anterior ao monitor (`869397c`): sem build/output/headers especiais. Todas as branches bloqueadas, redirects e definicoes API mantem-se, incluindo `codex/fix-local-recovery-archive: false`.
- Nenhum identificador de publicacao, polling de versoes, canal entre separadores, modal/banner, exportacao de actualizacao ou redireccionamento fica no runtime. Nomes antigos so existem em assertions negativas dos testes e neste inventario de remocao, para impedir regressao.

## Melhorias mantidas

Os filtros, pesquisas, ordenacao, foco em formularios intactos e consultas nao marcam alteracoes por guardar nem criam pedidos. Alteracoes comerciais e preferencias em chips continuam protegidas. `modifiedFractionSelection()` normaliza IDs/ordem: adicionar e retirar protege; reverter, cancelar e guardar confirmado deixa de proteger um rascunho inexistente ou inalterado. O rotulo "por guardar" usa o mesmo criterio.

A actualizacao remota continua activa durante consultas e preserva selecoes/aprovacoes perante uma alteracao concorrente do mesmo cliente. O BroadcastChannel de revisoes **comerciais** permanece: nao e um monitor de versoes do website.

O arquivo auditado e preservado integralmente: retencao, capacidade, classificacao de falhas, pedidos originais, checkpoints, formatos legacy/desconhecidos, verificacao e exportacao. O helper de integridade permite apenas tres trechos revistos de consultas/rascunhos; todo o restante `commercial.js`, incluindo transporte, leitura, escrita, arquivo e CAS, tem de coincidir exactamente com `869397c`. Os hashes do arquivo anterior permanecem iguais.

## Testes

Os testes de filtros foram extraidos para `commercial-consultation-browser.mjs`. As verificacoes de selecao foram separadas em `commercial-fraction-draft-browser.mjs`, sem dependencias do monitor retirado. Nenhuma verificacao comercial ou de seguranca foi removida. O teste Node exclusivo de versoes foi substituido por verificacoes da ausencia do mecanismo e da configuracao restaurada.

Comandos: `node tests/commercial-client-complete-regression.cjs` e `node tests/commercial-browser-regression.cjs`. Servidores apenas em loopback, portas 53397/53398, fixtures exclusivamente ficticias e chamadas Google simuladas em memoria. Artefactos temporarios fora do repositorio.

Resultados finais: [validacao](docs/local-reliability/validation-results.json), [consultas](docs/local-reliability/consultation-results.json) e [rascunhos](docs/local-reliability/fraction-draft-results.json). Os resultados historicos do arquivo continuam identificados como historicos em `LOCAL_RECOVERY_ARCHIVE.md`.

**65/65 suites Node, 31/31 suites de navegador e 147/147 verificacoes de sintaxe aprovadas. Zero falhas.** O catalogo completo passou nesta versao integrada; consultas e rascunhos foram adicionalmente repetidos com as assertions finais de zero POST em consultas e proteccao real de saida. Dados de teste exclusivamente ficticios.

Inventario complementar relativamente a `49d5ba8`: **29 ficheiros eliminados, 10 modificados e 10 adicionados** (testes funcionais separados e evidencia actual). O arquivo, protocolo e dados nao foram reimplementados. O SHA-256 do `commercial.js` validado e `0a7c1f12150d8492f552ba0ccd4e74f7edab8e5ab7ad3eca3ec55123e22fe8f0`.

## Riscos e limites

Nao existe aviso de nova publicacao nem actualizacao obrigatoria. O codigo ja carregado num separador permanece ate a navegacao/refresh normal do utilizador; nao se introduziu outra forma de o substituir.

As limitacoes de quota, permissoes, dispositivo e gestao de copias ambiguas do arquivo continuam a aplicar-se. Nenhum backup real foi apagado, exportado, migrado ou recuperado neste trabalho. Os testes Chrome nao substituem validacao especifica em Safari/iOS.

Sem acesso a dados reais, alteracoes de precos/estados/clientes, API, Apps Script, autenticacao, modelos comerciais, design, main, merge ou deployment. Manter a PR25 em Draft para revisao.
