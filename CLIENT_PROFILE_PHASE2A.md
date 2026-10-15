# Ficha de cliente - Fase 2A

Branch: `codex/client-profile-phase2a`. Base: `codex/client-profile-phase1`, commit `d4a2ff0955a0ab746f0fe960075e0094d19309bf` da PR #3, ainda aberta e sem merge no momento da validacao. A nova PR deve ter como destino **codex/client-profile-phase1**, nao main.

Esta entrega implementa apenas Dados do Cliente e Preferencias. Nao implementa Fase 2B, margem de recomendacoes de 5%, novas apresentacoes ou negociacao por fracao.

## Inspecao e limites

Foram inspecionados AGENTS.md, CLIENT_PROFILE_PHASE1.md, os modais e patches de cliente, eventos/recapitulacao, agentes, pesquisa, relatorios, motor atual de recomendacoes e o fluxo autenticado de persistencia. O armazenamento em blocos, tickets, revisoes, backups e conflitos da fase anterior sao reutilizados.

API, server, google_apps_script.gs, config.js, data.json, plantas, commercial-recommendations.js e app.js nao foram alterados. Nao houve acesso a clientes reais, ficheiros de recuperacao, Google Sheets ou credenciais de producao. Nao houve merge nem deployment.

## Dados do cliente

- Apenas nome obrigatorio. Origem vazia permanece vazia; Novo Lead continua o estado inicial. Dados adicionais, agentes e notas permanecem opcionais e acessiveis no modal existente.
- ID, ID do evento e createdAt sao reservados ao abrir a criacao. O botao fica bloqueado durante a operacao; tentativas repetidas reutilizam o mesmo registo e a persistencia existente, sem criar outro cliente/evento.
- Cliente e um unico Pedido de informacao recebido entram na mesma base enviada para persistencia. Falha ou conflito nao gera mensagem de sucesso partilhado: a copia local e o estado de sincronizacao permanecem explicitos.
- Ao criar cliente dentro de um novo Pedido de informacao recebido, os dados ja escritos no modal do evento sao usados no evento inicial. O modal passa a editar esse mesmo ID, evitando um segundo pedido quando for guardado. Outros tipos de evento continuam pelo fluxo anterior.
- A ficha completa abre depois da criacao fora de um evento. createdAt nao e substituido em edicoes. Clientes antigos nao recebem eventos iniciais retroativos.
- Aviso de possivel duplicado por email/telefone normalizados, com acesso ao cliente existente e possibilidade de criar outro. Nomes iguais nao bloqueiam. Contactos originais nao sao reformatados pela comparacao.
- Edicao de identidade continua a aplicar apenas campos realmente alterados. NIF, agentes, notas, preferencias e campos desconhecidos fora do patch ficam preservados.

## Modelo compativel de preferencias

Os seis campos de texto existentes continuam a ser texto: typology, floor, orientation, objective, decisionTime e summary. Pesquisa, relatórios e o motor atual continuam a consumi-los. T1-Duplex tem projecao textual T1 Duplex, compativel com o parser existente; isto nao altera tipologias reais.

Representacao aditiva, exemplo ficticio:

```json
{
  "preferences": {
    "typology": "T2 ou T2+1",
    "floor": "2 ou 5",
    "orientation": "Sul ou Este",
    "selectionV1": {
      "version": 1,
      "typology": { "state": "selected", "values": ["T2", "T2+1"] },
      "floor": { "state": "selected", "values": ["2", "5"] },
      "orientation": { "state": "selected", "values": ["Sul", "Este"] }
    }
  }
}
```

- unreported: nao informado; indifferent: declaradamente indiferente; selected: uma ou varias opcoes. Indiferente e exclusivo dentro de cada criterio.
- legacy: texto antigo que nao pode ser convertido inequivocamente; mantem valores vazios e legacyText. Nao se deduzem escolhas a partir de frases vagas, intervalos, vista mar ou piso elevado.
- Inferencia de valores inequivocos e feita apenas no rascunho de leitura. Abrir/editar/cancelar sem mudanca nao modifica o JSON nem grava.
- Migracao aditiva sob acao explicita: na primeira gravacao com mudanca real, selectionV1 e acrescentado. Nao existe migracao automatica na inicializacao, nova chave localStorage nem regravacao em massa de clientes.
- preferences e manualPreferences recebem as mesmas escolhas conhecidas consolidadas, conservando separadamente campos desconhecidos de cada objeto. Metadados adicionais existentes continuam preservados.
- Ao substituir explicitamente um texto anterior, o primeiro valor fica em legacyText, consultavel em Textos anteriores preservados. O evento guarda previousPreferences e previousManualPreferences completos; os eventos antigos nao sao reescritos. Varias revisoes posteriores podem ser consultadas no historico/snapshots, nao apenas no primeiro texto arquivado.
- Versao estruturada desconhecida nao e convertida silenciosamente: a gravacao no editor e recusada. Dados legados nao string sao preservados, sem os interpretar como escolhas.
- budget e manualBudget anteriores nao sao alterados pela edicao inline do intervalo. budgetMin/budgetMax mudam apenas quando o utilizador os altera. Inputs opcionais em euros aceitam separadores portugueses; rejeitam valores negativos/invalidos e maximo inferior ao minimo.
- Objetivo, prazo e notas opcionais; valores livres anteriores continuam selecionaveis. O modal antigo permanece funcional para os restantes fluxos, incluindo edicao explicita do antigo orcamento indicativo.
- Mudanca real cria um evento Preferencias recebidas com snapshots; guardar sem mudar nao cria evento nem escrita.

## Persistencia e conflitos

As novas operacoes usam save() e syncRemote() existentes. A mensagem de sucesso partilhado exige confirmacao efetiva e estado synced sem alteracoes pendentes. Falta de ligacao, bloqueio de escrita ou conflito mantem aviso e copia local; falha localStorage tem aviso proprio para manter a pagina aberta e exportar.

O protocolo, autenticacao, loadRemoteData(), save() e syncRemote() nao foram substituidos. A unica extensao da deteccao de regressao reconhece os caminhos conhecidos de selectionV1: version, state, values e legacyText dos tres criterios. E necessaria para aceitar uma edicao remota legitima, incluindo reduzir escolhas, quando a sessao local nao tem alteracoes. Campos desconhecidos e restantes metadados continuam sob a protecao anterior; os testes de 63 clientes contra 24 continuam a passar.

Se o cliente mudar durante a edicao inline, o rascunho nao sobrepoe automaticamente essa alteracao: o utilizador deve cancelar/reabrir. Conflitos reais entre sessoes mantem o fluxo de reconciliacao existente e a verificacao de revisao.

## Ficheiros

| Ficheiro | Motivo |
| --- | --- |
| commercial-client-preferences.js | Modelo puro, inferencia estrita, chips/estados e update compativel |
| commercial.js | Criacao/edicao, editor inline, snapshots, confirmacao de persistencia e caminhos conhecidos de preferencias |
| commercial.css | Chips, intervalo responsivo, aviso de duplicado e dados adicionais opcionais |
| commercial.html | Carrega o helper antes do motor; config.js continua imediatamente antes de commercial.js |
| vercel.json | Desativa deployment Git automatico exclusivamente da nova branch; preserva bloqueio da Fase 1 |
| tests/commercial-client-preferences.test.js | Modelo e compatibilidade com motor atual |
| tests/commercial-client-phase2a-browser.mjs | Fluxos reais do browser e capturas desktop/mobile |
| tests/helpers/client-phase2a-fixture.js | Base de 64 clientes exclusivamente ficticios |
| tests/helpers/client-phase2a-preview.cjs | Servidor local autenticado com armazenamento simulado em memoria |
| tests/commercial-smoke.test.js | Corrige assercao desatualizada de backup, anterior a esta fase, para a implementacao em blocos ja existente; nao altera Apps Script |
| CLIENT_PROFILE_PHASE2A.md e docs/client-profile-phase2a/ | Modelo, reproducao, evidencias e galeria |

## Testes executados

20 suites tests/*.test.js aprovadas, incluindo preferences, client-tabs, progressive-flow, UX, recommendations/UI, reports, followups, construction, sync-client/API, concurrency, write-integrity, chunk-storage, capacity, access-routes, smoke, pricing, compset e google-read-check. Todos usam fixtures/mocks, nunca Google real. node --check passou em commercial.js, app.js, config.js, novo helper, teste de browser e helpers de teste.

Browser real Chromium em 1440x1000 e 390x844, com o HTML/JS, autenticacao e API do repositorio e Apps Script executado na VM de testes:

- Base inicial de 64 clientes, perfis legados, incompletos e indiferentes. Origem vazia, nome apenas, cliente completo, repeticao/double-click, timestamp imutavel e exatamente um evento inicial, incluindo criacao dentro do evento.
- Edicao antiga preserva NIF/agente/notas/metadados. Multi-selecao de tipologias/pisos/direcoes, Indiferente exclusivo, ausencia de preferencia, formato monetario, validacao de intervalo, objetivo/prazo/notas, texto ambiguo preservado e arquivo visivel.
- Gravar/recarregar via API preserva valores. Modal antigo continua funcional. Abrir cinco abas/guardar sem mudanca: zero escritas e JSON local identico.
- Tres sessoes com mesma revisao: A atualiza; C limpa recebe a edicao estruturada sem escrita extra/conflito; B com edicao concorrente recebe 409. Dados de A intactos, alteracoes de B preservadas localmente.
- Falha de gravacao simulada: fonte anterior intacta, alteracao local preservada e indicador offline, sem falso sucesso.
- Navegacao nos restantes modulos, zero erros JavaScript, sem overflow da pagina mobile. Navegacao nao equivale a uma nova auditoria integral de todos os fluxos de cada modulo.
- Comparacao com d4a2ff0 confirmou 12 funcoes identicas: saveEvent, reapplyCommercialEffectsForFractions, reapplyCommercialEffectsAfterEventEdit, exportPdf, generateClientPresentationPdf, generatePriceListPdf, generateClientsSummaryPdf, finalPrice, ensureHistory, loadRemoteData, save e syncRemote.

[Capturas e resultado do browser](docs/client-profile-phase2a/README.md). As imagens reais foram revistas; nao sao mockups.

## Teste local seguro

```powershell
node tests/helpers/client-phase2a-preview.cjs
```

URL local: http://127.0.0.1:5194/commercial.html. Password **exclusivamente de teste**: View-Phase2A-Teste. Este helper nunca deve ser usado como servidor/deployment de producao.

O helper usa cookies/API reais do repositorio, mas identidade e Google totalmente simulados. Define variaveis ficticias apenas no seu processo, nao le env files nem credenciais reais e recusa qualquer destino de fetch fora dos dois enderecos ficticios interceptados. As escritas ficam exclusivamente na VM em memoria; nao existe Sheet real. Todas as paginas comerciais/endpoints de teste exigem sessao. A lista historica hardcoded de importacao e removida apenas da resposta JS de teste; os dados/fontes do repositorio nao sao alterados nesse ponto.

Para repetir o teste de browser: instalar/disponibilizar Playwright e Chromium, iniciar o helper e executar node tests/commercial-client-phase2a-browser.mjs. PLAYWRIGHT_MODULE e CHROME_EXECUTABLE podem apontar para runtimes locais; PHASE2A_ARTIFACTS define a pasta de capturas (default temporaria). O teste cria contextos limpos e recusa hosts externos.

Teste manual: criar cliente com nome apenas, confirmar origem vazia/ficha aberta, completar Dados, editar Preferencias por chips, guardar e recarregar. Usar dois perfis de navegador separados para editar o mesmo cliente antes de guardar: a segunda sessao deve indicar conflito. Reabrir e cancelar sem alterar nao deve gerar novos eventos. Consulta de textos antigos disponivel no separador Preferencias.

## Limites e riscos pendentes

- Validacao exclusivamente ficticia/local. Nao foi validada conectividade, credenciais ou escrita de Google real; nenhuma base real foi migrada.
- Memoria de teste desaparece quando o helper termina/reinicia. O browser de testes limpa apenas o seu contexto isolado. Dados da preview nao sao uma copia da base real.
- selectionV1 e metadado aditivo: consumidores antigos continuam a ler texto. Textos ambiguos exigem decisao humana; nao ha conversao em massa nem novo motor de correspondencias/5%.
- Snapshots aumentam a dimensao do historico; conservam-se limites e armazenamento em blocos existentes, sem alterar capacidade nesta fase.
- O bloqueio de deployment Git desta branch nao impede um deployment manual forcado. Nao executar deployment nem merge nesta etapa.
- Na preview isolada, o link para o comparador publico externo e o logout nao integram a validacao desta fase; a autenticacao de leitura/escrita comercial foi testada. O helper e dedicado aos modulos comerciais, nao uma substituicao do servidor de producao.
