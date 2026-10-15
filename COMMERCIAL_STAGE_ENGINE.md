# Motor de Estados Comerciais

Base: `main` em `403278ed` (PR #9). Branch isolada: `codex/fix-commercial-stage-engine`.
Sem merge, deployment, consulta ou escrita na base comercial real.

## Defeitos e causas

- O resumo percorria acontecimentos sequencialmente: uma desistência da fração B podia substituir a reserva/venda da A.
- `stageRank()` tratava Desistiu como progressão superior; o fallback legado e decisões manuais podiam perpetuar estados sem operação efetiva.
- Frações e Negociação interpretavam tipos e `interest` de maneiras diferentes; uma proposta podia declarar Vendido ou Sem interesse.
- Desempates usavam o índice do array, tornando a conclusão dependente da ordem de inserção.
- A titularidade era inferida automaticamente de eventos antigos e posteriormente gravada, sem proveniência suficiente.
- Reaplicar todo o histórico podia substituir decisões manuais, reservas de outro cliente, preços e comissões sem relação com o evento editado.
- Uma desistência sem frações procurava todas as reservas do cliente e podia ampliar a seleção original.
- A manutenção calculava efeitos depois de eliminar os titulares e não identificava as frações libertadas na confirmação.

## Interpretação única e sem regularização automática

`THE_VIEW_CLIENT_WORKFLOW.clientProjection()` calcula a situação global a partir de `relation()` e `effectiveEffect()`:

1. Venda efetiva confirmada.
2. Reserva efetiva confirmada.
3. Negociação ativa, incluindo aguardar decisão ou aceite.
4. Apresentação realizada.
5. Preferências/interesse qualificado.
6. Novo Lead.

Desistiu não tem posição numérica. Uma desistência específica fecha apenas essa relação. Uma desistência global inequívoca fecha relações não comerciais anteriores; uma negociação posterior pode reabri-las. Não liberta reservas nem reverte vendas. O modal de eventos exige confirmação explícita antes de registar uma desistência global sem frações.

Rejeição mantém a negociação aberta: não significa automaticamente desistência. Aceitação não reserva. Acompanhamento exige escolha explícita entre estados de interesse; não pode declarar Reservado/Vendido. Nos restantes movimentos o resultado decorre do tipo, independentemente de combinações contraditórias antigas.

A disponibilidade deve ser explícita e reconhecida. Para atribuir uma reserva/venda são necessários `statusEventIds`, evento único com tipo e fração correspondentes e cliente existente. Não se infere titularidade de um simples evento histórico. Contradições são sinalizadas para revisão. Uma venda confirmada prevalece sobre movimentos posteriores incompatíveis.

Históricos são ordenados por data, hora, criação, ID e desempate estável de conteúdo, sem índices do array. As decisões manuais são preservadas e identificadas no acompanhamento. Uma desistência manual não esconde uma operação confirmada ou uma negociação ativa. Estados manuais de reserva/venda não inventam uma titularidade.

`clientCommercialProjection()` cria uma vista superficial do cliente; ficha, listagem, filtros, Frações, Negociação, pesquisa, dashboard e quatro modelos de relatório usam essa interpretação. Os bindings de edição continuam a usar o cliente original, não a vista derivada.

O cálculo não grava `stage`, `manualStage`, `legacyStageFallback` nem os eventos. `recalculateResumoCliente()` conserva as funções anteriores de resumo/preferências, mas já não regulariza o estado persistido. Não há migração, rotina em massa ou escrita no arranque.

## Segurança dos efeitos

`commercialTransitionPlan()` valida todas as frações antes de modificar o evento ou a disponibilidade. O plano é aplicado uma única vez, sem repetir a interpretação depois de inserir/remover os eventos.

- Disponibilidade desconhecida, indisponibilidade, venda existente ou titularidade alheia bloqueiam operações incompatíveis.
- Cancelamento/libertação exigem reserva confirmada do cliente na fração indicada.
- Desistência sem frações nunca procura ou liberta reservas de outras frações.
- Edição afeta apenas a união das frações antigas/novas e apenas fontes confirmadas.
- Eliminação calcula o plano antes de remover cliente/evento; a confirmação enumera as frações e verifica se a base mudou durante a confirmação.
- Preço/comissão de outra origem não são apagados. Metadados desconhecidos da comissão do mesmo evento são conservados na edição.
- As verificações existentes de revisão, confirmação, CAS e persistência permanecem. API, autenticação, Apps Script e protocolo de sincronização não foram alterados.

## Matriz automatizada

Todos os casos abaixo usam exclusivamente dados fictícios. Esperado e obtido coincidiram.

| Caso | Esperado | Obtido |
| --- | --- | --- |
| Metadados de preferências vazios | Novo Lead | Novo Lead |
| Reserva A e depois desistência B | Reservado | Reservado |
| Desistência B e depois reserva A | Reservado | Reservado |
| Venda A e desistência B | Vendido | Vendido |
| Negociação A e desistência B | Em negociação | Em negociação |
| Cancelamento da única reserva, sem apresentação | Qualificado | Qualificado |
| Cancelamento de uma de duas reservas | Reservado | Reservado |
| Desistência global explícita, sem oportunidades | Desistiu | Desistiu |
| Desistência global após interesse não comercial | Desistiu | Desistiu |
| Nova proposta após desistência global | Em negociação | Em negociação |
| Rejeição sem desistência | Em negociação | Em negociação |
| Aceitação sem reserva | Em negociação | Em negociação |
| Negociação posterior a venda confirmada | Vendido | Vendido |
| Reserva posterior incompatível com venda confirmada | Vendido + revisão | Vendido + revisão |
| Datas retroativas e empate resolvido por IDs | Qualificado | Qualificado |
| Tipos legados e version 1 com interest contraditório | Em negociação | Em negociação |
| Desistiu manual antigo com reserva confirmada | Reservado + revisão | Reservado + revisão |
| Desistência manual explícita sem oportunidades | Desistiu | Desistiu |
| Desistência manual com venda confirmada | Vendido + revisão | Vendido + revisão |
| Fração desconhecida | Qualificado + revisão, sem operação efetiva | Igual |
| Reserva legada sem identificação de origem | Qualificado + revisão | Igual |
| ID duplicado no evento de origem | Não atribuir titularidade | Igual |
| Venda histórica com disponibilidade atual disponível | Qualificado + revisão | Igual |
| Desistência global legada inequívoca sem fração | Desistiu | Desistiu |
| Todos os cenários acima com array invertido | Mesmo estado | Igual |
| Libertar fração B sem reserva, preservando A | Rejeição atómica | Igual |
| Mover reserva confirmada de 24 para 30 | Só as duas frações afetadas; mesmo evento | Igual |
| Eliminar evento de reserva confirmado | Disponível apenas na fração afetada | Igual |
| Cancelar reserva de outro cliente | Bloqueio sem alterações | Igual |
| Revisão diferente na confirmação | Bloqueio | Igual |
| Eliminar cliente e evento com reserva confirmada | Plano preservado; outra reserva intacta | Igual |
| Base alterada durante confirmação da manutenção | Bloqueio antes da eliminação | Igual |
| Preços/comissões de origem diferente | Bloqueio/preservação | Igual |
| Editar valor de venda do mesmo evento | Metadados de comissão conservados; preço oficial intacto | Igual |
| Reposição com reserva/venda histórica anterior | Bloqueio para revisão, sem inferência | Igual |
| Ficha/listagem e quatro modelos de PDF | Mesma classificação | Igual |
| Leitura e recarregamento | Estado derivado igual, dados persistidos intactos | Igual |

## Validação e reprodução

- `node tests/commercial-stage-engine.test.js`: matriz, adapters reais em VM, manutenção, proteção de dados e zero pedidos/escritas de armazenamento.
- Todas as 27 suites `tests/*.test.js`: aprovadas, incluindo regressões das fases anteriores, armazenamento em blocos, concorrência e sincronização.
- `node --check` em `commercial.js`, módulos workflow/UI, `app.js`, `config.js` e teste de navegador: aprovado.
- Bloco de sincronização de `commercial.js` comparado com `403278ed`: idêntico. Diff de API, server, Apps Script, config, data.json, plantas e middleware: vazio.
- Navegador real em 1440x1000 e 390x844: listagem, ficha, Frações, Negociação, filtros, formulário determinístico, escolha explícita no acompanhamento, cancelar e refresh aprovados. Cache CRM idêntica, zero erros JS e zero pedidos comerciais de escrita.

Para repetir o navegador, iniciar `node tests/helpers/client-stage-preview.cjs` e executar `node tests/commercial-stage-browser.mjs` com Playwright disponível (`PLAYWRIGHT_MODULE` e `CHROME_EXECUTABLE`, se necessários). O servidor usa autenticação de testes e fonte fictícia em memória, sem ficheiros de ambiente reais. O teste bloqueia pedidos não GET, exceto o login local; nunca grava na base comercial. Terminar o servidor após o teste.

## Ficheiros e impacto

- `commercial-client-workflow.js`: projeção pura, ordenação, estados por movimento, proveniência e transições seguras.
- `commercial.js`: consumidores da projeção, cálculo separado da gravação e operações limitadas à origem confirmada.
- `commercial-client-workflow-ui.js`: resultado por movimento, escolha explícita só no acompanhamento, revisão e identificação de decisão manual.
- Quatro testes existentes ajustados às regras novas: workflow, construction, progressive-flow e recommendations-ui. Não foram removidas as verificações de integridade.
- Novos testes `commercial-stage-engine.test.js`, `commercial-stage-browser.mjs` e helper fictício `client-stage-preview.cjs`.
- `vercel.json`: desativa exclusivamente o deployment Git automático desta branch.
- Este relatório.

## Limitações e revisão manual

- Reservas/vendas antigas sem origem confirmada, disponibilidades ausentes, IDs de evento ambíguos, frações desconhecidas e estados manuais incompatíveis exigem revisão. Nenhum desses casos é corrigido ou gravado automaticamente.
- Decisões manuais antigas não possuem necessariamente uma data própria; não se inventa cronologia. O valor fica preservado e divergências ficam visíveis.
- Ao remover/mover um fecho efetivo com outras reservas/vendas históricas anteriores, a operação é bloqueada: não se ressuscita automaticamente uma operação antiga nem se assume qual seria a disponibilidade anterior. Notas continuam editáveis sem reaplicar efeitos.
- Alterações críticas a cancelamentos já efetivados podem exigir revisão, em vez de reconstrução automática de titularidade.
- Uma desistência que inclua frações reservadas e não reservadas não amplia a seleção: para libertar uma reserva é necessário indicar uma operação coerente e confirmar a fração exata.
- Estados apresentados podem diferir do `stage` legado persistido. Qualquer regularização futura requer relatório de diferenças e aprovação específica. Um frontend antigo não recebe esta interpretação nova por simples rollback.
- Os testes não constituem auditoria ou ensaio sobre dados reais. Não houve acesso à Google Sheet, alterações aos clientes reais, preços ou estados das 39 frações, merge ou deployment.
