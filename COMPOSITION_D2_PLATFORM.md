# D2: conclusao da plataforma na PR #12

Base desta etapa: `125cba5`, na mesma branch `codex/composition-d2`.
Destino da PR: `main`. Sem merge, deployment ou acesso a Google Sheets real.

## Alteracoes por modulo

| Modulo | Reorganizacao efetiva |
| --- | --- |
| Agentes | Diretorio pesquisavel a esquerda; identidade, contactos e condicoes/atividade separados no detalhe. Selecao por teclado e edicao originais. |
| Precos | Faixa de contexto da consulta, filtros laterais, tabela analitica e historico/evolucao num painel expansivel. Todos os campos editaveis, motivos, ordenacao e exportacao mantidos. |
| Propostas | Coluna de selecao/filtros e comando de documento junto do contador; resultados e cartoes na area principal. |
| Historico | Enquadramento da fracao separado dos movimentos; metadados compactos sem cartoes encaixados, observacoes expansiveis, ligacoes aos eventos originais mantidas. |
| Eventos | Lista cronologica com eixo de datas, pesquisa local, resumo e detalhes expansiveis por registo; edicao/exportacao existentes. |
| Relatorios | Catalogo por tipo de documento/exportacao, mantendo os mesmos botoes e modais; ferramentas administrativas numa seccao propria expansivel. |
| Comparador | Indicadores separados do cabecalho; filtros laterais e inventario analitico ao lado; detalhe, compset e comandos avancados originais. Sem sidebar comercial acrescentada. |
| Preferencias | Resumo agrupado; editor com criterios do imovel separados de investimento/finalidade. Todos os chips e campos originais. |
| Fracoes do cliente | Criterios e selecao numa coluna lateral; filtros, correspondencias/alternativas e pesquisa das 39 fracoes na area principal; associacoes/historico em seccao completa. |
| Apresentacao | Preparacao e precos comunicados ao lado do historico de apresentacoes/documentacao; mesmo formulario e mesmas validacoes. |
| Modais | Cabecalho e acoes persistentes dentro do dialogo, campos agrupados e espacamento partilhado; sem alterar guardar, cancelar, validacoes ou estados de erro. |

Dashboard, Dados do cliente, Negociacao e Fracoes/Vendas da primeira etapa foram
preservados. Em Negociacao, o titulo passa a **Oportunidades**, com contador
separado e comandos contextuais harmonizados.

## Urgencia no Dashboard

Apenas a lista visual do Dashboard recebe ordenacao, numa copia dos resultados
existentes. Ordem: acao vencida; resposta nossa pendente; acao sem data/revisao;
acao nos proximos sete dias; prioridade manual sem urgencia imediata; restante
acompanhamento, quando usado como fallback. Empates por data, sem alterar a
ordem persistida da carteira. Cada linha identifica a categoria de urgencia.
O motor de estados e os valores dos indicadores continuam os existentes.

## Componentes partilhados e ficheiros

`view-workspace.js` compoe apenas o DOM: diretorio pesquisavel, layouts com
coluna contextual, catalogo de exportacoes, cabecalhos/formularios, detalhes e
comandos. Move os nos originais, nao clona controlos nem substitui handlers.
Observacao de insercoes permite compor modais e paineis renderizados novamente;
fica desligada durante a propria composicao para evitar ciclos. Sem rede,
localStorage, acesso ao estado comercial ou persistencia.

- `commercial.html` e `comparador.html`: carregamento do componente partilhado.
- `view-theme.css`: estilos D2 reutilizados e layouts responsivos por modulo,
  exclusivamente em `@media screen`.
- `commercial.js`: apenas selecao/ordenacao visual e etiquetas das prioridades.
- `tests/commercial-d2-platform.test.js`: ordem de urgencia, limites de datas,
  imutabilidade e ausencia de rede/persistencia no componente.
- `tests/composition-d2-platform-browser.mjs`: comparacoes e operacoes de consulta
  antes/depois em navegador real.
- `tests/helpers/client-phase2a-preview.cjs`: permite servir o novo ficheiro
  estatico no servidor isolado, sem mudar as suas protecoes.
- `tests/helpers/d2-synthetic-catalog.cjs`: catalogo ficticio em memoria.
- `tests/composition-d2-history-routing-probe.mjs`: diagnostico de encaminhamento
  antes/depois, com a limitacao preexistente registada separadamente.
- `docs/composition-d2-platform/`: galeria e resultados ficticios.

## Verificacoes

33 suites aprovadas; `node --check` para commercial.js, view-workspace.js,
commercial-client-workflow-ui.js, app.js e config.js.

Regressao de navegador existente aprovada nas quatro dimensoes: todos os
separadores/modulos, preferencias inline, editar/cancelar, teclado, refresh,
regresso, filtros/colunas, alertas offline e modais de relatorios.

Operacoes isoladas aprovadas: contacto/prioridade, rascunho e apresentacao
realizada sem duplicacao, proposta/contraproposta, reserva/cancelamento/venda,
conflito real 409 entre sessoes, falha de escrita com preservacao local e
recuperacao visivel. Precos oficiais e dados nao envolvidos inalterados.

Comparacao visual: antes `125cba5` e depois com a mesma fonte ficticia, em
1440x900, 1366x768, 820x1080 e 390x844. Testes verificam pesquisa, selecao,
filtros, abrir/cancelar editores, paineis expansiveis, refresh, navegacao,
ausencia de overflow horizontal da pagina e de erros JS/carregamento.
As consultas nao alteram cache, revisao nem dados comerciais.

[Galeria completa](docs/composition-d2-platform/README.md).
[Resultados sem escrita](docs/composition-d2-platform/results.json).

## Reproduzir sem dados reais

Usar o servidor ficticio descrito em [COMPOSITION_D2.md](COMPOSITION_D2.md),
com `COMPOSITION_D2_FIXTURE=true` e `D2_SYNTHETIC_CATALOG=true`, porta 5210. Depois executar
`node tests/composition-d2-platform-browser.mjs`; `PLAYWRIGHT_MODULE` e
`CHROME_EXECUTABLE` permitem indicar as dependencias locais.
O acesso `View-Phase2A-Teste` pertence apenas ao servidor ficticio.
O ensaio bloqueia pedidos externos e gravacoes comerciais; nao le ficheiros de
recuperacao ou credenciais de producao. As operacoes transacionais usam somente
a fonte simulada em memoria, separadamente da captura visual.
O catalogo servido como `data.json` e gerado exclusivamente em memoria com
39 unidades e 280 concorrentes ficticios, precos/areas simulados e URLs invalidos
de demonstracao. O `data.json` do repositorio nao e alterado.

## Preservacao e limites

API, Apps Script, autenticacao, sincronizacao, armazenamento, modelo de dados,
motor comercial, classificacao de oportunidades, pricing, recomendacoes,
disponibilidade, reservas, vendas, comissoes, historicos e geracao/conteudo dos
PDFs nao foram alterados. A suite D2 compara estes caminhos protegidos com a
base aprovada. Nao houve migracao nem operacao na fonte real.

Nenhum modulo solicitado fica deliberadamente na composicao antiga. As
ferramentas analiticas internas e os documentos PDF mantem os seus calculos e
conteudos; a reorganizacao incide na navegacao, apresentacao e controlos que
lhes dao acesso. Tabelas extensas conservam scroll local para manter campos.

Chrome validado. Safari e leitores de ecra nao foram ensaiados; a auditoria
humana da galeria continua necessaria. A composicao dinamica depende de
JavaScript, como o CRM existente. Nao foi criada preview remota.

Limite funcional preexistente, nao resolvido nesta etapa visual: abrir no
Historico por Fracao um evento gerido de apresentacao pode deixar o editor sem
visibilidade. Reproduzido com o evento ficticio `visual-present-9` antes e depois
de D2, sem escrita. O formulario abre pela ficha do cliente; o encaminhamento a
partir do Historico exige correcao funcional separada e autorizacao. Nao se
declara aprovado esse percurso especifico.
[Evidencia antes/depois](docs/composition-d2-platform/routing-limit.json),
reproduzivel por `tests/composition-d2-history-routing-probe.mjs` no mesmo servidor
ficticio. A edicao generica de eventos e os editores na ficha foram validados.
