# Ficha de Cliente: Dados / Procura / Oportunidades

Branch: `codex/client-profile-followup-ux`.
Base atualizada por fetch: `8c5026cdc38b6e2a9765880f4202af0e9c6b0c62`,
incluindo PR #26 (`b016e40`). A PR #24 nao foi usada nem alterada.

## Estado

Implementacao funcional e visual integrada e validada para revisao em Draft PR.
Nao autoriza merge ou publicacao. Nenhum acesso a dados ou servicos de producao.

## Experiencia Implementada

**Dados:** identificacao compacta, contactos, origem, responsavel quando registado,
estado comercial e uma acao Editar cliente. Dados complementares recolhidos.
Um formulario de Seguimento comercial com resposta, pendencia, ultima interacao,
inicio da espera, observacao, prioridade e lembrete opcional. Criar, reagendar,
concluir ou remover lembrete conserva o historico. Indicador discreto na carteira
para hoje/vencidos. Historico tecnico recolhido com antes/depois e identidade.
Comunicacoes efetivas, administracao e agendamentos antigos continuam acessiveis
numa seccao secundaria; nao se criam eventos ficticios.

**Procura:** um unico resumo horizontal sticky (tipologia, pisos, orientacoes e
investimento); sidebar exclusivamente de selecionadas, com contador, referencias,
remocao e Adicionar fracoes sempre acessivel. Mobile usa barra compacta sticky e
referencias em linha horizontal, sem outro scroll vertical. Cartoes compactos,
preco/disponibilidade confirmados e compatibilidade objetiva. Sem justificacao
extensa ou preferencias duplicadas. Consulta manual das 39 fracoes e editor
estruturado preservados. Textos antigos e outras preferencias recolhidos.

Regra OR, pisos, orcamento e alternativas ate +5% mantidos. Unica extensao ao ranking:
em correspondencias principais equivalentes nos criterios existentes (incluindo
preco), ambas as orientacoes precedem o desempate pelo numero. A ordenacao das
alternativas permanece igual. Nao foram alterados valores comerciais ou analiticos.

**Oportunidades:** grupos pelos estados do motor existente: preparacao,
apresentacao, negociacao, reservas, vendas, encerradas e recusadas. Recusadas
recolhidas por defeito com contador; reaberturas seguem a projecao original.
Detalhe em dialog sobreposto, fullscreen mobile, nunca expandido na lista.
Mesmos controladores, formularios e validacoes para condicoes, historico, operacoes
e PDF. Escape, Tab/Shift+Tab, foco de retorno, scroll e rascunhos protegidos.
Eventos/PDFs/confirmacoes suspendem o dialog e devolvem o detalhe quando fecham.
Edicao historica reutiliza o editor existente num dialog de auditoria.

Identidade D2 e view-theme.css preservados. Nao se redesenharam os outros modulos.

## Modelo Aditivo e Precedencia

Campo opcional client.followupV1:

- version: 1.
- response: client | team | none.
- neutralState: Em acompanhamento | Sem contacto.
- pendingDescription, lastInteraction, waitingSince, observation: string.
- reminder: null ou {date, state: open | done | removed, ...campos preservados}.
- history: [{version:1, id, recordedAt, before, after, ...campos preservados}].

Migracao aditiva/versionada por cliente, exclusivamente numa gravacao explicita:
nao existe migracao automatica da base nem reescrita de eventos antigos.
Registos antigos, metadados desconhecidos, nextStep, followupDate e eventos
permanecem intactos. Estruturas/versoes desconhecidas falham de forma explicita.

A aguardar cliente -> client; Resposta nossa pendente -> team; os dois estados
neutros -> none, conservando o significado em neutralState. Filtros mantem os quatro
estados. Estado comercial e resposta pendente sao independentes.

Ultima interacao e a data mais recente entre a manual valida e uma comunicacao
efetiva posterior, nunca um evento administrativo. Inicio da espera e independente;
nenhuma observacao, resposta ou lembrete o redefine. Contadores usam datas de
calendario, nao recordedAt. Sem pendencia, o contador de espera fica inativo.

Uma decisao explicita em contactStateHistory tecnicamente posterior a ultima
decisao de seguimento pode atualizar o estado vigente. Decisoes antigas/correcoes
historicas nao substituem a nova. Data efetiva e momento de registo sao distintos.

## Persistencia e Seguranca

Usa persistClientChange/save/syncRemote existentes. Guardar sem alteracoes nao envia
pedidos. A interface distingue rascunho, gravacao e confirmacao efetiva; falhas
conservam a copia local e nao anunciam sincronizacao.

Antes de guardar, compara followupV1, contactStateHistory e priorityHistory com a
base do rascunho. Leituras automaticas nao substituem formularios abertos.
A protecao de regressao reconhece apenas caminhos escalares conhecidos do campo
novo; historicos e metadados desconhecidos continuam conservadores.

CAS, tickets, B5/B6, pedidos originais, backups, IndexedDB, idempotencia e fences
contra leituras obsoletas da PR #26 nao foram reimplementados. O validador Apps
Script real foi executado no emulador com a extensao aditiva. API, Apps Script e
bundle de integridade inalterados: nao exige publicacao coordenada de servidor.

## Matriz dos 36 Cenarios

Cobertura executavel; resultados agregados finais na seccao seguinte.

| # | Requisito | Evidencia principal |
| --- | --- | --- |
| 1 | Cliente antigo sem campos | client-followup Node; client-tabs; browser novo |
| 2 | Resposta/data retroativa | client-followup Node/browser |
| 3 | Observacao sem reiniciar contadores | client-followup Node |
| 4 | Alterar so ultima interacao | client-followup Node |
| 5 | Corrigir inicio da espera | client-followup Node |
| 6 | Resposta sem contacto ficticio | client-followup Node; eventos identicos no browser |
| 7 | Ciclo completo do lembrete | client-followup Node/browser |
| 8 | Agenda/follow-ups legados | client-followup; followup-layout; contacts browser |
| 9 | Recarregar novos campos | profile-followup quatro formatos |
| 10 | Quatro estados internos | client-followup; contacts; filtros existentes |
| 11 | Estado comercial independente | client-followup; stage; reform browser |
| 12 | Resumo horizontal sticky | profile-followup: geometria apos scroll |
| 13 | Sidebar de selecionadas | profile-followup; phase2b browser |
| 14 | Adicionar sempre acessivel | profile-followup: geometria quatro formatos |
| 15 | Orientacoes OR | fraction-recommendations Node |
| 16 | Desempate de ambas orientacoes | fraction-recommendations: caso de equivalencia |
| 17 | Pisos/orcamento sem exclusao indevida | fraction-recommendations; phase2b browser |
| 18 | Precos/estados por confirmar | phase2b; safety; consultation browser |
| 19 | Selecao durante sync | fraction-draft; auto-sync; phase2b browser |
| 20 | Agrupamentos projetados | opportunity-cards/matrix; visual-audit browser |
| 21 | Recusadas recolhidas/contador | profile-followup browser |
| 22 | Reabrir/reservar/vender/cancelar | reform; audit-defects; stage; matriz Node |
| 23 | Detalhe sobreposto | profile-followup quatro formatos; workspace-dialogs |
| 24 | Teclado e foco | profile-followup: Tab/Shift+Tab/Escape/retorno |
| 25 | Fechar/regressar | profile-followup; workspace; visual-audit browser |
| 26 | Edicao/atualizacao remota | auto-sync; profile-followup duas sessoes |
| 27 | Rascunhos e historicos | workspace-dialogs; PR6; routing; profile-followup |
| 28 | Gravar e consultar noutra sessao | auto-sync; profile-followup; sync-client Node |
| 29 | Atualizacao sem F5 | auto-sync; safe-reconciliation browser |
| 30 | Formulario durante leitura | auto-sync; profile-followup duas sessoes |
| 31 | Conflito CAS | profile-followup HTTP409; concurrency; auto-sync |
| 32 | Falha preserva dados | quota/storage-reliability; pending-local; profile-followup |
| 33 | Resultado incerto sem duplicacao | write-recovery; apartment16; pending-local; PR6 |
| 34 | Autenticacao/escrita desativada | sync-api; source-integrity; safety browser |
| 35 | Contrato Apps Script | client-followup write no emulador; integrity-server |
| 36 | PDFs PR #23 | presentation-pdf Node/browser; exports |

Nomes abreviados correspondem aos testes commercial-*.test.js/*-browser.mjs.
Nenhum teste foi retirado, nem timeout aumentado. Os percursos passaram a operar
os dialogs reais, mantendo verificacoes de dados, disponibilidade e seguranca.

## Resultados e Evidencias

- 68 suites Node: 68 aprovadas, zero falhas, no codigo final.
- 34 suites de navegador: 34 aprovadas, zero falhas, numa passagem continua
  sobre o codigo final, depois das correcoes reproduzidas.
- 160 verificacoes de sintaxe: 160 aprovadas.
- Browser real Chrome: 1440x1000, 1366x768, 820x1080 e 390x844.
- Fontes ficticias autenticadas em loopback, requests externos bloqueados.
- Antes/depois: main 8c5026c e branch atual, mesma fonte sintetica.

[Node](docs/client-profile-followup-ux/node-results.json),
[catalogo browser](docs/client-profile-followup-ux/browser-results.json),
[quatro formatos e concorrencia](docs/client-profile-followup-ux/profile-browser-results.json),
[sintaxe](docs/client-profile-followup-ux/syntax-results.json).
Os 36 cenarios estao cobertos pelas suites da matriz, nao apenas por verificacao
da existencia dos nomes dos separadores. Zero erros JS na suite visual nova.
As execucoes exploratorias anteriores nao substituem esta passagem final.

Defeitos encontrados e corrigidos: montador D2 antigo movia a selecao para fora da
sidebar; dialogs nativos podiam ocultar modais legados; Tab podia abandonar o
detalhe; decisao explicita de contacto posterior precisava de precedencia.
Uma visita efetiva posterior fazia um save de lembrete copiar a data projetada
sobre a data manual: o teste reproduziu 20/10 versus 15/10; agora preserva 15/10
no modelo, projetando 20/10 no contador. So editar explicitamente o campo muda a
data manual. A restauracao de details fechados podia ocultar uma comunicacao em
edicao apos reload; abre-se agora a seccao exterior quando existe esse formulario.

O teste de arquivo encontrou LOCAL_BACKUP_CHANGED durante manutencao concorrente.
O bloqueio seguro permanece: verifica-se cache mais recente e pedido original
antes de uma unica repeticao da verificacao externa. A implementacao do arquivo
nao foi alterada.

Guardas historicos normalizam apenas os sete trechos de integracao revistos da
ficha, ficheiros visuais exatos e o desempate exato de orientacoes. Restante
persistencia/PDF/regras comerciais continua comparado byte a byte. Testes
funcionais executam sempre o codigo atual. Plantas sao comparadas com a main
atual, preservando uploads do utilizador posteriores as fotografias antigas.

## Reproducao

Aplicacao: commercial-client-followup.js (novo modelo/UI), commercial.js (sete
trechos de integracao), commercial-opportunity-ui.js (composicao e dialogs),
commercial-client-workflow-ui.js (reuso de rascunho/editor),
commercial-client-workspace.js (pilha/foco), commercial.css e
commercial-client-workspace.css (layout restrito), commercial.html (modulo defer),
view-workspace.js (evitar remonte legado), commercial-fraction-recommendations.js
(desempate revisto). vercel.json apenas desativa deployment desta branch.
Restantes alteracoes: testes, fixtures ficticias, guardas historicos e esta galeria.

[Galeria antes/depois](docs/client-profile-followup-ux/README.md).

```powershell
node tests/commercial-client-complete-regression.cjs
node tests/commercial-browser-regression.cjs
node --check commercial.js
node --check commercial-client-followup.js
node --check app.js
node --check config.js
```

Browser requer Playwright/Chrome e porta livre 53000..53999
(COMMERCIAL_TEST_PORT). BROWSER_REGRESSION_OUTPUT e COMPLETE_ARTIFACTS permitem
guardar resultados fora do repositorio. O runner termina as fontes ficticias
de cada suite. Nao usa credenciais de producao.

## Limites e Riscos

- Chrome com viewports nao equivale a validacao num iPhone/Safari ou Firefox reais.
  dialog nativo requer navegador moderno.
- Fonte/Google emulados: nenhum resultado e uma medicao ou escrita no Google real.
- Browsers antigos abertos devem recarregar antes de editar o seguimento novo.
  Nao se introduziu um sistema de atualizacao automatica apos deployment.
- Historicos crescem apenas em alteracoes efetivas, sob limites seguros existentes.
  Backups antigos e pedidos pendentes nao foram eliminados.
- Novos campos opcionais: sem migracao/recuperacao de dados reais.
- Deployment automatico desativado apenas para esta branch.
- Sem merge, deployment, configuracoes/credenciais alteradas ou operacoes Google.

Relatorios futuros podem consumir datas, contadores, resposta, observacao,
lembrete e proximas acoes legadas. Esta entrega nao modifica relatorios/PDFs.
