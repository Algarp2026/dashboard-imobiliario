# PR17: consolidacao definitiva do CRM

## Ambito

Branch: `codex/integrate-audited-opportunity-crm`, PR17 existente.
Esta etapa parte de `7a466724533846deb8a374d71cf397d18a5b15e5`; a base de integracao
continua a ser `9ba65b56f01a22fa04c8d89f95811510c3ae3e3d`.

A interface definitiva tem Dados, Procura e Oportunidades. Nao foram reintroduzidos
os cinco separadores. Nao houve acesso a dados comerciais reais, migracao,
alteracao de credenciais, merge ou publicacao.

## Codigo visual retirado

- `renderClientDetail()` passa a construir apenas os tres paineis efetivamente usados.
  Deixa de construir cinco paineis, substitui-los e descartar o seu HTML.
- Retirados `clientNegotiationMarkup`, `clientPresentedFractionsMarkup`,
  `clientSuggestedFractionTiles`, `clientFractionTiles`, `compatibleClientFractions`,
  `clientCompatibilityCriteria`, `clientCompatibilityLabel` e `composeClientWorkspace`.
  Eram exclusivamente os componentes ou parsers do percurso visual descontinuado.
- Retirada a segunda projecao visual `opportunityCards`/`opportunityMarkup` do modulo
  de formularios. O unico quadro normal usa `THE_VIEW_OPPORTUNITIES` e os sete estados.
- O editor historico de movimentos ja nao inclui o quadro antigo, o seletor de
  nova negociacao ou outro historico completo. A apresentacao historica abre apenas
  a edicao necessaria, sem repetir o diretorio de apresentacoes.
- Retirados o botao redundante Abrir ficha completa, listeners sem controlos,
  restauro de scroll de tiles removidos, destino de negociacao generico inexistente,
  ramo compacto que apontava para Follow-up e aliases internos dos separadores antigos.
- Removidas as regras de perfil/quadros antigos em `view-theme.css`,
  `commercial-client-workspace.css` e `commercial.css`.
- A fabrica comercial falha explicitamente se o modulo de oportunidades faltar;
  nao devolve uma interface antiga como fallback. O carregamento exige os renderizadores
  definitivos `dataMarkup`, `opportunityMarkup` e `reviewMarkup`.

Continuam os modelos de dados historicos e os formularios administrativos realmente
usados ao abrir eventos antigos. Esses formularios nao sao uma alternativa ao CRM
normal, nao migram dados e conservam as validacoes de proveniencia e gravacao.
Os modulos de preferencias, recomendacoes e regras comerciais nao foram reescritos.

## Regressoes reais corrigidas

1. **Dados incompletos na UI:** acompanhamento, contacto efetivo, proxima acao/data
   e prioridade estavam guardados, mas inacessiveis no novo painel. Agora estao em
   Dados: proxima acao visivel, ultimo contacto e contactos/acompanhamento expansiveis.
   A prioridade usa uma unica gravacao de acompanhamento, sem um segundo formulario.
2. **Carteira:** voltaram as ordenacoes de contacto recente, sem contacto ha mais
   tempo e proxima acao. O filtro de Estado do Contacto foi ligado a projecao atual,
   juntamente com estado comercial, agente, prioridade e pesquisa.
3. **Apresentacao parcial:** o adaptador so consumia preparacao de eventos no formato
   anterior. Uma apresentacao nova de 24 retira apenas 24 de [9,24,30]. Uma correcao
   append-only ou edicao historica nao volta a consumir a preparacao.
4. **Comunicacao historica:** uma edicao podia ficar recolhida por um estado visual
   anterior, ou existir nos dois paineis. O editor abre em Dados, uma unica vez;
   o detalhe de acompanhamento fica aberto quando existe formulario em curso.
5. **Duplicados:** Criar nova ficha mesmo assim era ignorado quando a criacao sem
   pedido inicial estava ativa. A escolha explicita agora e respeitada. Registar
   pedido no cliente existente abre o evento para confirmacao, sem inventar contacto.
6. **Mobile:** a linha de prioridades usava o segundo span como texto, quando este
   passou a conter icones. O texto agora pode encolher/quebrar e os icones ficam
   com largura estavel, sem ultrapassar o viewport.

## Classificacao das 19 suites

Nenhuma das 19 era integralmente dispensavel: mesmo as suites visuais continham
verificacoes funcionais. Por isso, a classificacao principal e Adaptavel, com
Regressao real onde o percurso demonstrou perda de funcionalidade. Sao obsoletas
as verificacoes de cinco paineis, grupos/seletores antigos e injecao de JS historico,
nao as verificacoes de integridade e funcionamento.

| Suite anteriormente reprovada | Classificacao | Adaptacao/cobertura atual |
| --- | --- | --- |
| commercial-audit-defects-browser.mjs | Adaptavel | Desistencia global, cancelamento e requalificacao confirmada a partir de Dados |
| commercial-stage-browser.mjs | Adaptavel | Estado agregado coerente entre carteira, Dados, Procura e cartao atual; sem escritas de consulta |
| commercial-client-phase2a-browser.mjs | Regressao real / adaptavel | Escolha de duplicados corrigida; criacao sem evento implicito, cliente dentro de evento, preferencias multiplas, metadados, 409 e recuperacao |
| commercial-client-phase2b-browser.mjs | Adaptavel | Recomendacoes, limites, fonte incompleta, selecao, eventos administrativos auditaveis, offline, 409 e conservacao local |
| commercial-client-complete-browser.mjs | Adaptavel, consolidada | crm-reform, contacts, pr6 e complete-exports: criacao, preferencias, movimentos, contactos, fechos, recuperacao e exportacoes |
| commercial-client-complete-exports.mjs | Adaptavel | PDF por oportunidade PT/ENG e PT/FR, preco de apresentacao, plantas, carteira, coluna Estado do Contacto opcional e lista A4 portrait |
| commercial-contacts-browser.mjs | Regressao real / adaptavel | Contactos, correcao manual posterior, preferencias numa resposta, prioridade, proxima acao/data, filtros, concorrencia, falha/retry e refresh |
| commercial-pr6-regression-browser.mjs | Regressao real / adaptavel | [9,24,30] -> apresentar 24 -> [9,30], correcao append-only, repeticao, refresh e comunicacoes retroativas sem apagar decisao posterior |
| commercial-profile-routing-browser.mjs | Adaptavel | Tres modulos funcionais, edicao/cancelamento, refresh, source sem escritas e sete modos de falha explicita de modulos |
| commercial-home-entry-browser.mjs | Adaptavel | /, /index, /index.html, login/retorno, tres separadores, modulos, comparador e nenhuma escrita |
| commercial-client-report-grouping-browser.mjs | Adaptavel | Ordenacao/filtros atuais, contactos opcionais, PDF real, agrupamento, todas as linhas, textos longos, ausencia de paginas vazias/overflow |
| client-workspace-audit.mjs | Adaptavel | Fechar A -> Novo Evento sem cliente, escolha explicita B, contactos compactos e refresh sem afetar A |
| client-workspace-browser.mjs | Regressao real / adaptavel | Ordenacoes restauradas, filtros, quatro viewports, navegacao, origem agente/dashboard, foco, cancelamento, draft e refresh |
| client-workspace-dialogs.mjs | Adaptavel | Pilha cliente/agente, Escape, inert/foco, PDF, formulario ocupado, draft por cliente e regresso ao historico |
| composition-d2-browser.mjs | Adaptavel, consolidada | platform, workspace e visual-audit: metricas/pipeline, inventario/colunas, teclado, quatro viewports, comparador e cache/revisao intactas |
| composition-d2-platform-browser.mjs | Adaptavel | Modulos atuais em quatro viewports; filtros, agentes, precos, eventos, historico, exportacoes, comparador e cancelamentos sem escrita |
| visual-audit-browser.mjs | Adaptavel | Venda a terceiro, visita sem preco, reapresentacao, origem/data da desistencia global, contraste e rastreabilidade |
| visual-workspace-browser.mjs | Adaptavel, consolidada | workspace, dialogs, profile-routing e visual-audit: estrutura atual, seguranca de modulos, foco/scroll, projecao, contraste e consulta sem escrita |
| visual-workspace-transactions.mjs | Adaptavel, consolidada | crm-reform, safety e contacts: apresentacoes, rondas, reserva/cancelamento/venda/comissao, 409, falha de escrita e preservacao local |

### Retirada de quatro ficheiros duplicados

Foram removidos os quatro scripts classificados como consolidados na tabela, nao
as suas verificacoes funcionais. As substituicoes sao obrigatorias no catalogo
habitual e estao declaradas em `tests/helpers/browser-suite-policy.cjs`.
`commercial-browser-policy.test.js` verifica que as substituicoes continuam
presentes e que quota, pedidos pendentes, concorrencia e relatorios nao desaparecem.
Pedir explicitamente uma suite retirada produz uma mensagem com as substituicoes;
nunca produz um resultado PASS simulado.

Foram retiradas as injecoes de ficheiros JS antigos e capturas before da arquitetura
descontinuada. Os testes de sintaxe e o catalogo ja nao dependem desses ficheiros.
As assercoes de contactos/estados comerciais mudam apenas o percurso ou a forma de
apresentacao. Uma selecao agora cria um evento administrativo auditavel: o teste
verifica o novo evento e preservacao dos originais, em vez de exigir silencio.

O teste adicional `commercial-followup-layout-browser.mjs` tambem foi adaptado:
montava `.ux-opportunity-detail`, que ja nao existe. Agora monta o acompanhamento
de Dados e mantem alinhamento etiqueta/texto, limites do bloco e ausencia de
overflow em 1440, 390 e 320 px. Nao se repuseram regras CSS para a classe antiga.

## Continuidade funcional e protecoes

Ficheiros de produto alterados nesta etapa:

| Ficheiro | Motivo |
| --- | --- |
| commercial.js | Render/navegacao de tres paineis, filtros/ordenacoes, preparacao parcial e escolha de duplicados |
| commercial-opportunity-ui.js | Acompanhamento em Dados, um unico editor de comunicacao e historico contextual |
| commercial-client-workflow-ui.js | Sem fallback ou quadro antigo; formularios realmente usados na edicao historica |
| commercial.css | Retirada de regras exclusivas de controlos/cartoes removidos |
| commercial-client-workspace.css | Retirada de regras do perfil e paineis antigos |
| view-theme.css | Retirada de estilos sem consumidores e correcao do flex de prioridades mobile |

Os restantes ficheiros alterados sao testes, politica do catalogo, este relatorio,
referencias documentais e evidencias visuais ficticias.

- Dados: proxima acao e data, conclusao da acao, ultimo contacto efetivo, comunicacao
  recebida/enviada, correcao manual e prioridade; datas retroativas nao apagam decisoes.
- Procura: selecao multipla/Indiferente, investimento, textos historicos preservados,
  fonte confirmada, alternativas +5%, consulta de 39 fracoes e preparacao.
- Oportunidades: movimentos independentes, precos comunicados, rondas/decisoes,
  correcao append-only, recusas, ciclos, fechos, reservas, vendas e comissoes.
- Carteira, agentes, historico, PDFs e relatorios continuam ligados ao mesmo modelo.
- CAS, tickets, B5/B6, IDs, recibos, backup/blocos, IndexedDB, quota, timeouts,
  reconciliacao e bloco frontend de persistencia permanecem preservados por testes.
- `api/commercial-data.js`, `server/commercial-store.js`, `google_apps_script.gs` e
  `google_commercial_integrity.gs` nao foram alterados nesta consolidacao.
- O bundle continua gerado a partir dos modelos/validador partilhados. A publicacao
  futura exige os DOIS ficheiros .gs na mesma versao/projeto: validacao sob o lock
  autoritativo, depois de CAS e antes de B5 e da primeira mutacao. A API exige
  `commercialIntegrity:1`; sem kernel a escrita falha fechada.

## Resultados finais

Execucao final de 22/10/2026, exclusivamente local e com bases comerciais ficticias:

- **51/51 suites Node aprovadas**, incluindo o catalogo anterior, protecoes de fonte
  e a nova politica de cobertura. Inclui 15 adulteracoes rejeitadas na API, CAS,
  interrupcoes, recuperacao do Apartamento 16, quota, rollback e modelos comerciais.
- **23/23 suites Chrome aprovadas**, no catalogo atual completo, sem exclusoes
  dinamicas, skips ou simulacao de resultados. Inclui os quatro viewports
  1440x900, 1366x768, 820x1080 e 390x844; o teste CSS adicional tambem cobre 320 px.
- **117 ficheiros JavaScript/TypeScript e 2 Apps Script passaram sintaxe**.
- Paridade do bundle Google confirmada pelo gerador em modo --check.
- Bloco frontend PR14/15/16 identico a main publicada; kernel, API, transporte,
  modelos comerciais, configuracao, catalogo e plantas nao mudaram nesta etapa.
- PDFs reais e pre-visualizacoes: PT/ENG, PT/FR, preco de apresentacao, plantas,
  lista portrait, agrupamento, linhas longas e ausencia de paginas vazias/cortadas.
- Zero erros JavaScript nos percursos normais. Consulta/navegacao nao escreve;
  operacoes de teste e falhas ficam na fonte ficticia em memoria.
- Capturas atualizadas e inspecionadas visualmente; sem acesso Google real ou deploy.

Evidencias legiveis por maquina:
[Node](docs/crm-opportunity-integration/consolidation-node-results.json) e
[browser](docs/crm-opportunity-integration/consolidation-browser-results.json).
Os resultados historicos de 7a46672 permanecem no relatorio anterior; nao foram
reclassificados retroativamente como aprovados.

Comandos de reproducao:

    node tests/commercial-client-complete-regression.cjs
    node tests/commercial-browser-regression.cjs
    node scripts/build-commercial-integrity.js --check

O runner browser exige origem loopback 53000..53999, Chrome e Playwright locais,
fonte ficticia em memoria e bloqueio de rede externa. Encerrar os servidores faz
parte do runner. Nao usar a preview de producao ou variaveis Google reais.

## Riscos residuais

Nao ha ensaio Google real nesta tarefa. A aprovacao tecnica local nao autoriza
merge, deploy ou publicacao Apps Script. A publicacao coordenada deve ser validada
numa Sheet independente ficticia, incluindo compatibilidade/capacidade do kernel.
Rascunhos de formulario ainda nao guardados continuam em memoria; nao sao prometidos
apos encerrar o navegador. Dados aplicados localmente usam a recuperacao PR15.
Dados historicos ambiguos permanecem sinalizados, sem regularizacoes automaticas.

Galeria: [capturas atuais](docs/crm-opportunity-integration/README.md).
