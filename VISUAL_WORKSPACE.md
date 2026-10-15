# Modernizacao visual global e CRM

Base: `main` em `fb77666`. Branch: `codex/visual-crm-unification`. Entrega exclusivamente para revisao; nao fazer merge nem promover deployments nesta etapa.

## Alteracoes por area

- Tema partilhado `view-theme.css`, carregado pela Versao Comercial e pelo Comparador: tipografia, cores neutras, selecao verde, campos, tabelas, botoes, modais, alertas e superficies consistentes com a sidebar. Fotografia de Olhao preservada e cabecalho reduzido.
- Navegacao principal unica na sidebar, incluindo acesso explicito a Eventos. A antiga subnavegacao continua no DOM para compatibilidade, sem duplicar a interface. Ferramentas de gestao permanecem num menu recolhido fora da ficha completa.
- Listagem preserva pesquisa, filtros, selecao, scroll independente, criacao e contacto. O resumo PDF permanece em Relatorios. Agentes, relatorios e ferramentas administrativas deixam de ocupar a barra contextual do cliente.
- Ficha completa com uma acao principal Editar cliente no cabecalho, contactos/origem secundarios e uma unica proxima acao global. Cinco separadores preservados; informacao complementar e ferramentas em secoes recolhidas.
- Sincronizacao: apenas apresentacao do indicador. Quando sincronizado e com escrita permitida, detalhes repetidos ficam recolhidos e podem ser abertos pelo indicador. Falhas, conflitos, operacoes pendentes e avisos de escrita desativada permanecem visiveis. Protocolo e recuperacao inalterados.
- Negociacao em cartoes agrupados: ativas, interessados, apresentados, operacoes concluidas e encerradas. Expansao inline mostra precos, cronologia original, revisao e Registar movimento. Historico completo recolhido, sem acompanhamento geral duplicado.

## Apresentacao para negociacao

- Selecao manual, associacao, documentacao ou rascunho isolados nao criam cartoes.
- Apresentacao realizada e registos historicos comerciais validos criam uma unica oportunidade por fracao. Uma apresentacao nao se torna automaticamente negociacao ativa.
- Propostas, contrapropostas, interesses e efeitos de fecho utilizam o motor existente; nenhum estado derivado pode ser editado diretamente pelos cartoes.
- Requalificar o cliente nao reabre cartoes encerrados sem movimento valido posterior. Reservas/vendas efetivas preservam precedencia. Historico anterior continua consultavel, sem inventar apresentacoes retroativas.
- Disponibilidade global permanece um campo distinto da oportunidade daquele cliente. Registos incompletos mantem alertas de revisao; nao sao corrigidos silenciosamente.
- Nenhuma alteracao ao modelo persistido, precos, comissoes, reservas, vendas, prioridade, backups, autenticacao ou API. Sem migracao.
- Correcao minima identificada no teste de cliente incompleto: os adaptadores de apresentacao/contacto preservam a ausencia de `budget`/`preferences` em vez de introduzir propriedades `undefined` apos recalcular o resumo. Evita uma diferenca infinita entre o estado em memoria e o JSON confirmado. Nao altera valores existentes nem o protocolo de sincronizacao.

## Ficheiros

- Interface: `commercial.js`, `commercial-client-workflow-ui.js`, `commercial.html`, `comparador.html`, novo `view-theme.css`.
- Seguranca de publicacao: `vercel.json`, apenas desativacao do deployment Git automatico da nova branch.
- Testes: `tests/commercial-opportunity-cards.test.js`, regressao de campos opcionais em `tests/commercial-client-workflow.test.js`, `tests/visual-workspace-browser.mjs`, `tests/visual-workspace-transactions.mjs`, `tests/helpers/visual-workspace-preview.cjs` e inclusao do CSS na allowlist do servidor ficticio existente.
- Evidencias: este relatorio e [galeria antes/depois](docs/visual-workspace/README.md).

## Reproducao segura

Usar Node e Playwright/Chrome instalados localmente. Nao carregar ficheiros `.env` ou copias reais da base.

```powershell
node tests/helpers/visual-workspace-preview.cjs
```

Servidor apenas em `http://127.0.0.1:5210/commercial.html`, password ficticia `View-Phase2A-Teste`. Auth/API/Apps Script reais do repositorio trabalham com adaptador Google simulado e armazenamento em memoria. A saida de rede externa do backend e recusada. Sem gravacao de JSON de clientes no disco.

Noutro terminal, com `PLAYWRIGHT_MODULE` e `CHROME_EXECUTABLE` apontados para as instalacoes locais, executar:

```powershell
node tests/visual-workspace-browser.mjs
node tests/visual-workspace-transactions.mjs
node tests/commercial-opportunity-cards.test.js
node --check commercial.js
node --check commercial-client-workflow-ui.js
```

O teste visual recria as imagens da galeria. O transacional grava apenas na memoria da fonte ficticia. Reiniciar o servidor limpa todas essas gravacoes. Nunca apontar os testes para dominios remotos.

## Resultados

- 31 suites `tests/*.test.js` aprovadas, incluindo protecoes da PR #10, concorrencia, armazenamento em blocos, contactos, selecao, preferencias, recomendacoes e PDFs.
- Validacao de sintaxe aprovada para `commercial.js`, `commercial-client-workflow-ui.js`, `app.js`, `config.js` e os novos testes.
- Chrome real em 1440 x 900, 1366 x 768, 820 x 1080 e 390 x 844: cinco separadores, editor multiplo, edicao/cancelamento, retorno e refresh, modulos comerciais, menus, teclado, sticky sem sobreposicao e ausencia de overflow horizontal da pagina.
- Navegacao fotografada: zero POSTs comerciais, cache comercial identica, zero erros JavaScript ou falhas inesperadas de carregamento. Falha de leitura simulada manteve a copia local e os comandos de recuperacao visiveis.
- Transacoes ficticias: rascunho sem oportunidade, realizacao do mesmo evento sem duplicacao, proposta/contraproposta, reserva, cancelamento e venda com atualizacao dos cartoes.
- Duas sessoes com a mesma revisao: primeira gravacao aceite, segunda devolveu 409; fonte da primeira intacta, alteracao da segunda preservada localmente. Falha de gravacao manteve o evento local e o alerta de recuperacao.
- Precos oficiais/historicos, clientes/eventos nao envolvidos e comissoes das outras fracoes permaneceram iguais no teste transacional. Alteracoes de estado na simulacao limitaram-se a operacao ficticia explicitamente testada.
- Comparacao de fonte confirmou nove funcoes de protecao comercial, sincronizacao e PDFs identicas a `fb77666`. API, Apps Script, motor comercial, dados e plantas nao foram alterados.

## Limites

- Validacao local com Chrome: nao substitui aprovacao humana nem valida Safari/iOS ou tecnologias de assistencia de forma exaustiva.
- Eventos legados ambiguos continuam sujeitos a revisao pelas protecoes comerciais existentes; nenhum dado foi regularizado nesta entrega.
- O tema adicional deve acompanhar os dois HTML no mesmo deployment futuro. Nao afeta as folhas de estilo autonomas dos PDFs nem regras de impressao.
- Nao houve leitura/escrita na Google Sheet real, migracao, merge ou deployment de producao.
