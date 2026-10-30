# D/D2: fecho visual e estados de sincronizacao

## Base e limites

Branch: `codex/complete-d2-loading-ui`, a partir de `54dfd0a` da main, incluindo PRs #22 e #23. Revisao exclusivamente visual/interativa, sem acesso a dados comerciais reais. Nenhuma migracao, merge, publicacao ou operacao Google.

Referencias confrontadas: `VISUAL_WORKSPACE.md`, `COMPOSITION_D2.md`, `COMPOSITION_D2_PLATFORM.md`, `CLIENT_AGENT_WORKSPACE.md`, `CRM_CONSOLIDATION_PR17.md`, `CRM_OPPORTUNITY_INTEGRATION.md`, `CRM_AUTO_SYNC.md`, `CRM_LOADING_PERSISTENCE.md` e testes do PDF do PR #23. Prevalece a interface atual Dados / Procura / Oportunidades, nao a antiga estrutura de cinco abas.

## Matriz de cumprimento

| Modulo / decisao aprovada | Main observada | Lacuna ou problema | Alteracao efetiva / evidencia |
| --- | --- | --- | --- |
| Identidade global: sidebar, superficies claras, verde suave, estrutura grafite e dourado contido | D2 ja aplicado; wrappers de composicao ja existentes | Densidades e tratamentos secundarios diferentes entre modulos | Complemento screen-only de `view-theme.css`: tabelas, listas, cabecalhos, detalhes e formularios; todos os modulos fotografados |
| Dashboard: quatro indicadores e prioridades continuas | Quatro KPIs e pipeline existentes; lista limitada a oito entradas e candidatos incompletos | Respostas nossas e lembretes vencidos podiam nao entrar na lista; corte artificial | Acrescenta esses candidatos e remove o corte, ordenando pela urgencia ja existente; lista com scroll proprio. Expressoes dos quatro KPIs e pipeline preservadas |
| Clientes: carteira ampla, pesquisa/filtros, modal compacto e tres abas | Carteira, filtros, contactos, ordenacao e modal ja implementados | Nao justificava recriar a carteira | Mantidos percursos, filtros e botoes; tratamento de linhas mais compacto. Capturas clientes e ficha nos quatro formatos |
| Dados: Seguimento comercial e comandos contextuais | Dados gerais, plano, contacto e prioridade espalhados; identidade repetida | Maior altura e duplicacao de contexto | Reagrupa os mesmos controlos e handlers; identificacao complementar e comandos secundarios recolhiveis; rotulos Resposta pendente, O que esta pendente e Lembrete opcional |
| Dados: dias e datas de seguimento | Ultima interacao derivada dos eventos; estado com recordedAt administrativo | Modelo nao tem inicio de espera independente nem datas editaveis independentes | Contadores so quando a origem e conhecida; inicio explicitamente identificado como registo do estado. Datas editaveis e observacao especifica pendentes de aprovacao, abaixo |
| Procura: criterios/selecoes laterais, resultados e Adicionar fracoes | Layout D2 lateral ja existia; abertura manual no fim da lista | Criterios desapareciam durante scroll e adicionar exigia procurar o disclosure | Sidebar sticky no desktop, fluxo normal no mobile; botao contextual abre e foca o seletor existente; editar preferencias junto dos criterios. Motor, orientacoes multiplas, pisos, alternativas e selecoes intactos; sem bloco Porque recomendamos |
| Oportunidades: ativas, apresentadas, resultados, recusadas e encerradas | Cartoes individuais com estados calculados e expansao inline | Mistura de grupos; detalhe longo deslocava a leitura | Agrupa exclusivamente pelo estado projetado existente; recusadas/encerradas recolhidas; drawer com scroll, Escape, foco e protecao durante gravacao. Elemento original preservado no mesmo controlador; nenhuma mudanca no motor |
| Fracoes e vendas: indicadores, filtros e inventario legivel | Indicadores, filtros, tabela e acoes comerciais ja presentes | Ajustes de densidade/legibilidade, sem necessidade de novo fluxo | Complemento visual das tabelas e controlos; reserva/venda e validacoes existentes preservadas; captura inventario |
| Precos: filtros laterais, analise e historico expansivel | Composicao lateral e historico D2 existentes | Consistencia visual e leitura do estado de gravacao | Tabela/cabecalhos uniformizados; indicador nativo de estado mantido e detalhes tecnicos progressivos. Nenhuma alteracao de precos ou calculos |
| Comparador interno: criterios e resultados | Estrutura D2 existente | Densidade dos controlos e tabelas | Polimento screen-only, sem alteracao de `app.js`, dados ou calculos; captura comparador-interno |
| Comparador publico e BelaFormosa: metricas separadas e filtros laterais | Composicao D2 e analise BelaFormosa presentes | Uniformidade dos resultados | Tratamento visual comum; capturas comparador-publico, belaformosa e comparador-detalhe. Sem indicador CRM na fonte analitica independente |
| Agentes: diretorio pesquisavel e detalhe agrupado | D2 ja organizava diretorio/contactos/condicoes e modal | Densidade e consistencia com restantes listas | Ajustes de tabela/lista e detalhe, preservando pesquisa, selecao e edicao; captura agentes |
| Eventos e historico: cronologia pesquisavel, datas e proveniencia | Pesquisa, detalhes expansiveis e historico por fracao existentes | Uniformidade visual | Estilos compactos comuns, sem recriar eventos ou relacoes; capturas eventos e historico |
| Relatorios e propostas: catalogo, manutencao secundaria e opcoes uniformes | Catalogo e formularios D2 existentes | Espacamento/densidade | Polimento screen-only e capturas relatorios/modal-lista-precos. PDF com/sem preco e nomes do PR #23 protegidos por teste de identidade de fonte |
| Loading PR #22: distinguir rotina, edicao, local, gravacao e confirmacao | Estado nativo ja correto; diagnosticos extensos | Detalhes tecnicos competiam com a operacao | Classificacao DOM de apresentacao, indicador discreto e diagnosticos recolhiveis; erros e recuperacao continuam acessiveis. Transporte e estados fonte inalterados |

## Representacao dos nove estados

`THE_VIEW_D2.syncDisplay` classifica apenas atributos/textos nativos: initial, checking, draft, local, saving, confirmed/verified, received, offline/readonly e conflict/uncertain. Nao confirma gravacoes, nao emite pedidos, nao muda revisoes e nao limpa pendingWrite. O estado confirmado continua dependente da confirmacao efetiva do mecanismo existente. Diagnosticos completos e acoes de recuperacao nao sao removidos.

## Pendencias que exigem decisao separada

- Ultima interacao editavel independente dos eventos e inicio da espera ajustavel: nao existem campos apropriados no modelo atual. Alterar `recordedAt` falsificaria a cronologia administrativa; por isso nao foi feito.
- Observacao especifica do seguimento e eventualmente um unico formulario atomico para pendencia/estado/lembrete: exigem definir se sao novos dados ou se substituem campos existentes. As notas gerais e os formularios existentes continuam acessiveis, sem serem repurpostos silenciosamente.
- As duas opcoes sem resposta pendente mantem a distincao historica Sem contacto / Em acompanhamento. Nao sao fundidas no armazenamento.
- Os contadores de espera mostram desconhecido quando falta proveniencia adequada e nao inventam datas. A apresentacao visual esta concluida dentro destes limites; a revisao de 22/10 nao esta integralmente concluida quanto aos campos independentes.

## Garantias de escopo

`commercial.js` muda apenas `renderWorkspaceDashboard`; `commercial-opportunity-ui.js` muda apenas a marcacao de Dados. Testes com hashes dos trechos autorizados reconstituem a fonte base e verificam que o restante ficheiro continua identico. Os guards anteriores de loading e PDF continuam ativos. API, server, Apps Script, integridade Google, autenticacao, modelo comercial, `config.js`, `data.json`, `data.xlsx` e plantas nao sao alterados.

`vercel.json` acrescenta somente a exclusao de deployment automatico desta branch. Nao houve alteracao de configuracao remota.

### Ficheiros alterados

- Runtime: `view-workspace.js`, `view-theme.css`, `commercial.js` (apenas dashboard) e `commercial-opportunity-ui.js` (apenas markup de Dados).
- Protecao local de publicacao: `vercel.json`.
- Cobertura nova: `tests/commercial-d2-final.test.js`, `tests/d2-final-review-browser.mjs`, `tests/helpers/d2-final-review-preview.cjs`, `tests/helpers/d2-visual-source.cjs`.
- Helpers/guards: `tests/helpers/current-client-ui.mjs`, `loading-persistence-source.cjs`, `presentation-pdf-source.cjs` e testes de integracao PR20/21/22. Os guards antigos nao sao eliminados: normalizam unicamente as alteracoes visuais explicitamente revistas e comparam o resto integralmente com a base.
- Catalogo de navegador: adicionada uma suite D2, mantendo todas as 28 anteriores.
- Percursos de navegador adaptados: client-workspace, dialogs, audit-defects, auto-sync, complete-exports, contacts, local-quota, pr6-regression, profile-routing, stage, crm-post-audit, crm-reform, crm-reform-safety e visual-audit. Verificacoes funcionais mantidas; nova verificacao explicita dos values das opcoes e de diagnosticos acessiveis.
- Entrega: este relatorio e `docs/d2-loading-review/` com a galeria e resultados visuais.

## Reproducao e evidencias

- [Galeria antes/depois](docs/d2-loading-review/README.md): 18 vistas, quatro dimensoes, duas fases; 144 PNGs reais.
- O modo before serve os quatro ficheiros de runtime da base `54dfd0a`, mantendo a mesma fixture ficticia. O importador embutido e neutralizado pela fixture: nenhuma lista real e carregada.
- Fonte em memoria: 64 clientes ficticios e catalogo sintetico com 39 unidades The View, 280 concorrentes e 216 BelaFormosa ficticias; nao e uma copia da base real nem prova dos precos de producao.
- O teste visual bloqueia rede externa e todas as escritas comerciais; compara cache/revisao/contagem de escritas antes/depois. Verifica overflow, erros JS e preservacao de formulario, foco, texto e selecao apos leitura remota.
- As suites funcionais usam a API e Apps Script simulados ja existentes, exclusivamente locais. Nao sao medicoes de desempenho Google.

### Comandos

```text
node tests/commercial-client-complete-regression.cjs
node tests/commercial-browser-regression.cjs
python tests/test_belaformosa_workbook.py
python tests/validate_presentation_pdfs.py <artefactos-pdf>
node --check <cada ficheiro JS/CJS/MJS rastreado ou novo>
```

O runner de navegador cria e encerra servidores isolados em portas 53xxx. Requer PLAYWRIGHT_MODULE, CHROME_EXECUTABLE e NODE_PATH apontados para o runtime local. A fixture visual e `tests/helpers/d2-final-review-preview.cjs`; `D2_REVIEW_PHASE=before|after` controla a comparacao.

### Revisao manual recomendada

1. Comparar as duas imagens de cada linha da galeria; usar as quatro secoes de viewport, nao apenas desktop.
2. Apenas na fixture local, abrir a carteira e o cliente ficticio; percorrer Dados / Procura / Oportunidades e voltar a listagem. Abrir os comandos secundarios sem perder os filtros.
3. Editar preferencias sem guardar, executar a verificacao simulada e confirmar foco/texto/selecoes. Abrir o drawer, deslocar um formulario longo, cancelar e reabrir; confirmar que o rascunho continua disponivel.
4. Testar o seletor Resposta pendente e confirmar que os valores enviados continuam pertencentes aos quatro estados originais. A suite contacts verifica os respetivos registos e historicos.
5. Nas propostas, comparar PT/ENG e PT/FR, uma e varias fracoes, com e sem preco. O nome final .pdf continua dependente do navegador.
6. Para falhas e quota, usar exclusivamente as suites/controles da fixture. Nunca ligar estes testes a uma API ou Sheet real.

## Resultados finais

| Verificacao final executada | Resultado |
| --- | --- |
| Catalogo Node completo | 62/62 suites, zero falhas |
| Catalogo de navegador completo, numa unica execucao final | 29/29 suites, zero falhas |
| `node --check` de todos os JS/CJS/MJS rastreados ou novos | 138 aprovados, zero falhas |
| Workbook / JSON / importacao idempotente / integridade analitica | 4/4 testes aprovados |
| Validacao dos PDFs efetivamente gerados | 8 PDFs, 12 paginas, A4 portrait, titulos/precos/plantas e renderizacao aprovados |
| Capturas antes/depois | 144 PNGs; 18 vistas x quatro viewports x duas fases |
| Consulta visual e verificacao simulada com formulario aberto | Zero escritas, cache e revisao iguais, foco/texto/selecoes preservados |
| Integridade do diff | Sem erros de whitespace; fontes/dados protegidos inalterados |

[Resultados Node](docs/d2-loading-review/node-results.json) e [resultados de navegador](docs/d2-loading-review/browser-results.json) registam as suites realmente executadas. O agregador Node conserva referencias historicas das auditorias anteriores; nao sao a base desta branch. A base desta revisao e `54dfd0a`, verificada pelos guards D2/PR22. O campo historico `wholePublishedSyncBlockUnchanged: false` refere-se a uma base anterior aos PRs #21/#22; os guards atuais confirmam a preservacao dessas correcoes e que esta revisao so altera o renderer do dashboard no `commercial.js`.

As falhas intermedias abaixo foram corrigidas e repetidas; nao foram contadas como aprovacao. A ultima execucao completa de navegador terminou com exit code 0 nas 29 suites. Todos os testes e medicoes sao locais/ficticios, sem resultados Google reais.

### Defeitos encontrados durante esta revisao

- Layout real do drawer: o conteudo de formularios longos nao tinha altura maxima propria; o Cancelar podia ficar fora do alcance. Corrigido com scroll limitado e testado durante sincronizacao automatica.
- Regressao introduzida pelo polimento do seletor: opcoes sem atributo value mudavam o valor submetido quando o rotulo era encurtado. Corrigido fixando explicitamente o value original antes de mudar o texto. A suite visual compara os quatro valores reais das opcoes em cada viewport; as suites de contactos e PR6 verificam gravacao, estados e historico. Nunca foi publicado nem aplicado a dados reais.
- Percursos antigos de testes: cliques no fundo de um drawer modal, comandos agora recolhidos e factos de seguimento movidos para o bloco compacto. Adaptados ao percurso real, sem force-click nem remocao de verificacoes comerciais.
- Diagnosticos recolhidos: codigos tecnicos continuam presentes e a suite de quota abre os detalhes para comprovar a acessibilidade; mantem a verificacao de que uma falha local nao pode indicar sincronizado.
- Espera do teste de rede: acrescentada espera limitada pelo estado offline efetivo apos avancar o relogio de teste. Todos os asserts de ausencia de POST, recuperacao, conflito e integridade permanecem identicos.

## Riscos residuais e recomendacao

O reposicionamento DOM do drawer preserva os elementos/handlers, mas e uma mudanca interativa relevante, coberta por regressao e capturas. Existem guardas exatos para o escopo das alteracoes; mudancas futuras exigem atualizar conscientemente esses guardas. Testes usam Chromium e fixtures locais, nao substituem validacao humana em Safari/iOS. Recomenda-se revisao visual da Draft PR e aprovacao separada das pendencias de dados. Nao autoriza merge, deployment ou escrita real.
