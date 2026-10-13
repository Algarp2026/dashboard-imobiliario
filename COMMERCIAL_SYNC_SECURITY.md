# The View - Auditoria e sincronizacao comercial segura

## Estado Da Entrega

Branch: `codex/fix-commercial-auth-sync`. Implementacao local, sem push, deploy, alteracao de permissoes Google ou escrita na folha de producao.

A ligacao Google real ainda depende de configuracao e autorizacao do administrador. Os testes usam exclusivamente dados ficticios e um Apps Script/Spreadsheet simulados. Nao declarar a sincronizacao de producao validada.

## Ficheiros Da Intervencao

- `api/access.js`: origem do login e cookie mais restritivo.
- `api/commercial-data.js`: API autenticada de leitura, gravacao e recuperacao.
- `server/session.js`: validacao comum da sessao e da origem.
- `server/commercial-store.js`: OAuth, contrato Google, validacao, comprovativos e autorizacao de escrita.
- `middleware.ts`: protecao da API e bloqueio da publicacao de bibliotecas do servidor.
- `google_apps_script.gs`: autorizacao Google, CAS, intencao/recibo e bloqueio comum; preserva backups e espelhos.
- `commercial.js`: transporte seguro, arranque sem escrita, cache, conflitos, recuperacao, indicador e origem nos relatorios.
- `commercial.css`: estilo discreto do indicador/barra de sincronizacao.
- `vercel.json`: duracao maxima da Function de dados.
- `tests/access-routes.test.js`: cobertura das novas rotas protegidas.
- `tests/commercial-construction.test.js`: contrato seguro e compatibilidade de reservas/vendas antigas.
- `tests/commercial-followups.test.js`: round-trip de dados pelo novo contrato.
- `tests/commercial-sync-api.test.js`: autenticacao, Google simulado, CAS, falhas, backups e recuperacao.
- `tests/commercial-sync-client.test.js`: arranque, fallback, pendencias, reconciliacao e PDFs.
- `tests/helpers/apps-script-store.js`: Sheet e Execution API em memoria, sem acesso a Google real.
- `COMMERCIAL_SYNC_SECURITY.md`: auditoria, configuracao, testes e limites da entrega.

Nao alterados: `AGENTS.md`, `config.js`, URL `/exec`, `data.json`, `data.xlsx`, `app.js`, `index.html`, `commercial.html`, `access.html`, motor de recomendacoes e pasta `plantas/`. Sem alteracoes nos dados/precos das fracoes, compset ou algoritmos de pricing.

## Causa E Riscos Identificados

1. A password do CRM autoriza a pagina, mas a leitura anterior era um script JSONP dirigido ao Web App Google. Esse acesso possui autorizacao Google independente da sessao do CRM.
2. A verificacao sem cookies do endpoint atual devolveu HTTP 302 para `accounts.google.com`. Foram inspecionados apenas headers, sem ler a base. Isso confirma dependencia de login; nao prova perda de clientes nem a ausencia de outras permissoes no Google.
3. A gravacao anterior enviava formulario oculto e fetch `no-cors` para a mesma operacao, com possivel envio adicional ao sair. Uma resposta opaca nao confirma gravacao; o texto "Enviado" nao era prova de sincronizacao.
4. O merge anterior sobrepunha campos locais aos remotos sem conhecer uma versao de origem. Uma carteira local antiga podia substituir alteracoes recentes.
5. A inicializacao executava migracoes de precos, importacao Majuca e criacao de historico. Depois de uma leitura valida, podia chamar `save()` automaticamente; apos falha, uma edicao posterior ainda podia enviar a base local.
6. O `getDocumentLock()` anterior pode devolver `null` num Web App. A nova rotina utiliza `getScriptLock()`.
7. A sessao anterior aceitava timestamps assinados no futuro; a validacao e agora partilhada entre middleware e API, com limites de validade.

A divergencia 50/63 foi reproduzida apenas com fixtures. Nao existe total fixo na aplicacao. A fonte validada determina o numero de clientes; cada relatorio continua a aplicar os seus filtros.

## Arquitetura E Alternativas

Fluxo: navegador -> cookie CRM -> `/api/commercial-data` -> OAuth no servidor -> Apps Script Execution API -> `Store!B2`, backups e espelhos.

Foi avaliada a escrita direta na Google Sheets API com conta de servico. Essa opcao nao reproduz automaticamente backups, espelhos nem uma comparacao atomica de versoes entre leitura e gravacao. Um mutex apenas na memoria de uma Function Vercel tambem nao protege varios processos. Reimplementar todos os espelhos ou acrescentar uma infraestrutura distribuida seria uma alteracao maior.

A Execution API mantem as rotinas Google existentes e permite comparar a revisao sob um bloqueio comum do mesmo projeto Apps Script. Requer OAuth de uma identidade Google autorizada; a Execution API nao suporta contas de servico.

Documentacao primaria:

- [Apps Script Execution API](https://developers.google.com/apps-script/api/how-tos/execute)
- [Contrato scripts.run](https://developers.google.com/apps-script/api/reference/rest/v1/scripts/run)
- [LockService](https://developers.google.com/apps-script/reference/lock/lock-service)
- [OAuth offline](https://developers.google.com/identity/protocols/oauth2/web-server#offline)

## Endpoints E Autenticacao

- `POST /api/access`: mesma password no servidor, validacao de origem, comparacao constante e cookie assinado `HttpOnly; SameSite=Strict; Secure` em HTTPS. A validade mantem oito horas; cookies validos anteriores continuam compativeis.
- `GET /api/commercial-data`: valida sessao, consulta Google e devolve dados, revisao SHA-256, hora de confirmacao, capacidade de escrita e comprovativo de leitura assinado ligado a essa sessao, revisao e fonte. Resposta `private, no-store`.
- `POST /api/commercial-data`, `action=save`: valida sessao, origem, JSON, dados completos, revisao, identificador da operacao e comprovativo da leitura (validade de uma hora). Sem comprovativo valido, nao chama o Google.
- `POST /api/commercial-data`, `action=recover`: apenas retomada manual de uma operacao anterior identificada pelo mesmo ID, mesma revisao de origem e mesmo hash do conteudo. O Apps Script recusa uma operacao inexistente ou entretanto ultrapassada. Nao e uma alternativa para iniciar uma escrita sem leitura.
- Sessao ausente, invalida ou expirada: 401. Origem/comprovativo invalidos: 403. Conflito: 409. Fonte/configuracao indisponivel: 502/503. Nenhuma resposta de erro devolve dados comerciais ou erros Google brutos.
- O middleware protege o novo endpoint, e a Function valida novamente cada operacao. `/server/*` nao e servido pelo site.

Nao existe endpoint para configurar ou devolver credenciais Google. Access tokens sao enviados apenas no header Authorization entre servidor e Google. A renovacao OAuth utiliza POST, nunca parametros de URL.

## Google E Configuracao Necessaria

Nao foram criadas credenciais, alterado o Web App `/exec`, atualizadas publicacoes Google nem configuradas variaveis Vercel nesta entrega.

Para a validacao inicial, usar **uma folha e um projeto Apps Script de testes separados**, com dados ficticios. Nao atribuir a identidade de testes acesso a folha comercial de producao.

O administrador deve:

1. Criar uma identidade Google dedicada, com permissao de editor apenas sobre a folha de testes e acesso ao projeto Apps Script de testes. Nao utilizar uma conta de servico para esta arquitetura.
2. Configurar o mesmo projeto Google Cloud standard para o Apps Script e o cliente OAuth; ativar Apps Script API.
3. Autorizar os scopes efetivamente usados pelo projeto, incluindo Sheets e identificacao da identidade executante. Rever a lista "Project OAuth scopes" do Apps Script; nao acrescentar Drive/Gmail se o projeto nao os utiliza.
4. Criar o cliente OAuth e obter uma autorizacao offline para a identidade dedicada, por um fluxo de consentimento administrativo seguro. Guardar o refresh token diretamente no gestor de segredos/Vercel; nao colocar valores no chat, URLs, historico de terminal, Git ou logs. Um consentimento em modo Testing pode ter limitacoes de duracao; rever a configuracao Google.
5. Configurar as Script Properties: `CRM_SPREADSHEET_ID` (folha de testes), `CRM_ENVIRONMENT=test`, `CRM_API_CALLER_EMAIL` (identidade dedicada).
6. Preparar `Store!B2` com a fixture completa numa copia de testes. A leitura nao cria nem inicializa a folha automaticamente.
7. Publicar o projeto de testes como **API Executable**, limitado a identidade autorizada. Usar o ID dessa publicacao em `CRM_GOOGLE_DEPLOYMENT_ID`, nao a URL `/exec`. Nunca usar `devMode=true` no servidor.
8. Configurar as variaveis abaixo exclusivamente no ambiente de testes/Preview, com segredos e fontes diferentes de producao.
9. Validar num navegador limpo: login CRM, leitura, edicao, confirmacao e refresh. Validar tambem dois navegadores concorrentes e chamadas diretas sem cookie.

Variaveis do servidor, sem valores reais:

| Variavel | Finalidade |
| --- | --- |
| `COMMERCIAL_ACCESS_PASSWORD` | Password do CRM |
| `COMMERCIAL_ACCESS_SECRET` | Segredo independente para assinar sessao e comprovativos |
| `CRM_GOOGLE_CLIENT_ID` | Cliente OAuth do projeto Cloud partilhado |
| `CRM_GOOGLE_CLIENT_SECRET` | Segredo OAuth |
| `CRM_GOOGLE_REFRESH_TOKEN` | Autorizacao offline da identidade dedicada |
| `CRM_GOOGLE_DEPLOYMENT_ID` | ID da publicacao API Executable |
| `CRM_GOOGLE_SPREADSHEET_ID` | ID da folha esperada, verificado no Apps Script antes de escrever |
| `CRM_GOOGLE_WRITES_ENABLED` | Escrita so quando exatamente `true` |
| `CRM_GOOGLE_TEST_WRITES_ENABLED` | Fora de Production, exige tambem exatamente `true` |

Na Vercel, usar Environment Variables privadas/Secret, sem prefixos publicos. `VERCEL_ENV` distingue Production de Preview. Fora de Production, o servidor exige `CRM_ENVIRONMENT=test`; o Apps Script verifica ambiente e ID da folha **antes de modificar qualquer celula**. Isso evita uma escrita em producao mesmo se a Preview apontar acidentalmente para uma publicacao de producao.

## Fonte Original E Publicacoes Antigas

O novo codigo `doGet`/`doPost` aceita parametros/JSONP e nunca quebra sem `e`, mas recusa acesso comercial por HTTP com `SERVER_ACCESS_REQUIRED`. As operacoes reais passam a `crmRead`, `crmWrite` e `crmRecover` sob autorizacao OAuth. Isso nao altera o URL nem as permissoes da publicacao.

**Obrigatorio antes de ativar escrita real:** o administrador deve atualizar ou retirar, com autorizacao explicita de publicacao, todas as publicacoes antigas que ainda executem uma versao capaz de escrever sem CAS. Publicar apenas um novo API Executable nao altera o codigo de uma publicacao `/exec` antiga. Confirmar que nao existem outros scripts, clientes legados, automacoes ou integracoes que escrevam diretamente em `Store!B2` fora deste protocolo.

Enquanto existirem escritores antigos, edicoes manuais na Sheet ou outros projetos que ignorem o bloqueio do mesmo Apps Script, nao afirmar que todas as escritas da infraestrutura estao protegidas contra concorrencia. O acesso do administrador a propria Sheet continua fora da sessao CRM.

## Versoes, Backups E Recuperacao

- A revisao e SHA-256 do JSON efetivamente presente em `Store!B2`; nao depende de um timestamp do navegador.
- Novas gravacoes serializam chaves JSON numa ordem deterministica, mantendo todos os valores e a ordem dos arrays. Isso evita falsos conflitos/recibos invalidos se o transporte Google reordenar propriedades. A leitura aceita o JSON antigo sem o regravar; nao existe migracao destrutiva.
- `crmRead` e `crmWrite` utilizam o mesmo `getScriptLock()`. A comparacao da revisao, o backup e a gravacao acontecem dentro desse bloqueio, incluindo espelhos. A versao antiga recebe conflito, sem modificar a base.
- `Store!B2` continua a guardar o JSON completo, sem renomear campos ou IDs. `B3` mantem a hora da alteracao. Campos desconhecidos tambem sao preservados.
- Metadados aditivos: `B4` guarda o recibo da ultima operacao; `B5` guarda a intencao de uma gravacao iniciada. Nao ha substituicao nem migracao da base comercial.
- Antes de substituir `B2`, `Backups` recebe o JSON anterior e os timestamps no formato existente. A primeira gravacao pode criar essa aba de backup, como antes.
- `Clientes`, `Eventos`, `Agentes`, `EstadosVendas`, `PrecosHistorico` e `VendasComissoes` continuam a ser atualizados pelas mesmas funcoes espelho.
- Um erro parcial deixa `B5` presente. A leitura nao confirma sincronizacao e novas operacoes nao ultrapassam essa intencao. A retomada da mesma operacao termina os espelhos, sem repetir backup/gravacao do JSON ja aplicado.
- `testWrite()` permanece uma operacao manual autorizada, bloqueada quando ha uma gravacao incompleta. Nunca e chamada na inicializacao nem nos testes sobre producao.
- Google Sheets nao oferece uma transacao unica para todas essas folhas. A intencao duravel nao transforma os espelhos numa transacao atomica: torna a interrupcao detetavel e recuperavel. Nao apagar `B5` manualmente como forma de contornar um erro; investigar e retomar a operacao correta ou restaurar de backup sob supervisao.

## Inicializacao E Alteracoes Locais

`loadExcel` carrega `data.json`, tenta a API e apresenta os dados confirmados ou a copia local identificada. Nao executa automaticamente importacao Majuca, migracao de precos, criacao de historico ou `save()`. As rotinas de migracao existentes permanecem disponiveis no codigo, mas nao autorizam gravacoes no arranque.

A chave `theView.crmCommercial.v2`, o backup `.backupBeforeRemoteLoad` e o marcador `.pendingSync` mantem-se. Novas chaves aditivas: `.syncMeta.v1` (base/revisao e hora confirmadas), `.pendingWrite.v1` (snapshot e ID da operacao nao confirmada) e `.conflictBackup.<timestamp>` (copia explicita antes da revisao).

Sem alteracoes pendentes, uma leitura valida substitui a cache antiga apos preservar backup local. Com alteracoes pendentes, a aplicacao nao usa o merge "local ganha": conserva a copia local e pede revisao. Uma base vazia nao apaga nem envia automaticamente dados locais.

Se a fonte estiver inesperadamente vazia e existir informacao local, tambem fica bloqueada a sua adocao/reconciliacao pela interface. O administrador deve confirmar a fonte e os backups; nao se inicializa a Sheet automaticamente.

O reenvio de alteracoes pendentes nao acontece durante o arranque. Uma nova edicao ou a acao explicita "Sincronizar" pode gravar apenas quando a base, revisao, comprovativo e capacidade de escrita estao confirmados.

Na reconciliacao de tres vias, campos distintos podem ser combinados; alteracoes concorrentes ao mesmo campo, eventos comerciais ou comissoes nao sao resolvidas por prioridade arbitraria. A aplicacao mostra as diferencas, permite exportar a copia local e pode guardar uma copia antes de carregar a versao partilhada. Reconciliacoes compativeis ficam pendentes ate uma acao explicita de sincronizacao, sujeita a CAS novamente. Para diferencas criticas, rever a copia e reaplicar as alteracoes pelos fluxos comerciais normais sobre a versao atual.

`resetLocal` recusa reposicao quando existem alteracoes pendentes. Em modo partilhado, repor a cache rele a fonte sem esvaziar a carteira nem escrever na Sheet; se a leitura falhar, mantem a copia local. Diferencas entre a cache e a ultima base confirmada tambem sao consideradas pendentes, mesmo se o marcador local nao tiver sido gravado. Nao ha formulario oculto, fetch `no-cors`, JSONP de leitura nem envio de dados no `pagehide`.

Para dados antigos sem `statusEventIds`/`salePriceEventIds`, a origem do estado/preco de uma reserva ou venda e recuperada apenas antes de uma acao comercial explicita. A inferencia exige correspondencia com o evento existente e nao assume a posse de estados manuais posteriores. Isso preserva a libertacao de fracoes e comissoes ao editar/cancelar eventos antigos, sem migracao ou gravacao no arranque.

## Interface E Relatorios

A barra distingue leitura em curso, dados partilhados confirmados, dados locais sem ligacao, sincronizacao pendente e conflito. A hora mostrada e uma confirmacao recebida da fonte, nunca a hora de abertura da pagina. Em fallback, pode mostrar a ultima confirmacao historica sem afirmar que os dados atuais estao sincronizados.

O mesmo estado aparece no cabecalho sticky existente, permanecendo visivel enquanto se percorre uma ficha. Ao clicar, abre a zona com detalhes e acoes de sincronizacao. A altura e gerida pelo mecanismo de layout existente, sem camada fixa adicional sobre os modais.

Os tres PDFs de clientes mantem opcoes, filtros, contagens e layout. Acrescentou-se apenas uma linha de origem/atualidade no cabecalho. Dados pendentes, offline ou em conflito nao recebem etiqueta de sincronizados. PDFs de proposta e lista de precos nao foram alterados.

## Pontos De Mutacao Auditados

- Edicoes explicitas de clientes, agentes, eventos, manutencao e precos: preservam funcoes existentes; `save()` guarda localmente e so agenda a nova API se o estado estiver autorizado.
- Inicializacao: nenhuma migracao/importacao/gravacao comercial automatica.
- Leitura: pode atualizar apenas cache/backup/metadados locais; nao modifica a Sheet.
- Sincronizacao: snapshot unico, ID idempotente, revisao e comprovativo; apenas uma chamada HTTP de escrita por tentativa.
- Saida da pagina: nao envia dados comerciais.
- Reconciliacao: copia local preservada; nenhuma escrita remota imediata.
- Relatorios: exclusivamente consulta/exportacao.
- Backend Google: apenas `crmWrite`, recuperacao da mesma intencao e `testWrite` manual; HTTP antigo nao grava.

## Testes E Limites

Executar as suites em `tests/*.test.js` com Node 24, incluindo `commercial-sync-api.test.js` e `commercial-sync-client.test.js`. As fixtures Google verificam que leituras/escritas acontecem sob script lock, que B2/Backups/espelhos se mantem, que uma revisao antiga e recusada e que a recuperacao e idempotente.

Resultados finais nesta entrega:

- Sintaxe: `node --check` em `commercial.js`, `app.js`, `config.js`, APIs, bibliotecas de servidor e middleware. Apps Script validado pelo parser JavaScript; `vercel.json` validado como JSON.
- As 14 suites atuais passaram, incluindo precos/compset, CRM progressivo, cinco abas, follow-ups, recomendacoes, relatorios, rotas e novas suites de sincronizacao.
- Navegador Chromium: fluxo real pagina -> sessao -> API Node -> Apps Script/Sheet simulados, com 63 clientes ficticios. Sem cookie Google pessoal, sem escrita inicial, com edicao confirmada e mantida apos refresh.
- Dois navegadores: versao antiga recusada com 409, alteracoes locais conservadas, reconciliacao manual de campos distintos e nova gravacao sujeita a CAS. Nenhuma reconciliacao grava imediatamente.
- Falha HTML: consulta local identificada, edicao mantida em cache, nenhuma chamada de gravacao remota; recuperacao exige nova leitura e acao explicita.
- Tres PDFs gerados e inspecionados: 61 clientes incluidos pelos filtros (dois encerrados excluidos), 11 paginas no Acompanhamento Comercial, 2 no Resumo de Gestao e 5 na Listagem Completa. Total 63 nao e uma regra da aplicacao. Todos exibem origem/hora confirmada; o PDF offline mostra origem local, sem falsa confirmacao. Exportacao nao altera dados.
- Todas as 20 paginas desses quatro PDFs foram renderizadas e verificadas: cabecalhos/rodapes, numeracao, margens, fonte minima aproximada de 8,5 pt e ausencia de texto cortado. Sem redesenho dos modelos.
- Desktop 1440x1000 e mobile 390x844: cinco abas navegaveis, indicador visivel, sem erros JavaScript ou overflow horizontal da pagina.
- Dados protegidos comparados antes/depois das edicoes de contacto: precos, estados, comissoes, agentes, historico e campos desconhecidos inalterados. Geradores de proposta/lista de precos e funcoes de calculo preservados.
- `git diff --check` sem erros. Nenhum envio a producao, deploy, push ou escrita na Sheet real.

Cobertura dos cenarios do pedido:

| Cenarios | Evidencia controlada |
| --- | --- |
| 1-8 | Login em contexto limpo; leitura/escrita direta sem sessao, sessao invalida/expirada e cookies duplicados recusadas. |
| 9-15 | Indisponibilidade, timeout, redirecionamento 302, HTML, JSON invalido, autorizacao Google e falha parcial de espelho simulados. |
| 16-24 | Cache antiga 50/63, ausencia de migracao/importacao no arranque, migracao de historico local invocada explicitamente apos falha sem escrita remota, pendencias, recuperacao, reconciliacao e CAS de dois utilizadores. |
| 25-33 | Suites de compatibilidade com clientes antigos/incompletos e novos, cinco abas, preferencias, fracoes, eventos, proximas acoes, recomendacoes e reservas/vendas/comissoes; navegacao adicional em Chromium. |
| 34-41 | Tres relatorios, contagens filtradas, origem/confirmacao, fallback local e exportacao sem mutacao. |

Reexecutar sem producao em PowerShell, usando o Node instalado:

```powershell
node --check commercial.js
node --check app.js
node --check config.js
Get-ChildItem tests -Filter '*.test.js' | ForEach-Object {
  node $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "Falhou: $($_.Name)" }
}
```

Para verificar manualmente: usar a pre-visualizacao ficticia local fornecida na entrega ou configurar a fonte Google de testes separada conforme os passos acima. Entrar num navegador privado, confirmar origem partilhada, editar um cliente sintetico, aguardar confirmacao, fazer refresh e testar o mesmo cliente num segundo navegador. Gerar os tres modelos PDF; simular falha de ligacao na fonte de testes e confirmar origem local e bloqueio de escrita.

Nao foram verificados OAuth real, publicacao Google, permissoes Cloud, quotas Google, restricoes Workspace nem comportamento concorrente no servico Google real. Essas verificacoes exigem a fonte de testes e credenciais configuradas pelo administrador. A prova controlada local nao equivale a autorizacao para publicar.

A autenticacao continua a utilizar uma password partilhada, sem identidades individuais, niveis de permissoes ou revogacao por utilizador. Rate limiting distribuido e auditoria individual continuam recomendados, mas nao foram inventados com um contador apenas em memoria. Copias locais e PDFs contem dados pessoais e devem permanecer em dispositivos e armazenamento autorizados.

Rever tambem a privacidade do repositorio e do seu historico: o codigo existente contem uma importacao historica com nomes de clientes. Proteger o site/API nao torna privados ficheiros que estejam disponiveis num repositorio publico. Esses registos nao foram removidos ou reimportados nesta intervencao. A cache, metadados e copias locais partilham a quota do navegador; se uma copia nao puder ser preservada, a escrita remota e bloqueada e e necessario exportar os dados pendentes.

`vercel.json` limita a Function de dados a 60 segundos; cada chamada ao Google tem timeout de 20 segundos. Um timeout pode ocorrer depois de o Google ter iniciado a operacao: nunca equivale a confirmacao de falha ou sucesso, por isso o snapshot pendente e preservado e a retomada reutiliza a mesma operacao.

## Publicacao Futura

Somente apos validacao independente e autorizacao: preparar identidade/fonte de producao, rever os scopes, atualizar coordenadamente todas as publicacoes Google antigas, validar o protocolo em leitura, e so depois ativar escrita. Nao mudar `config.js`, o URL `/exec`, dados das fracoes, plantas ou precos para corrigir a autenticacao.
