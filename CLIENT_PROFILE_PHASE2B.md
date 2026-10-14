# Fase 2B: recomendações e seleção de frações

Branch: `codex/client-profile-phase2b`. Base: `codex/client-profile-phase2a`, commit `aff9b2560ddd69ee029c678463be9998abfdd01d`. Destino da PR: `codex/client-profile-phase2a`.

O separador Frações da ficha completa passa a apresentar correspondências principais, alternativas explicadas e consulta manual das 39 frações. A seleção guardada continua a ser a preparação existente para Apresentação. Esta fase não cria apresentações realizadas, propostas, reservas, vendas ou novos eventos.

## Fontes e confirmação comercial

- Características reutilizadas: `state.fractions`, `getF()` e `commercialRecommendationInput()`. Nenhuma segunda tabela de apartamentos, orientações ou preços foi criada.
- A cadeia original de `finalPrice()` é `finalPrices[number] || SUG[number] || f.price`. A função permanece inalterada. Neste separador, só é chamada para apresentar um preço quando existe um valor próprio, positivo e finito em `state.data.finalPrices`.
- Preço técnico `SUG`, PVP original, preço-alvo e preço comunicado anteriormente não são apresentados como preço comercial confirmado. Sem preço explícito, aparece "Preço comercial não confirmado".
- `statusOf()` mantém o comportamento anterior nos restantes módulos. Aqui, a disponibilidade só é confirmada quando existe um estado explícito reconhecido em `state.data.statuses`; ausência de estado não significa Disponível.
- Preços e estados exigem uma fonte verificada, sincronizada, sem alterações pendentes nem operação em curso. Em conflito, falha ou ausência de confirmação, os valores existentes são identificados como cópia local por confirmar e deixam de alimentar recomendações normais.
- A referência é a última base carregada e confirmada, não uma garantia de disponibilidade em tempo real. O detalhe de fração mostra a data da última leitura quando conhecida.

## Regras determinísticas

O novo módulo puro `commercial-fraction-recommendations.js` reutiliza o modelo e o interpretador de preferências da Fase 2A. Não escreve dados.

1. `selectionV1` distingue selecionado, Indiferente e Não informado. Texto legado inequívoco pode ser interpretado pelo helper existente, sem conversão persistida. Texto ambíguo, versão desconhecida ou intervalo inválido exige confirmação humana; a consulta manual mantém-se disponível. Notas livres não são analisadas.
2. Correspondências principais respeitam todos os critérios expressos. Tipologias, pisos e orientações múltiplas são alternativas aceitáveis (OR). Sul/Este, Sul/Oeste e Este/Oeste são compatíveis com a preferência Sul ou Este. Piso ou orientação desconhecidos não recebem uma justificação de correspondência nesse critério.
3. Alternativas admitem piso/orientação diferentes, T1 <-> T1+1, T2 <-> T2+1 e preço até 5% acima do máximo declarado. T1-Duplex e T3 não ganham relações implícitas com outras tipologias.
4. O mínimo é sempre respeitado. O máximo declarado limita as correspondências principais. O teto de alternativas é calculado em cêntimos: 750.000 EUR permite até 787.500 EUR, mas não 787.500,01 EUR. Sem máximo não se inventa teto nem tolerância.
5. Política conservadora para dados antigos: se `budgetMax` não existir, um `budget` positivo é apresentado como "Orçamento legado (limite)", sem tolerância de 5%. Um `budgetMax` explicitamente removido/zero não reativa o orçamento legado. O utilizador pode confirmar o intervalo no editor de Preferências existente.
6. Apenas Disponível com preço e estado confirmados entra nas recomendações normais. Os dois grupos não contêm duplicações.
7. Dentro de cada grupo, a ordenação é lexicográfica: tipologia pretendida, cumprimento do orçamento, número de critérios piso/orientação respeitados, menor número de desvios, menor preço e número da fração. Não há pesos ocultos ou texto gerado por IA.

Os cinco filtros são Todas, Correspondências principais, Alternativas próximas, Dentro do orçamento e Até +5%. Os filtros dependentes de orçamento ficam desativados quando esse limite não está informado. A pesquisa manual aceita número, tipologia, piso e orientação e inclui todas as 39 frações, mesmo fora dos limites de recomendação.

## Seleção e integração

- Funções existentes reutilizadas: `presentationSelection()`, `updatePresentationSelection()`, `consumePresentationSelection()` e `openPresentationSelectionModal()`.
- Há uma única lista persistida: `client.presentationSelection`. O rascunho de edição existe apenas em memória e não é serializado no contexto de navegação nem numa segunda chave de armazenamento.
- Selecionar/retirar vários apartamentos não grava por si só. Guardar reutiliza `persistClientChange()`, `save()` e `syncRemote()`. Cancelar não grava; guardar sem alterações não cria uma operação remota.
- Novas inclusões de Reservado, Vendido, Indisponível ou estado não confirmado exigem confirmação explícita. A confirmação só autoriza a inclusão preparatória. O estado global e as autorizações comerciais permanecem intactos.
- Antes de guardar, a seleção original é novamente comparada e as inclusões são verificadas. Revisão, conflito 409, confirmação efetiva e preservação local continuam a ser tratados pelo protocolo existente.
- O separador Apresentação e o modal antigo mostram a mesma seleção. Apenas os rótulos de preço/estado da preparação passam a usar a mesma confirmação de origem. Formulários, PDFs e eventos existentes permanecem operacionais e inalterados.
- Se uma fração selecionada mudar de estado, mantém-se na seleção com aviso. Nenhum histórico é removido. Guardar preferências recalcula recomendações, sem reescrever a seleção.
- A listagem mantém a experiência anterior; a ligação "Abrir recomendações" abre o separador Frações da ficha completa. O motor anterior de próximas ações/relatórios (`commercial-recommendations.js`) permanece inalterado. As regras da Fase 2B são exclusivas deste novo espaço de decisão.

## Ficheiros

| Ficheiro | Alteração |
| --- | --- |
| `commercial-fraction-recommendations.js` | Motor puro de perfil, correspondências, alternativas, ranking, filtros e pesquisa |
| `commercial.js` | Adaptador de origem, interface Frações, rascunho e gravação através do fluxo existente; confirmação de rótulos na preparação |
| `commercial.css` | Estilos limitados às novas áreas e adaptação mobile |
| `commercial.html` | Carregamento do novo módulo após o helper de preferências |
| `vercel.json` | Desativa deployments Git automáticos exclusivamente da nova branch |
| `tests/commercial-fraction-recommendations.test.js` | Regras, limites, compatibilidade, ordenação e ausência de mutações |
| `tests/commercial-client-phase2b-browser.mjs` | Fluxos reais desktop/mobile, persistência, falhas, concorrência e capturas |
| `tests/helpers/client-phase2b-fixture.js` | 64 clientes fictícios, características das 39 frações e condições comerciais fictícias |
| `tests/helpers/client-phase2b-preview.cjs` | Servidor local isolado da Fase 2B |
| `tests/helpers/client-phase2a-preview.cjs` | Reutilização do servidor de testes, novo asset e controlo de alterações fictícias |
| `tests/commercial-client-phase2a-browser.mjs` | Permite executar a regressão em outra porta local isolada |
| `CLIENT_PROFILE_PHASE2B.md`, `docs/client-profile-phase2b/` | Regras, reprodução, relatórios e capturas |

## Validação realizada

- As 21 suites `tests/*.test.js` passaram, incluindo Fase 2A, motor anterior, relatórios, armazenamento em blocos, backups, proteção de regressão e concorrência.
- Sintaxe validada com `node --check` em `commercial.js`, `app.js`, `config.js`, novo módulo e scripts de testes alterados/criados. `git diff --check` sem erros.
- Browser real com API/autenticação da aplicação e Apps Script executado numa VM com armazenamento em memória. Dados iniciais: 64 clientes fictícios e 39 frações estruturais; condições comerciais exclusivamente fictícias. Nenhum pedido ao ambiente de produção.
- Seleção múltipla, consulta manual, confirmação de indisponíveis, cancelamento, ausência de gravação por navegação, gravação sem alterações, refresh, modal anterior e mesma seleção em Apresentação passaram. A seleção não criou eventos nem alterou preços, estados, preferências ou metadados comerciais.
- Alteração de preferências recalculou resultados. Mudança fictícia de estado manteve o apartamento selecionado com aviso. Falha de leitura retirou a confirmação comercial; recuperação voltou a usar a fonte.
- Concorrência: sessões partem da mesma revisão; A guarda; uma sessão limpa recebe a atualização; B recebe HTTP 409, conserva a sua seleção local e não altera a gravação de A. Falha de escrita preserva a seleção local sem falso sucesso.
- Regressão completa do browser da Fase 2A passou: criação simples/completa/dentro de evento, evento inicial único, edição, preferências, campos desconhecidos, refresh, atualização entre navegadores, conflito e falha de escrita.
- Desktop 1440x1000 e mobile 390x844: zero erros JavaScript e sem overflow horizontal da página. As barras e os separadores existentes permanecem acessíveis.

Comparação de fonte com `aff9b25`: 22 funções preservadas integralmente, incluindo `saveEvent`, reaplicação dos efeitos comerciais, três geradores PDF, `exportPdf`, `finalPrice`, `statusOf`, as três funções de seleção, `commercialRecommendationInput`, `loadRemoteData`, `sharedStoreMayRegress`, `save`, `syncRemote`, criação/edição de cliente e gravação de preferências. O renderizador do indicador de sincronização apenas chama a atualização visual das condições; o protocolo não foi alterado.

[Galeria e relatórios de validação](docs/client-profile-phase2b/README.md).

## Reprodução local

1. Executar `node tests/helpers/client-phase2b-preview.cjs`.
2. Abrir `http://127.0.0.1:5195/commercial.html`. Password exclusivamente fictícia do servidor de testes: `View-Phase2A-Teste`.
3. Abrir Cliente de demonstração 01 e Frações. Comparar principais/alternativas, consultar manualmente Apt. 30, selecionar vários e guardar. Recarregar e confirmar a mesma seleção em Apresentação.
4. Executar `node tests/commercial-fraction-recommendations.test.js` e, com Playwright/Chrome disponíveis, `node tests/commercial-client-phase2b-browser.mjs`. `PLAYWRIGHT_MODULE`, `CHROME_EXECUTABLE` e `PHASE2B_ARTIFACTS` permitem apontar dependências e saída locais.
5. Para repetir a regressão Fase 2A em paralelo, iniciar o helper Fase 2A com `PHASE2A_TEST_PORT=5196` e executar o respetivo browser com `PHASE2A_TEST_ORIGIN=http://127.0.0.1:5196`.

O helper substitui as chamadas Google por uma VM em memória, recusa outros destinos e não lê ficheiros de credenciais. O teste de browser bloqueia hosts externos. Os controlos fictícios exigem sessão e origem local; não foram acrescentados à API da aplicação. Reiniciar o helper repõe a base fictícia. As credenciais acima não funcionam em produção.

## Verificação de cobertura antes da publicação final

Procedimento administrativo proposto, exclusivamente de leitura. Não foi executado contra produção nesta revisão. Não exige publicar a Fase 2B, criar um endpoint, modificar variáveis de produção ou ativar gravações.

1. Um responsável autorizado confirma a origem e a versão de API/Apps Script efetivamente publicadas. A implementação auditada de `GET /api/commercial-data` chama apenas `crmRead`; esta lê a versão ativa em blocos, valida a integridade e usa `Store!B2` apenas quando não há versão ativa. Não usar as folhas espelhadas, o Web App legado, dados em cache ou apenas B2 como substituto dessa leitura.
2. Efetuar a consulta num processo administrativo controlado, sem carregar `commercial.html`/`commercial.js`, sem localStorage e sem tarefas automáticas do CRM. Usar a autenticação existente, sem colocar cookies, passwords ou tokens no comando, histórico, relatório ou repositório. Restringir o cliente de diagnóstico a GET no endpoint comercial e não seguir redirecionamentos. Não chamar POST comercial, `crmWrite`, `crmRecover`, `testWrite`, gravação, migração ou sincronização da aplicação.
3. Exigir resposta bem-sucedida, JSON válido, `ok: true`, `source: shared`, protocolo `tv-cas-v1`, revisão válida e `confirmedAt` válido. Erros de autenticação, origem, integridade, base não inicializada ou resposta parcial tornam a verificação inconclusiva. Nunca substituir uma falha por dados locais ou por um resultado "0/39".
4. Processar a resposta apenas em memória. Projetar por lista explícita de campos permitidos: para cada número de 1 a 39, consultar somente `data.finalPrices[n]` e `data.statuses[n]`. Não percorrer, imprimir, exportar ou contar clientes, eventos, agentes, comissões, notas ou restantes campos. Não guardar a resposta integral, capturas da resposta, HAR, tickets, logs de HTTP ou ficheiros temporários com a base.
5. Preço coberto significa chave própria existente e valor convertido em número finito e positivo, exatamente como o adaptador da Fase 2B. Separar ausência de chave de valor inválido/zero; não usar `SUG`, PVP base, preços de venda ou preços apresentados como preenchimento. A verificação de cobertura não certifica se o montante está comercialmente correto; essa confirmação compete ao responsável de preços.
6. Estado coberto significa chave própria com um dos valores exatos: Disponível, Reservado, Vendido ou Indisponível. Separar ausência e valor não reconhecido; não inferir Disponível. Validar também que a lista estrutural contém exatamente os números 1 a 39, sem repetição. Chaves comerciais fora desse conjunto contam como anomalia; não imprimir chaves arbitrárias nem os seus valores.
7. Emitir apenas um relatório mínimo: data/hora, commit verificado, revisão, total esperado (39), número de preços válidos/ausentes/inválidos, número de estados válidos/ausentes/inválidos, contagem de cada estado, cobertura conjunta e números das frações incompletas. Uma tabela opcional deve limitar-se a `Apt.`, `preço: válido/ausente/inválido`, `estado: reconhecido/ausente/inválido` e `cobertura conjunta: sim/não`. O relatório não precisa de montantes, nomes ou identificadores de clientes.
8. Repetir uma leitura no final e comparar a revisão. Se mudou durante a verificação, identificar o relatório como desatualizado e repetir sobre uma base única; não reconciliar nem gravar. Mesmo com revisão igual, o resultado é uma fotografia dessa revisão, não uma garantia permanente de disponibilidade.
9. Antes da publicação final, procurar 39/39 preços válidos e 39/39 estados reconhecidos, ou registar explicitamente as lacunas aceites pelo responsável. Uma fração sem confirmação ficará fora das recomendações normais; reservadas, vendidas e indisponíveis contam como estados corretamente preenchidos, mas não como stock disponível. Não preencher lacunas automaticamente. Qualquer correção de dados terá de ser uma intervenção posterior autorizada.

**Privacidade e alcance:** o endpoint existente devolve o JSON comercial completo ao processo autenticado. Por isso, esta via evita divulgação através de projeção imediata em memória e ausência de logs/exports; não oferece minimização do payload recebido. Se a exigência for que o próprio processo de auditoria nunca receba campos de clientes, será necessário aprovar separadamente uma leitura agregada na origem. Não foi criado esse mecanismo nesta intervenção. O POST interno para OAuth/Apps Script Execution API é transporte da leitura `crmRead`, não uma gravação na Sheet; não o confundir com POST comercial de guardar.

Reprodução prévia: validar o procedimento e o formato do relatório numa fonte fictícia isolada com frações completas, preços ausentes/inválidos, estados ausentes/inválidos e mudança de revisão. O relatório sanitizado deve ser revisto antes de ser partilhado; a base integral não deve ser anexada à PR.

## Limitações e revisão

- Um estado/preço ausente precisa de confirmação na fonte comercial. O novo separador não preenche esses dados nem interpreta os fallbacks como confirmação.
- Texto legado ambíguo requer decisão humana. O orçamento antigo não recebe automaticamente o novo significado de máximo com tolerância.
- O rascunho ainda não guardado não sobrevive a refresh; a seleção guardada sobrevive através da persistência existente. Em conflito/falha, a alteração fica local e exige a resolução já disponível na aplicação.
- A prova cobre a aplicação e o protocolo contra uma fonte simulada isolada, não uma Google Sheet real. A preview é local, temporária e dedicada aos fluxos comerciais testados.
- Nenhuma migração, mudança de chave, acesso à base real, alteração de API/Apps Script/autenticação, merge ou deployment foi efetuado. Fases 2C e 2D ficam pendentes de validação.
