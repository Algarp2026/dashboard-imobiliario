# Conclusão integrada da ficha comercial

Branch: `codex/client-profile-complete`. Base: `codex/client-profile-phase2b`, commit `5582825fb27555b336ac5495e4bd3ddb9503c3ad`.

Uma única entrega para os cinco separadores. Destino da PR: `codex/client-profile-phase2b`, nunca `main`. Sem merge, deployment, dados pessoais reais ou operações na fonte de produção.

## Decisões atualizadas: contactos e carteira

Esta secção substitui a gestão diária centrada nos prazos e escalas automáticas descrita nos documentos anteriores. Datas de próximas ações continuam opcionais e os respetivos dados históricos não são removidos.

- **Estado Comercial** mantém os estados existentes. **Estado do Contacto** é independente: Resposta nossa pendente, A aguardar cliente, Em acompanhamento ou Sem contacto.
- A ficha permite corrigir manualmente o Estado do Contacto. O recálculo de resumos não o substitui. Uma nova comunicação permite escolher explicitamente o estado após essa interação.
- **Cliente prioritário** é uma decisão manual binária. A estrela aparece na ficha e na lista; alterar o estado comercial não altera a prioridade.
- Carteira no dashboard, lista lateral agrupada e relatório reutilizam os clientes existentes. Dentro de cada Estado Comercial: primeiro prioritários; dentro da mesma prioridade, sem contacto primeiro e depois contactos do mais antigo para o mais recente. Há filtros de estado comercial/contacto, prioridade e pesquisa, contagens e acesso à ficha.
- O dashboard destaca Resposta nossa pendente. As sugestões e prazos anteriores estão numa área complementar, sem definir a prioridade manual do cliente.
- O pedido inicial permite data efetiva retroativa e cria um único evento. Com data documentada, conta como contacto recebido e começa em Resposta nossa pendente. Sem data preenchida, criar apenas com nome continua possível e não inventa uma data de contacto.
- Registar contacto permite recebido/enviado, data, hora opcional, canal, notas e estado após a comunicação. Uma resposta recebida começa com Resposta nossa pendente, editável pelo utilizador.
- Registar resposta recebida pode atualizar preferências múltiplas, orçamento e finalidade no mesmo formulário. Resposta e preferências são gravadas numa só operação e criam um único evento de contacto, sem evento de preferências separado.
- Alterações isoladas de preferências têm marcador administrativo. Editar ficha, preferências, preparação ou seleção não atualiza o último contacto. Contactos introduzidos mais tarde com data antiga não substituem o contacto cronologicamente mais recente.

Modelo aditivo: `communicationHistory` preserva snapshots no próprio evento; `contactStateHistory` e `priorityHistory` preservam decisões no próprio cliente. São listas append-only para funcionar com a proteção existente de campos desconhecidos e deteção de regressão, sem modificar o protocolo de sincronização. Edições conservam o ID do contacto e acrescentam a versão. Não há uma segunda base de clientes/eventos nem migração durante a leitura.

Resultados específicos: [contactos, prioridades, carteira, falhas e concorrência](docs/client-profile-complete/contacts-results.json). Os testes incluem 64 clientes fictícios iniciais, pedido retroativo, resposta com preferências, correção manual após refresh, ordenação/filtros, mudança de estado mantendo prioridade, atualização entre navegadores, conflito 409 e recuperação sem duplicação.

## Implementação

- Dados, Preferências e Frações reutilizam a implementação aprovada. A listagem original mantém-se.
- Apresentação mostra a seleção existente, condições atuais confirmadas, orientação e indicação de frações fora das recomendações. Permite acrescentar qualquer fração e retirar unidades, sem alterar disponibilidade.
- Formulário compacto com data, hora, email/WhatsApp/telefone/presencial/videochamada/outro, preços individuais, notas, referências de documentação e estado Em preparação/Realizada.
- Preparação guardada é um evento explicitamente denominado `Apresentação em preparação`, não um contacto nem uma apresentação realizada. A seleção continua em `client.presentationSelection`; o evento guarda o conteúdo da apresentação, não uma segunda seleção global.
- Preço comunicado abaixo do oficial mostra diferença em euros e percentagem, sem exigir justificação ou aprovação. Não modifica preços oficiais. Na primeira realização, o preço oficial é fotografado a partir da fonte confirmada; se não estiver confirmado, fica explicitamente desconhecido, sem usar PVP/recomendação como substituto.
- Realização, correções e gravações repetidas conservam o mesmo identificador. Uma nova apresentação intencional tem outro identificador. As versões anteriores e os preços comunicados permanecem disponíveis.
- Negociação por cliente/fração: proposta, contraproposta, nova proposta, aceitação, rejeição, desistência, acompanhamento, reserva, cancelamento e venda. Cada novo movimento é outro evento; não substitui propostas anteriores. Valores, disponibilidade global e estado desta negociação aparecem separadamente.
- Próximo contacto, ação, data prevista e conclusão usam os campos e o motor de acompanhamento existentes. Planos novos por fração não são satisfeitos por contactos sobre outra unidade. Concluir uma ação não faz reaparecer versões substituídas dessa mesma ação.
- Venda com agente reutiliza o cálculo de comissão, receita líquida e associação do evento. Desistência numa negociação não declara automaticamente que o cliente desistiu de todo o empreendimento.

## Modelo aditivo e histórico

Não existe migração automática. Clientes/eventos legados continuam a ser lidos sem gravação ou conversão.

Apresentações novas acrescentam `presentationHistory`, uma lista **append-only** de snapshots `version: 1`, com estado, data/hora, canal, linhas de preço, notas e documentação. Uma edição acrescenta uma versão ao mesmo evento; não reescreve snapshots anteriores. Campos desconhecidos são preservados. Uma versão de snapshot desconhecida recusa edição em vez de converter silenciosamente.

`eventInformedPrices()` projeta a versão atual realizada para os consumidores existentes: ficha, relatório de clientes, histórico geral/por fração e recomendações. `informedPrices` legado não é sobrescrito para acomodar edições novas. O cache legado `commercialSummary.lastInformedPrices` não é convertido numa segunda fonte dos novos preços: os relatórios consultam os eventos. As versões anteriores continuam acessíveis no separador Apresentação.

Movimentos novos usam `negotiationVersion: 1` e os campos existentes `type`, `fractions`, `amount`, `interest`, `nextStep`, `followupDate`, `channel` e comissão. Não há uma segunda tabela de clientes, negociações ou propostas. Estado por fração e última proposta/contraproposta são derivados dos eventos.

Os novos campos são preservados pelo JSON completo e pelo armazenamento em blocos. Não houve alterações ao Apps Script nem às projeções das folhas espelhadas: estas podem não exibir os novos snapshots. A aplicação desta branch é necessária para interpretar integralmente o histórico novo; não usar uma versão antiga do frontend para editar esses registos.

## Reservas, vendas e integridade

1. Exigir fonte confirmada, sem escrita pendente/conflito e com autorização de escrita existente.
2. Comparar a revisão da abertura do formulário com uma nova leitura autenticada.
3. Verificar disponibilidade explícita, titularidade e ordem temporal da operação comercial ativa. Estado desconhecido, indisponibilidade, venda existente ou reserva de outro cliente não são substituídos.
4. Explicar a alteração global e obter confirmação explícita.
5. Ler novamente a revisão depois da confirmação. Qualquer alteração interrompe a operação e exige nova avaliação.
6. Reutilizar os helpers comerciais existentes e enviar evento/efeitos numa única operação CAS. O cancelamento confirmado de uma reserva nova deixa `Disponível` explícito, sem inferir disponibilidade a partir de uma chave ausente.

Edições exclusivamente descritivas de eventos de fecho não reaplicam estados. Alterações de cliente, data/hora, tipo, frações, valor, libertação de reserva ou comissão são críticas. Edições de apresentações/eventos simples não recalculam estados globais por acidente.

O bloco de sincronização desde `requestCommercialData()` até antes de `appDialog()` foi comparado com a base e permanece igual, normalizando apenas CRLF/LF. Revisões, tickets, HTTP 409, idempotência, backups, armazenamento em blocos e reconciliação mantêm-se.

O estado de sucesso depende de confirmação efetiva. Falhas deixam o evento local com o mesmo ID e mensagem de sincronização por confirmar. Após recarregar, a proteção conservadora pode exigir **Rever diferenças > Reconciliar alterações compatíveis > Sincronizar**. Não se contorna essa decisão nem se envia novamente um evento com outro ID.

## Validação

Fontes: API/autenticação existentes e Apps Script numa VM em memória. 64 clientes iniciais exclusivamente fictícios, características estruturais das 39 frações e preços/estados fictícios. Nenhuma credencial de produção, acesso à Sheet real ou fixture pessoal.

- 23 suites `tests/*.test.js`, incluindo fases anteriores, blocos/backups, concorrência, API, revisão, relatórios, preços, workflow e novos contactos/carteira.
- Jornada real de navegador: cliente apenas com nome, evento inicial único, T2/T2+1 e máximo 750.000, seleção recomendada/manual, preparação guardada, realização e refresh.
- Duas apresentações com valores diferentes, correção com o mesmo ID, versões preservadas, atualização recebida por outro navegador limpo.
- Ofertas/contrapropostas e estados independentes em duas frações; cliente legado com campos e eventos originais preservados.
- Reserva, cancelamento, venda e comissão; cancelamento da confirmação sem mutações; titularidade concorrente e alteração da disponibilidade durante a confirmação bloqueadas.
- Duas sessões na mesma revisão: primeira gravação aceite, segunda HTTP 409, dados remotos intactos e segunda alteração local preservada. Falha de escrita, repetição sem duplicação, reabertura, reconciliação explícita e recuperação.
- Regressões completas de navegador das Fases 2A e 2B, sem eliminar verificações anteriores. Apenas portas locais adicionais foram permitidas nos scripts.
- Desktop 1440x1000, tablet 820x1080 e mobile 390x844. Formulário de preços adapta a tabela para linhas verticais em mobile; não há overflow da página.
- Exportações: documento de proposta PT/ENG e PT/FR, preço individual, plantas, relatório com preços dos novos eventos e lista A4 portrait. O teste captura o HTML real do popup e renderiza-o numa página local estabilizada, pois o Chrome headless pode suspender recursos de `document.write` num popup vazio. O diálogo nativo/resultado numa impressora é uma verificação manual, não simulada como aprovada.

Resultados e imagens: [galeria](docs/client-profile-complete/README.md), [jornada](docs/client-profile-complete/validation-results.json), [exportações](docs/client-profile-complete/exports-results.json).

## Reprodução

1. `node tests/helpers/client-complete-preview.cjs`.
2. Abrir `http://127.0.0.1:5197/commercial.html`. Password **exclusivamente fictícia/local**: `View-Phase2A-Teste`.
3. `node tests/commercial-client-complete-regression.cjs`: executa as 23 suites, valida sintaxe e compara o bloco de sincronização e os caminhos protegidos com a base. Testes direcionados: `node tests/commercial-client-workflow.test.js` e `node tests/commercial-contacts.test.js`.
4. Com Playwright e Chrome disponíveis, `node tests/commercial-client-complete-browser.mjs`, seguido de `node tests/commercial-client-complete-exports.mjs`. O primeiro repõe a fonte fictícia e o segundo usa os seus registos, sem gravações comerciais. Depois, `node tests/commercial-contacts-browser.mjs` repõe a fonte e testa os novos requisitos. São execuções sequenciais com cenários fictícios independentes.
5. Variáveis de ferramentas locais: `PLAYWRIGHT_MODULE`, `CHROME_EXECUTABLE`, `COMPLETE_ARTIFACTS`. Não usar variáveis/ficheiros de produção. O servidor recusa destinos Google reais e não lê ficheiros `.env`.
6. Regressão 2A: helper 2A na porta 5198, `PHASE2A_TEST_ORIGIN=http://127.0.0.1:5198`. Regressão 2B: `PHASE2B_TEST_ORIGIN=http://127.0.0.1:5197`. Executar sequencialmente, pois os testes repõem a fonte em memória.

## Cobertura das 39 frações antes da publicação

Mantém-se o [procedimento administrativo exclusivamente de leitura da Fase 2B](CLIENT_PROFILE_PHASE2B.md#verificação-de-cobertura-antes-da-publicação-final). **Não foi executado em produção.**

Após autorização expressa, usar um processo controlado, sem abrir o CRM, sem localStorage e sem logs do payload. Permitir apenas GET autenticado ao endpoint comercial; validar origem, protocolo, integridade, revisão e confirmação. Projetar em memória somente `finalPrices[1..39]` e `statuses[1..39]`.

Relatório permitido: dimensão estrutural 39, revisão/data, contagens de preços válidos/ausentes/inválidos, estados reconhecidos/ausentes/inválidos, contagem por estado e números das frações incompletas. Não imprimir montantes, nomes, emails, clientes, eventos, agentes, notas, tickets ou chaves arbitrárias. Não preencher lacunas com PVP/SUG nem assumir Disponível.

Repetir a leitura e comparar a revisão: se mudou, considerar inconclusivo e repetir, sem reconciliar/gravar. O endpoint atual recebe a base integral no processo autenticado; a projeção impede divulgação no relatório, mas não reduz o payload recebido. Uma auditoria que nunca possa receber dados pessoais exige uma leitura agregada na origem, a aprovar separadamente.

## Estado das PRs anteriores

Consulta GitHub em 15/10/2026:

| PR | Base | Head | Estado |
| --- | --- | --- | --- |
| #3 | main `db097c8` | phase1 `d4a2ff0` | Aberta, não integrada, mergeable=true |
| #4 | phase1 `d4a2ff0` | phase2a `aff9b25` | Aberta, não integrada, mergeable=true |
| #5 | phase2a `aff9b25` | phase2b `5582825` | Aberta, não integrada, mergeable=true |

Sem conflito Git identificado. Isto não certifica aprovação comercial, regras de proteção, revisores obrigatórios ou todos os checks administrativos. A integração final deve respeitar as dependências, com autorização. Nenhum merge foi realizado.

## Ficheiros e limites

- `commercial-client-workflow.js`: modelo puro, snapshots, projeções, contactos, prioridade, ordenação de carteira e validação comercial.
- `commercial-client-workflow-ui.js`: formulários de Apresentação/Negociação, acompanhamento manual e resposta com preferências, através dos adaptadores existentes.
- `commercial.js`: integração, leitores de preços históricos, confirmação/revalidação de fechos e mensagens de gravação; sem mudança do protocolo de sync.
- `commercial-recommendations.js`: reconhecimento dos movimentos novos e âmbito das próximas ações por fração, mantendo os casos legados.
- `commercial.html`, `commercial.css`: módulos novos e estilos limitados ao novo workflow.
- `vercel.json`: deployments Git automáticos desativados nesta branch.
- `tests/`: testes novos e adaptação do servidor fictício/portas para regressões. `docs/client-profile-complete/` e este documento: evidências e instruções.

Não alterados: API, server, Apps Script, middleware/autenticação, config, data.json, plantas, preços estruturais e geradores de proposta/lista de preços. O gerador existente de relatórios é reutilizado para o novo modelo Carteira Comercial.

Limites antes da publicação: validação humana dos formulários e impressão nativa; cobertura real 39/39 só com autorização; confirmação da configuração Google real numa fonte de testes; revisão de permissões. As verificações de titularidade no cliente e o CAS existente não são uma nova autorização relacional no backend, que não foi alterado. O rascunho de formulário não guardado é apenas memória; guardar Em preparação é necessário para o conservar após refresh. Snapshots aumentam a base, sob os limites e proteções existentes. Conflitos não resolvidos continuam a exigir decisão explícita.
