# Ficha de cliente - Fase 1

Branch dedicada: `codex/client-profile-phase1`, baseada no main validado `db097c8` (PR #2 integrado). Esta entrega altera apresentacao e navegacao; nao altera dados ou regras comerciais.

## Auditoria antes da implementacao

- `commercial.html` contem listagem, filtros, painel `clientDetail` e os modais de cliente/evento. Os scripts de configuracao e comercial continuam na mesma ordem. O HTML nao foi alterado.
- `renderClientDetail` e `activateClientDetailTab` apresentavam Dados/Preferencias/Fracoes/Acompanhamento/Resumo no painel lateral. A nova estrutura reutiliza esses elementos e o mesmo modelo, sem criar outra aplicacao.
- Criacao/edicao: `openClientModal`, `saveClient`, `saveClientEdit`, `saveClientPreferences` e os modos identity/preferences/plan/associate/stage. Os patches existentes e validacoes foram preservados.
- Preferencias: `cleanPreferences`, textos legados, budget/budgetMin/budgetMax. A visualizacao usa etiquetas apenas de leitura, sem transformar o formato guardado. A edicao continua no modal existente.
- Fracoes: `relatedClientFractions`, `presentationSelection`, `openPresentationSelectionModal` e `clientSuggestedFractionTiles`. A selecao existente continua funcional; nao transforma uma recomendacao numa apresentacao realizada.
- Apresentacoes: `openEventModal`, `clientPresentedFractionRows`, `clientPresentedFractionsMarkup`, `clientTimelineItem`, `openContextPresentation` e o modal de preco do PDF. Nao foram alteradas as criacoes/edicoes dos eventos, precos ou PDFs.
- Negociacao: eventos existentes de proposta/contraproposta/reserva/venda, filtrados por cliente e fracao. Valores de eventos com varias fracoes nao sao repartidos nem inventados: a visualizacao identifica quando o valor pertence ao evento completo.
- Navegacao: estado UI em `commercialUx`, pesquisa/filtros em `state.cf`, cliente selecionado e scroll da listagem. O abrir/regressar so muda estado visual. Os destinos antigos followup/summary permanecem compativeis por aliases para Negociacao/Dados.
- Recomendacoes: `commercial-recommendations.js` foi inspecionado e nao alterado. O motor atual fornece correspondencias, mas nao implementa uma nova lista de alternativas ate 5% acima do investimento.
- API/sincronizacao: `api/commercial-data.js`, `server/commercial-store.js`, `server/session.js`, `google_apps_script.gs` e documentacao `COMMERCIAL_CHUNK_STORAGE.md`. O fluxo autenticado, revisoes, tickets, blocos, backups e conflitos nao foi alterado. O trecho de commercial.js desde normalizeData ate ao fim e identico ao da base desta branch, desconsiderando apenas a conversao de finais de linha LF/CRLF do Git no Windows.

Riscos de uma alteracao visual: rerender que gravasse dados, perda de valores legados, selecao confundida com apresentacao, handlers antigos sem destino e perda de contexto da lista. A implementacao reutiliza handlers existentes; a navegacao/renderizacao e testada com modelos congelados e contadores de escrita.

## Interface entregue

- Abrir um cliente expande a ficha para a largura principal, mantendo a navegacao comercial existente. Voltar aos clientes preserva pesquisa, estado do lead, cliente selecionado e posicao da lista.
- Cabecalho com nome, estado, contactos/origem quando existentes, data de registo apenas quando guardada e ultima interacao derivada dos eventos. Nao se inventa a data de criacao a partir de um evento.
- Cinco abas acessiveis: Dados, Preferencias, Fracoes, Apresentacao e Negociacao. Setas/Home/End permitem navegar pelo teclado; a aba ativa e mantida durante renderizacoes e por cliente durante a sessao.
- Dados: informacao principal e complementar expansivel, resumo e recomendacao atuais.
- Preferencias: etiquetas de valores existentes, distinguindo nao informada, indiferente e escolhas expressas/texto legado. Botao de edicao abre o modal atual.
- Fracoes: correspondencias atuais, motivos existentes, selecao multiple no seletor atual e acesso a outras fracoes manualmente. Espaco para alternativas proximas sem novo motor ou resultados fabricados.
- Apresentacao: selecao preparada, precos oficiais, disponibilidade, configuracao de precos do PDF pelo fluxo atual, registo de apresentacao/documentacao e historico existente.
- Negociacao: consulta por fracao de propostas/contrapropostas e valores informados existentes; eventos originais continuam editaveis. Proxima acao atual permanece ao nivel do cliente. Historico completo acessivel, incluindo eventos sem fracao.
- Estilos antracite, areas sem cartoes decorativos, abas sticky abaixo das barras existentes e scroll horizontal de abas/tabelas em mobile. Z-index das abas abaixo dos modais.

## Funcionalidades para Fase 2 (nao implementadas)

- Novos seletores persistidos de tipologias T1/T1+1/T1-Duplex/T2/T2+1/T3, pisos 1-6 e orientacoes com multisselecao/Indiferente exclusivo. Nesta fase, a edicao de texto existente permanece funcional, sem converter dados.
- Novo motor de alternativas proximas, incluindo margem de 5% e avisos de investimento.
- Novo formulario inline de preco individual/data/meio de apresentacao. Nesta fase, usar o modal existente de eventos/PDF, conservando as validacoes atuais, inclusive a regra atual de precos abaixo do oficial.
- Negociacao editavel e proxima acao independente por fracao, novas confirmacoes obrigatorias para reserva/venda e futura timeline unificada. Nenhuma nova regra de disponibilidade foi introduzida.

## Validacao isolada

Pre-visualizacao local: `http://127.0.0.1:5193/commercial.html`. Password exclusivamente de teste: `View-UI-Phase1-Teste`.

O servidor de teste fica fora do Git e gera 64 clientes ficticios, cinco eventos e um agente ficticio. Usa autenticao/API do repositorio com identidade e Google simulados em memoria. Todas as gates de escrita estao false; a fonte tambem recusa gravações. O browser bloqueia pedidos para hosts externos. Nao le ficheiros de recuperacao nem credenciais reais. A lista historica hardcoded de importacao e removida somente da resposta JS do servidor de testes; o ficheiro do repositorio nao e sanitizado nem alterado nesse ponto.

Nao foi criada uma Preview Vercel. `vercel.json` desativa deployments Git automaticos APENAS para esta branch, conforme [documentacao oficial](https://vercel.com/docs/project-configuration/git-configuration). Outras branches mantem o comportamento anterior. Uma futura preview HTTPS exige fonte ficticia isolada e revisao das permissoes; nao utilizar credenciais de producao. Este bloqueio Git nao impede um deployment manual explicitamente forcado.

Testes executados:

- Renderizacao/abas com modelos congelados: clientes legados e incompletos, etiquetas de preferencias, aliases antigos, filtros e distincao entre preparacao/apresentacao, sem alteracoes ao JSON nem pedidos de rede.
- Browser desktop 1440x1000, tablet 820x1080 e mobile 390x844: login, abertura, cinco abas, retorno com pesquisa preservada, valores antigos no modal de preferencias, modal de apresentacao e edicao do evento original, clientes incompletos e Indiferente. Scroll verificado sem sobreposicao entre abas sticky e barra de acoes.
- JSON comercial no localStorage identico antes/depois; zero POST comerciais, zero escritas na fonte e zero erros JavaScript. As capturas para revisao do PR #3 contêm somente dados ficticios e estao na [galeria visual](docs/client-profile-phase1-review/README.md).
- Oito suites passaram: commercial-client-tabs, commercial-progressive-flow, commercial-ux, commercial-recommendations-ui, commercial-client-reports, commercial-sync-client, commercial-concurrency e commercial-chunk-storage. `node --check` passou para commercial.js, app.js e config.js. Comparacao de fonte confirmou sincronizacao e nove funcoes comerciais inalteradas.

Para testar: iniciar sessao local, abrir Cliente exemplo, alternar as cinco abas, abrir/cancelar os modais, regressar e confirmar filtros. Testar Cliente demonstracao 02 (campos vazios) e 03 (Indiferente). A preview e de leitura remota: uma edicao deliberada fica apenas local e nao modifica Sheets.

Limites: nao se validou qualquer cliente real ou ambiente de producao. Fixtures nao comprovam todas as variantes historicas. O estado visual das abas e mantido na sessao em memoria; nao foi criada persistencia adicional no CRM. Esta Fase 1 aguarda validacao visual/funcional antes das fases seguintes.

## Correcoes da revisao do PR #3

- Removida a regra CSS que escondia as abas e o conteudo do cliente selecionado na listagem. O painel lateral continua operacional antes de abrir a ficha completa e depois de regressar. Apenas o botao de regresso fica escondido quando ja se esta na listagem.
- Reposta a consulta anterior das fracoes relacionadas: estado com cliente, preco informado, data e observacao, usando `clientFractionCommercialRows` sem mudar a derivacao existente. O orcamento indicativo legado tambem permanece visivel, mesmo quando existe investimento maximo distinto.
- Alternativas proximas identifica expressamente o motor futuro da Fase 2. O acesso manual a outras fracoes e as correspondencias do motor atual continuam disponiveis.
- Regressao direcionada: suites client-tabs, progressive-flow e UX aprovadas; `node --check commercial.js` aprovado. Comparacao com a base confirmou o trecho de sincronizacao e nove funcoes comerciais intactos.
- Browser 1440x1000, 820x1080 e 390x844: abas/conteudo visiveis na listagem; filtros, cliente selecionado e scroll preservados; preferencias e eventos editaveis pelos modais existentes; cinco abas operacionais; sem overflow da pagina nem sobreposicao das abas com a barra sticky. JSON comercial inalterado, zero POST comerciais, zero escritas na fonte ficticia e zero erros JavaScript.
- Evidencia e instrucoes na galeria: listagem, transicao, cinco abas desktop/mobile e regresso. API, Google Sheets, autenticacao e sincronizacao nao foram alterados. Nao houve merge nem deployment.
