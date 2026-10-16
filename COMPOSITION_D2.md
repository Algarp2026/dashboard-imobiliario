# The View: Composicao D2

Conclusao dos restantes modulos e ajustes da auditoria na mesma PR #12:
[COMPOSITION_D2_PLATFORM.md](COMPOSITION_D2_PLATFORM.md). O texto abaixo regista
a primeira etapa auditada em `125cba5`; a galeria dessa etapa foi preservada.

## Base e limites

Branch `codex/composition-d2`, criada de `origin/main` em
`8ba90381db094e105a21e8f48c6c37113676ccd1`, apos o merge da PR #11.
Sem merge, deployment, alteracao de aliases ou acesso a dados de producao.
O deployment Git automatico desta branch esta desativado em `vercel.json`.

## Estrutura por modulo

- Dashboard: quatro indicadores, lista operacional de prioridades e pipeline em
  colunas; recursos financeiros e consultas existentes em paineis recolhiveis.
- Cliente: identidade e proxima acao lado a lado em desktop; cinco separadores;
  acompanhamento e resumo em duas colunas; formulario de Estado do Contacto e
  prioridade recolhido ate ser aberto. Campos, historico e comandos preservados.
- Negociacao: grupos em duas colunas, detalhes inline e oportunidades encerradas
  recolhidas. Valores relevantes no resumo, todos os valores nos detalhes.
  A funcao `opportunityCards()` da PR #11 permanece identica.
- Fracoes/Vendas: contagens por disponibilidade, filtros e colunas agrupados,
  tabela com scroll proprio e ferramentas de gestao no cabecalho contextual.
- Propostas: filtros numa coluna lateral em desktop; grelha ao lado. Em mobile,
  filtros e resultados regressam ao fluxo vertical.
- Agentes, precos, historico, eventos, relatorios, modais e Comparador: mesma
  linguagem de cabecalhos, tabelas, controlos e superficies, sem retirar recursos.

Componentes partilhados: tokens, cabecalho de pagina, indicador KPI, linhas
operacionais, pipeline, navegacao contextual, paineis recolhiveis, tabela e
cartao de oportunidade. Reutilizacao de modais, icones e controlos existentes;
sem framework ou dependencia nova. Os elementos interativos movidos mantem os
seus IDs e handlers.

## Significado dos indicadores

- Disponibilidade e valor disponivel: calculo comercial existente.
- Negociacoes: clientes projetados em negociacao pelo calculo existente, nao
  quantidade de cartoes nem um novo estado persistido.
- Acoes pendentes: clientes ativos com acao global existente por concluir,
  segundo `clientSummaryFollowupInfo`, incluindo acoes futuras e sem data.
- Pipeline: estados globais dos clientes projetados pelo motor existente.
- Prioridades: prioridade manual, resposta nossa pendente ou acao a rever;
  mostra ate seis linhas, com acesso a carteira completa. Na ausencia dessas
  prioridades mostra negociacoes existentes. Nenhum valor de demonstracao
  foi incorporado nos indicadores da aplicacao.

## Validacao

- 32 suites `.test.js` aprovadas, incluindo proveniencia e ciclos da PR #10,
  disponibilidade de terceiros/reapresentacoes da PR #11, preferencias,
  recomendacoes, apresentacoes/contactos, reservas/vendas/comissoes, PDFs,
  concorrencia, sincronizacao e armazenamento em blocos.
- Sintaxe aprovada: commercial.js, commercial-client-workflow-ui.js, app.js,
  config.js.
- Navegador real Chrome: desktop 1440x900, laptop 1366x768, tablet 820x1080,
  mobile 390x844. Cinco separadores, formularios, cancelar, teclado, regresso,
  refresh, filtros, colunas e navegacao entre modulos aprovados.
- Comparacao automatizada antes/depois: mesma fonte ficticia, mesmas dimensoes;
  zero erros JS, falhas de carregamento, overflow da pagina ou gravacoes.
  Cache comercial e revisao identicas depois de consultar/navegar.
- Teste transacional isolado: editar contacto/prioridade, apresentar rascunho e
  realizar sem duplicacao, propostas/contrapropostas, reserva/cancelamento/venda,
  conflito 409 entre sessoes, retencao local numa falha e recuperacao visivel.
  Precos oficiais, clientes alheios e comissoes nao envolvidas preservados.
- Regressao visual PR #11: venda a terceiros, visita sem preco, reapresentacao e
  desistencias globais aprovadas em desktop/mobile. Contraste dos botoes
  verificados entre 6.93:1 e 12.76:1, incluindo hover do Comparador.
- Teste D2 compara literalmente com a base os modulos comerciais protegidos,
  API, Apps Script, dados, configuracao, autenticacao e funcoes criticas.

[Galeria comparativa](docs/composition-d2/README.md).
[Resultados de consulta sem escrita](docs/composition-d2/results.json).

## Reproduzir em ambiente exclusivamente ficticio

```powershell
$env:COMPOSITION_D2_FIXTURE='true'
node tests/helpers/visual-workspace-preview.cjs
```

Noutro terminal, executar `node tests/composition-d2-browser.mjs` com Playwright
disponivel. Pode definir `PLAYWRIGHT_MODULE` e `CHROME_EXECUTABLE`.
Servidor local 5210; acesso ficticio `View-Phase2A-Teste`. Nao carrega ficheiros
de ambiente nem credenciais reais. Dados e gravacoes transacionais em memoria.
O teste de comparacao bloqueia pedidos externos e gravacoes comerciais.

Para a regressao especifica PR #11, reiniciar sem `COMPOSITION_D2_FIXTURE` e com
`VISUAL_AUDIT_FIXTURE=true`; executar `tests/visual-audit-browser.mjs`.
`VISUAL_AUDIT_ARTIFACTS` permite guardar capturas fora da galeria historica.

## Ficheiros e riscos residuais

Aplicacao: `commercial.js`, `commercial-client-workflow-ui.js`, `view-theme.css`.
Configuracao: apenas a exclusao de deployment desta branch em `vercel.json`.
Testes: nova suite D2, comparacao em navegador e fixture; adaptacoes minimas dos
testes existentes para a nova estrutura e diretorios de capturas.
Documentacao: este relatorio e `docs/composition-d2/`.

Nao houve migracao nem alteracao de esquema. Precos, estados, regras comerciais,
API, Apps Script, autenticacao, sincronizacao, backups e PDFs nao foram alterados.
Os calculadores de pricing/compset e os layouts internos de PDFs nao foram
redesenhados: preservar a fiabilidade destas ferramentas tem prioridade.

O tom secundario de referencia #71847A fica reservado a apontamentos;
texto normal usa #586F61 para melhorar contraste. Cores com significado
comercial permanecem reconheciveis por texto, nao apenas por cor.

Validacao feita em Chrome, nao em Safari nem com leitor de ecra. Tabelas largas
mantem scroll horizontal local para preservar os campos. As novas composicoes
usam CSS moderno (`:has`, grid e sticky), como a base existente.
Exige auditoria humana das capturas antes do merge. Nao foi criada preview
remota nem exercitada qualquer ligacao Google real.
