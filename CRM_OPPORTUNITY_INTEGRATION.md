# Integracao do CRM pos-auditoria na main atual

## Base e referencia

- Base obrigatoria: `9ba65b56f01a22fa04c8d89f95811510c3ae3e3d`.
- Branch nova: `codex/integrate-audited-opportunity-crm`.
- ZIP: `the-view-crm-opportunity-workflow-pos-auditoria-20261019-163504.zip`.
- SHA-256 do ZIP: `d299212dfcb0606726aa55a22cf1733b0dfa15c286aeb9053caa6769d73b5e6b`.
- Lido `CRM_OPPORTUNITY_WORKFLOW.md`, incluindo as correcoes pos-auditoria.
- O ZIP nao foi usado como checkout/base. Foi extraido fora do repositorio para
  comparacao de tres vias contra `fa876dc`, mantendo a main atual como autoridade.
- A pasta original com trabalho nao submetido nao foi modificada ou descartada.

## Comparacao e funcionalidades

Os seguintes oito ficheiros coincidem integralmente com o ZIP, normalizando
apenas finais de linha: commercial-opportunities.js, commercial-opportunity-ui.js,
commercial-client-workflow.js, commercial-client-workflow-ui.js,
commercial-client-workspace.css, commercial.html, view-workspace.js e
server/commercial-integrity.js. Nao foi criado outro modelo visual ou de produto.

Em commercial.js foram integrados apenas os hunks comerciais/visuais do ZIP.
O bloco integral de sincronizacao da main, desde readSyncMeta ate appDialog,
permanece identico, incluindo IndexedDB, backups limitados, checkpoints, pedido
original, falso rollback, reconciliacao e confirmacao de cache. Guardas de fonte
tambem congelam save, importacao Majuca, reset, PDFs e efeitos de fecho.

Integrado:

- Dados, Procura e Oportunidades; uma relacao por cliente/fracao e sete estados.
- Apresentacao individual/multipla/parcial, precos por fracao e historico.
- Rondas sem limite arbitrario, versoes efetivas, snapshots de decisoes e acordos.
- Recusas, reaberturas, ciclos, requalificacao confirmada e desistencias parciais/globais.
- Reservas, vendas, cancelamentos, comissoes e titularidade comprovada.
- Correcoes por novos eventos, sem reescrita dos registos confirmados versionados.
- Carteira, agentes, dashboard, relatorios e historico usam a mesma projecao.
- Cabecalho compacto, revisao expansivel, contagens relevantes, expansao exclusiva,
  historico recolhivel, formularios inline, rascunhos em memoria, foco e scroll.

As correcoes A/B/C/D permanecem no modelo auditado: efeitos adulterados mesmo
sem alterar o estado; decisoes sobre propostas ultrapassadas; novos ciclos apos
requalificacao; e fecho sem negociacao valida. Nao ha migracao automatica ou
inferencia de estados para dados historicos incompletos.

## Integridade sob CAS, sem leitura adicional

Nao foi copiada a API antiga do ZIP. A API da PR16 foi alterada apenas para
exigir `commercialIntegrity:1` no preflight ja existente. OAuth continua partilhado
por operacao e nao foi acrescentado qualquer crmRead completo antes do POST.

O mesmo validador puro e os mesmos modelos Node/browser sao empacotados por
`scripts/build-commercial-integrity.js` em `google_commercial_integrity.gs`.
O bundle e gerado, nao mantido como uma segunda implementacao manual; a suite
confere o conteudo exato e o SHA dos fontes partilhados.

Em crmWrite: autenticacao -> lock -> leitura autoritativa -> recibo/idempotencia
-> verificacao de B5 e CAS -> validacao comercial -> primeira mutacao B5 ->
backups/blocos -> espelhos seletivos -> confirmacao B6 -> limpeza B5.

O validador recebe o JSON da revisao efetivamente verificada sob o MESMO lock.
Outro utilizador nao pode substituir esse baseline por um writer cooperativo
entre validacao e mutacao. Uma revisao antiga recebe 409 antes da validacao;
uma transicao adulterada recebe 422 antes de qualquer mutacao duravel. O teste
verifica tanto o snapshot completo de celulas como a ausencia de writes/rows/append.

Repeticoes do mesmo requestId/baseRevision/hash ja confirmados seguem o recibo
existente sem reinterpretar o historico. Recuperacoes ainda nao confirmadas
validam o mesmo baseline e o mesmo conteudo sob o lock. Nenhum ID ou B5 e apagado
como forma de contornar erro.

Sem o bundle, a fonte anuncia capacidade 0 e o writer falha fechado. A API nova
recusa escrever em Apps Script anterior sem essa capacidade, mas a leitura
continua disponivel. A compatibilidade de escrita nova API/Script antigo deixa
intencionalmente de ser aceite: aceitar seria contornar a nova integridade.
API antiga com o Script novo continua coberta em testes; a guarda esta na fonte.

Nao mudaram armazenamento/manifestos/limites, chave local, read tickets, revisao,
B5/B6, recibos, backups, flush, atualizacao seletiva ou diagnostico de correlacao.
Middleware apenas acrescenta protecao aos tres caminhos novos, mantendo o resto
do mecanismo de autenticacao intacto. O deployment Git desta branch esta desativado.

## Testes e medidas

Executado novamente sobre a integracao, com dados exclusivamente ficticios:

- `node tests/commercial-client-complete-regression.cjs`: 50 suites Node aprovadas,
  incluindo todas as 43 da main e as sete suites de oportunidade/integracao.
- Suite pos-auditoria: 23 casos aprovados; API: 15 ataques recusados com 422 sem
  alteracao de armazenamento. Inclui correcoes legitimas, comissoes, cancelamento,
  concorrencia 409 e proposta corrigida.
- Fonte: 10 cenarios adicionais, kernel partilhado, lock antes de B5, revisao antiga,
  bundle ausente, recuperacao idempotente e historico com 102 rondas e >150k.
- Seis suites browser dirigidas aprovadas: os quatro percursos do ZIP, quota real
  localStorage/IndexedDB e pedidos locais pendentes. Chrome em desktop, portatil,
  tablet e mobile; servidor loopback dedicado, sessao autenticada e Google simulado.
- Relatorios: quatro pre-visualizacoes reais de impressao, sem escrita. Nao confundir
  com validacao de impressora fisica ou de novos binarios PDF.
- 119 ficheiros JavaScript/TypeScript verificados e dois ficheiros Apps Script
  analisados no fecho da entrega. `git diff --check` limpo.

O catalogo completo de browser da main tambem foi executado, nao presumido
aprovado. Ver `docs/crm-opportunity-integration/browser-results.json` e a secao
de limitacoes abaixo para os resultados efetivos; a regressao global nao esta
declarada aprovada apenas porque os percursos novos passaram.

Resultado integral: **8/27 suites browser aprovadas, 19/27 falharam**. As oito
aprovadas sao as seis dirigidas acima, commercial-followup-layout-browser.mjs e
composition-d2-history-routing-probe.mjs. As falhas abaixo interrompem os scripts
no primeiro contrato historico incompativel; nao comprovam os passos posteriores
nem autorizam declarar esses percursos aprovados.

| Suite browser que falhou | Primeiro impedimento observado |
| --- | --- |
| commercial-audit-defects-browser.mjs | Procura o separador antigo Negociacao |
| commercial-stage-browser.mjs | Procura .ux-contact-controls |
| commercial-client-phase2a-browser.mjs | Procura o separador antigo Preferencias |
| commercial-client-phase2b-browser.mjs | Procura o separador antigo Fracoes |
| commercial-client-complete-browser.mjs | Exige evento inicial automatico (1 em vez de 0) |
| commercial-client-complete-exports.mjs | Procura o separador antigo Apresentacao |
| commercial-contacts-browser.mjs | Exige evento inicial automatico (1 em vez de 0) |
| commercial-pr6-regression-browser.mjs | Procura o separador antigo Apresentacao |
| commercial-profile-routing-browser.mjs | Procura o separador antigo Preferencias |
| commercial-home-entry-browser.mjs | Procura #clientContactSettings |
| commercial-client-report-grouping-browser.mjs | Apos resolver NODE_PATH/pdf-lib, procura .ux-contact-pending |
| client-workspace-audit.mjs | Procura o separador antigo Apresentacao |
| client-workspace-browser.mjs | Exige opcao de ordenacao antiga em #clientListSort |
| client-workspace-dialogs.mjs | Procura o separador antigo Apresentacao |
| composition-d2-browser.mjs | Exige controlo de contacto antigo (1 em vez de 0) |
| composition-d2-platform-browser.mjs | Procura o separador antigo Preferencias |
| visual-audit-browser.mjs | Procura o separador antigo Negociacao |
| visual-workspace-browser.mjs | Exige controlo de contacto antigo (1 em vez de 0) |
| visual-workspace-transactions.mjs | Procura o separador antigo Apresentacao |

O teste de agrupamento foi repetido isoladamente com a dependencia instalada:
a falha de ambiente inicial foi eliminada, mas o contrato visual antigo continua
incompativel. Os 19 scripts foram preservados. E necessario adapta-los aos
percursos aprovados, mantendo as suas verificacoes funcionais, antes de aprovar
a regressao completa. Nao foi implementado um fallback para a interface retirada.

Medicao LOCAL, nao Google: cinco amostras de escrita com 102 rondas e >150k,
main publicada versus integracao: medianas 13,28/16,32 ms numa execucao.
Os tempos sao ruidosos de emulacao/CPU e nao representam latencia ou SLA Google.
As operacoes da Sheet permaneceram iguais: open=1, read=10, write=4, rows=3,
append=1, lock=1 e unlock=1. A validacao nao acrescenta chamadas Google.
O benchmark PR16 conserva uma renovacao OAuth, duas Execution API, zero leitura
completa de preflight, um open, quatro leituras de blocos e sete flush por POST
representativo. Nenhum ensaio Google real foi efetuado.

## Alteracoes por responsabilidade

| Grupo | Ficheiros e motivo |
| --- | --- |
| Dominio auditado | commercial-opportunities.js, commercial-client-workflow.js, server/commercial-integrity.js |
| Interface aprovada | commercial-opportunity-ui.js, commercial-client-workflow-ui.js, commercial.js, commercial.html, commercial-client-workspace.css, view-workspace.js |
| Validacao protegida | google_apps_script.gs, google_commercial_integrity.gs, scripts/build-commercial-integrity.js, server/commercial-store.js, api/commercial-data.js |
| Protecao de acesso/publicacao | middleware.ts apenas novos caminhos; vercel.json apenas esta branch |
| Testes | suites ZIP, kernel sob lock, guardas de fonte, fixture com kernel, harness browser e adaptacoes explicitas dos contratos de tres separadores |
| Evidencias | este documento e galeria com capturas novas, exclusivamente ficticias |

Nao alterados: config.js, data.json, data.xlsx, plantas, credenciais, IDs Google,
login/sessao, calculos de precos, comparador e fonte comercial real.

## Compatibilidade e bloqueios antes de publicar

1. A revisao deve incluir AMBOS os ficheiros .gs no mesmo projeto/versao. Publicar
   apenas google_apps_script.gs sem o bundle bloqueia escrita deliberadamente.
   Nenhum desses ficheiros foi publicado por esta tarefa.
2. Confirmar V8/Execution API, permissoes e kernel numa Sheet de testes real antes
   de producao. Os ensaios locais nao comprovam quotas/latencias Google.
3. Dados antigos incompletos ficam preservados/sinalizados. O validador recusa
   regularizacoes implicitas ou adulteracoes de fecho; nao e uma ferramenta de migracao.
4. Rascunhos nunca submetidos sao mantidos em memoria, conforme o ZIP, nao se
   promete recuperar esses campos apos fechar o browser. Dados ja aplicados
   localmente usam integralmente a recuperacao/IndexedDB da PR15.
5. Alguns testes browser historicos procuram cinco separadores, contactos e
   controlos retirados pela especificacao aprovada. Nao foram apagados ou
   anunciados como aprovados. A sua adaptacao sem perda de cobertura continua
   necessaria antes de declarar toda a regressao browser aprovada.
6. Nao ha autorizacao de merge, deploy, migracao, recuperacao real ou publicacao
   Apps Script. A entrega destina-se a Draft PR e auditoria; nao a producao.

Galeria: [capturas novas](docs/crm-opportunity-integration/README.md).

## Reproduzir sem producao

    node scripts/build-commercial-integrity.js --check
    node tests/commercial-client-complete-regression.cjs
    node tests/commercial-browser-regression.cjs crm-reform-browser.mjs crm-reform-safety-browser.mjs crm-reform-report-browser.mjs crm-post-audit-browser.mjs commercial-local-quota-browser.mjs commercial-pending-local-browser.mjs

Configurar PLAYWRIGHT_MODULE, CHROME_EXECUTABLE e NODE_PATH para dependencias
ja instaladas. Usar COMMERCIAL_TEST_PORT em 53000..53999 e diretorio externo
BROWSER_REGRESSION_OUTPUT para artefactos. O runner nao usa a pre-visualizacao
existente nem a porta 5210, e termina os seus servidores.
