# Clientes e Agentes: carteira e ficha modal

Base: `main` em `5d2c91fc0e476edf1422656ea5df7aab7c119e64` (PR #12 integrada).
Branch independente: `codex/client-agent-modal-workspace`.

## Alteracoes de interface

- Carteira de largura total com nome, origem/agente, estado comercial efetivo,
  Estado do Contacto, ultimo contacto, proxima acao e fracoes relacionadas.
- Seis ordenacoes exclusivamente visuais, independentes dos filtros e da
  prioridade comercial. Todos os clientes aparecem por defeito.
- Pesquisa, estado comercial e Estado do Contacto principais; agente e prioridade
  em filtros avancados. Contador visivel/total.
- Ficha existente movida, sem clonagem, para um unico modal de 95% do ecra,
  praticamente fullscreen no telemovel. Cabecalho e cinco abas fora do scroll.
- Teclado, foco, Escape apenas no dialogo superior, inert no fundo, ordem de
  empilhamento para edicao/cliente/agente/PDF/confirmacao e bloqueio de fecho
  enquanto existe um formulario a guardar.
- Abertura por carteira, pesquisa global, Agentes e edicao pelo Historico sem
  mudar o modulo de origem. Filtros, ordem e scroll preservados no regresso.
- Clientes associados no detalhe do agente e acesso a carteira filtrada.
- Na carteira, Novo Evento abre o formulario com escolha explicita de cliente;
  registo de contacto individual continua disponivel no separador Dados.

## Datas e associacoes

Ordenacao por criacao usa apenas datas validas em `createdAt`, `createdDate` ou
`created`. Nao usa `updatedAt`, ultimo contacto ou timestamps inferidos do ID.
Registos assinalados como criados por migracao/importacao Majuca nao recebem uma
data presumida de criacao. Registos com data fiavel precedem os restantes.

Sem data fiavel, o desempate usa a posicao estavel no array original: inversa em
Mais recentes, direta em Mais antigos. Nao se afirma que esta ordem represente
uma cronologia historica. Empates nas outras ordenacoes usam a mesma posicao
estavel, nunca a ordenacao de prioridades de `portfolio()`.

Vinculo de agente exige `agentId` ou `responsibleAgentId` inequivoco e existente.
Indicadores contraditorios, nomes livres, origem generica e notas nao criam
associacoes. Nenhum vinculo e persistido ao consultar.

## Navegacao e rascunhos

Parametros aditivos `client` e `clientTab` identificam a ficha e aba; os restantes
parametros (incluindo `apt`) sao preservados. Estado visual continua na chave de
sessao ja existente. Login, refresh, links diretos e Back/Forward mantem o fluxo.

Rascunhos comerciais existentes continuam geridos pelo controlador aprovado.
Rascunhos de preferencias de clientes diferentes ficam separados em memoria.
Fechar a ficha nao os descarta. Isto nao acrescenta persistencia de formularios
por gravar: um recarregamento integral ainda perde rascunhos nao guardados, como
anteriormente. A base comercial guardada continua protegida pelo protocolo atual.

## Validacao

Exclusivamente 64 clientes ficticios, catalogo sintetico de 39 fracoes e backend
Apps Script simulado em memoria. Transportes externos bloqueados; nenhum acesso
a base real, backups pessoais ou credenciais de producao.

- 34 suites `tests/*.test.js`: aprovadas.
- Sintaxe: `commercial.js`, `app.js`, `config.js` e novo modulo: aprovada.
- `tests/client-workspace-browser.mjs`: carteira, seis ordenacoes, filtros
  combinados, cinco abas funcionais, edicao/cancelamento, refresh, links diretos,
  agentes e Dashboard, retorno de foco, contador, sem overflow horizontal.
- `tests/client-workspace-dialogs.mjs`: scroll, Back/Forward, anterior/seguinte,
  Tab, cliente/agente sobrepostos, Escape, PDF, confirmacao, protecao durante
  gravacao, rascunhos de apresentacao/preferencias e edicao pelo Historico.
- `tests/visual-workspace-transactions.mjs`: apresentacao preparada/realizada,
  evento unico, propostas/contrapropostas, reserva/cancelamento/venda, conflito
  409 entre sessoes e preservacao local perante falha de gravacao.
- Consulta: cache comercial identica antes/depois e zero pedidos de escrita
  comercial. Testes transacionais gravam apenas na memoria do servidor ficticio.
- Capturas Chrome reais: 1440x900, 1366x768, 820x1080 e 390x844. Antes/depois
  desktop/mobile e cinco abas nas quatro dimensoes.

[Galeria de revisao](docs/client-agent-workspace/README.md).

## Preservacao e limites

API, servidor, Apps Script, autenticacao, sincronizacao, precos, estados,
comissoes, motores comerciais, modelos, conteudo PDF, config.js, data.json e
plantas sem alteracoes. Os testes existentes tambem comparam funcoes protegidas
de `commercial.js` com a base anterior.

Ficheiros funcionais: `commercial.js`, `commercial.html`, novo modulo
`commercial-client-workspace.js` e estilos `commercial-client-workspace.css`.
`vercel.json` desativa deployments Git exclusivamente desta branch. Restantes
alteracoes sao testes, adaptacoes de fixtures/seletores e esta documentacao.

Sem migracao ou mudanca do esquema comercial. Sem merge ou deployment.
A branch corresponde a [PR #13](https://github.com/Algarp2026/dashboard-imobiliario/pull/13),
aberta para `main`. Nao fazer merge nem publicar sem autorizacao.

## Ajustes finais da auditoria da PR #13

- Novo Evento global abre com opcao vazia, mesmo depois de consultar um cliente.
  Apenas a origem explicita `client` pre-seleciona o cliente da ficha; edicoes
  continuam a usar o cliente do evento. Atualizar os seletores com um formulario
  aberto preserva a escolha atual, incluindo a escolha vazia.
- Validacao existente bloqueia guardar eventos que exigem cliente sem escolha.
  Nao foram alteradas regras de reservas, vendas, comissoes ou persistencia.
- Telefone e email compactos na identificacao da carteira, com links tel/mailto
  e quebra responsiva. Clicar num contacto nao abre tambem a ficha.
- `tests/client-workspace-audit.mjs`: desktop/mobile, abrir A/fechar/criar evento
  vazio, rejeicao sem cliente sem gravacao, selecao de B, evento unico apenas em
  B, refresh e preservacao de A e restantes dados comerciais. Escritas apenas
  no backend ficticio em memoria. Capturas especificas na galeria.

## Reproduzir localmente

1. Executar as suites `tests/*.test.js` com Node e verificar sintaxe.
2. Iniciar `tests/helpers/visual-workspace-preview.cjs` com
   `D2_SYNTHETIC_CATALOG=true`. O servidor fica em `http://127.0.0.1:5210`.
3. Usar exclusivamente a password ficticia definida nesse helper, nunca uma
   credencial de producao. O servidor substitui os acessos Google por memoria.
4. Executar os tres testes de navegador acima com Playwright e Chrome disponiveis.
   `PLAYWRIGHT_MODULE` e `CHROME_EXECUTABLE` aceitam caminhos locais opcionais.
5. Reiniciar o servidor entre testes transacionais e capturas para repor a fixture.
6. `WORKSPACE_ARTIFACTS` permite mudar o destino das capturas. Nenhum destes
   auxiliares e carregado pela aplicacao publicada.
