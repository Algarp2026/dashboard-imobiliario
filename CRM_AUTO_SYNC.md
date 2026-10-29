# Sincronizacao automatica e renovacao do comprovativo de leitura

Base: `658da6f038f061aad5f532cb66c98c529591dfe1` (main, PR #18).
Branch: `codex/fix-crm-auto-sync`. Entrega para Draft PR; sem merge ou deployment.

## Causas reproduzidas

- O frontend anterior fazia um GET antes do POST, mas enviava o comprovativo
  antigo de `sharedSync.ticket`. Com a mesma sessao aberta ha mais de uma hora,
  a API local real rejeita a escrita com `403 READ_REQUIRED`.
- Duas abas partilham localStorage. Uma leitura em curso podia usar os metadados
  entretanto atualizados por outra aba como se fossem a sua propria base inicial.
  O teste contra main reproduz uma falsa classificacao como alteracao pendente;
  com a correcao, a instancia recebe a atualizacao confirmada sem POST.

## Correcao

Cada gravacao usa o comprovativo do GET validado imediatamente anterior. Antes
do POST, verifica revisao, permissao e diagnostico de operacoes pendentes.
Revisao diferente bloqueia o POST antigo; uma alteracao depois do GET continua
a ser rejeitada pelo CAS real do servidor com HTTP 409.

Apenas um `403 READ_REQUIRED` permite uma nova leitura e uma unica repeticao,
com o mesmo requestId e conteudo. Revalidam-se revisao, origem da operacao e
conteudo atual. Nao ha repeticao automatica de recuperacoes, 401, INVALID_ORIGIN,
409 ou timeouts. Uma resposta perdida conserva a operacao para recuperacao
explicita. Um pedido antigo diferente das alteracoes atuais nunca e reenviado
como se correspondesse a essas alteracoes.

Cada instancia fixa a sua base confirmada antes do GET. A protecao existente
contra regressao, incluindo 63 clientes locais contra 24 remotos, permanece.
Metadados que indiquem a mesma revisao para conteudos diferentes continuam a
bloquear a substituicao. Nao se alteraram schema, chaves nem migracoes comerciais.

## Consultas e edicao

- Intervalo de 30 segundos, com jitter de +/-10%, depois da consulta anterior.
- Uma leitura ativa por instancia, coalescendo pedidos simultaneos.
- Suspensao enquanto a pagina esta oculta; retoma por foco, visibilidade e online,
  com intervalo minimo de 10 segundos entre arranques.
- Falhas aplicam backoff progressivo ate 5 minutos. HTTP 401 suspende verificacoes
  periodicas ate novo sinal de regresso; nao contorna autenticacao.
- Web Locks evita consultas automaticas sobrepostas e serializa escritas entre
  abas da mesma origem. BroadcastChannel comunica apenas revisao/tipo/data,
  nunca clientes, comprovativos de leitura ou credenciais. Cada aba valida os
  dados que recebe atraves do seu proprio GET autenticado.
- Uma leitura sem mudancas renova o contexto sem renderAll nem novo backup
  completo. Uma revisao nova segura atualiza a interface e restaura scroll.
- Modais, formularios inline, selecoes em preparacao e campos modificados sao
  protegidos mesmo antes de Guardar. Uma atualizacao fica pendente durante a
  edicao; cancelar/fechar permite nova verificacao. Alteracoes locais guardadas
  mas nao confirmadas exigem a recuperacao/reconciliacao existente.
- O regresso de uma pagina mantida em memoria conserva o registo de campos
  modificados. Uma verificacao manual tambem nao reconstroi um editor aberto.
  Atualizacoes do indicador nao reconstruem os botoes de selecao de fracoes.
- O indicador distingue edicao local, verificacao, atualizacao recebida,
  gravacao pendente, confirmacao, conflito e indisponibilidade. Mostra separadamente
  ultima leitura, ultima escrita confirmada nesta sessao e data da fonte.

## Preservacao local e comercial

Os pedidos originais sao arquivados no IndexedDB existente antes do POST,
incluindo ID, revisao, base e conteudo. Continuam protegidos ate confirmacao.
A confirmacao desprotege exclusivamente copias do mesmo pedido e conteudo;
nao apaga pedidos ou copias nao confirmadas. A retencao anterior permanece.
Antes de substituir cache ou retirar o marcador pendente, verificam-se outra
vez o pedido original e a cache, evitando pisar alteracoes de outra aba durante
a confirmacao.

Sem Web Locks, exige-se IndexedDB para preservar pedidos em corridas locais.
Se o navegador nao tiver nenhum dos dois, a escrita falha de forma segura,
mantendo exportacao e dados locais. A garantia CAS do servidor permanece sempre.

API, autenticacao, Apps Script, B5/B6, blocos, backups remotos, espelhos,
validacao comercial sob bloqueio e mecanismos dos PRs #14 a #18 nao foram
alterados. Precos, estados, reservas, vendas, comissoes, PDFs e CRM funcional
nao foram modificados. `vercel.json` desativa deployment Git desta branch.

## Validacao e reproducao

Ambiente exclusivamente local, dados ficticios, API autenticada real do projeto
e Apps Script executado em VM com armazenamento em memoria. Nao foi contactada
qualquer Google Sheet nem utilizado um token Google real.

```powershell
node tests/commercial-client-complete-regression.cjs
node tests/commercial-ticket-renewal.test.js
node tests/commercial-auto-sync.test.js
node tests/commercial-browser-regression.cjs
node --check commercial.js
node --check app.js
node --check config.js
node scripts/build-commercial-integrity.js --check
```

O runner de navegador exige Chrome/Playwright disponiveis e uma porta loopback
dedicada entre 53000 e 53999. Nao interfere na preview 5210. Os resultados e logs
integrais ficam fora da branch. O resumo final acompanha este documento.

Resultados consolidados: [validation.json](docs/crm-auto-sync/validation.json).
54/54 suites Node, 24/24 suites Chrome e 120 ficheiros JavaScript com sintaxe
validada. O teste do comprovativo inclui 18 cenarios; o scheduler inclui 10.
As ultimas alteracoes de ciclo de pagina/verificacao manual foram tambem
revalidadas nos percursos de sincronizacao e reconciliacao afetados.

Ficheiros de produto: `commercial.js` (transporte, protecao de edicao e polling),
`commercial.css` (cor do indicador) e `vercel.json` (bloqueio Git desta branch).
Os restantes ficheiros alterados sao testes, fixture local, agregadores e este
relatorio. Nao se adicionaram modulos comerciais nem dependencias de producao.

Os testes iniciais encontraram uma regressao da nova observacao de formularios:
atualizar apenas o indicador reconstruia desnecessariamente os botoes de selecao.
A correcao limita essas notificacoes ao indicador. Os dois percursos que a
detetaram (`crm-reform` e `crm-post-audit`) foram repetidos com sucesso.

Cobertura adicional:

- Renovacao apos uma hora, comprovativo invalido e mudanca de sessao.
- Repeticao limitada READ_REQUIRED com identidade preservada; INVALID_ORIGIN e
  sessao expirada sem repeticao; conflito real depois do preflight.
- Atualizacoes A para B e B para A sem F5, duas abas na mesma origem e baseline
  capturada antes do GET.
- Edicao nao guardada e negociacao aberta preservam valores, modal e scroll.
- Conciliacao de clientes diferentes; conflito no mesmo cliente; respostas
  perdidas, reload e pedido original preservado; cache alterada durante confirmacao.
- Periodicidade, coalescencia, backoff, offline, aba oculta, ausencia de POST de
  polling e preservacao de campos comerciais e metadados desconhecidos.
- Suites anteriores de quota/IndexedDB, integridade, recuperacao do Apt.16,
  reservas, precos, estados e relatorios permanecem no catalogo.

Alguns testes anteriores esperavam enviar um POST obsoleto para receber 409.
Agora verificam o bloqueio anterior ao POST, o codigo CONFLICT e preservacao
integral de ambas as versoes. A rejeicao CAS HTTP 409 continua coberta por uma
corrida real entre GET e POST, tanto em Node como em Chrome. Nenhuma suite foi
retirada. O agregador congela individualmente todas as funcoes de sincronizacao
nao alteradas e verifica que backend/autenticacao permanecem iguais a main.

## Desempenho e limites

Antes: nao havia deteccao periodica; a espera podia ser indefinida ate F5.
Depois: aproximadamente duas consultas por minuto por instancia visivel e
ociosa; com uma leitura simulada de 3 segundos, 18 consultas em 10 minutos.
Dez minutos ocultos geram zero novas consultas automaticas no teste.
Foco/online podem antecipar consultas, limitadas a um arranque por 10 segundos.
GETs exigidos para gravar e acoes manuais sao adicionais.

Modelo conservador de paginas ativas independentes: 2 utilizadores = cerca de
4 GET/min; 5 = 10 GET/min; 10 = 20 GET/min, antes de escritas e sinais de foco.
As abas podem evitar consultas coincidentes; isto nao promete um unico GET global
por navegador, porque cada instancia precisa validar a sua propria base.

Os tempos Chrome anexos medem API/VM local e incluem o intervalo de polling.
Nao sao tempos Google, nem demonstram quota suficiente em producao. Os tempos
reais anteriormente fornecidos pelo utilizador (GET 2,1-3,6 s) nao foram medidos
novamente. Nao foram feitas medicoes novas no Google.

Na execucao local com relogio normal, tres deteccoes demoraram 30.875, 27.525 e
30.802 ms: media de 29.734 ms, sem F5. O teste adicional de ciclo de pagina e
verificacao manual usa tambem uma repeticao com intervalo acelerado; esses tempos
acelerados nao sao utilizados como medicao de desempenho. A manutencao do
rascunho no ciclo de pagina e verificada com eventos de ciclo de vida simulados
num Chrome real, nao com uma garantia de BFCache em todos os dispositivos.

O aumento de leituras deve ser acompanhado primeiro numa fonte Google de teste.
Quotas e concorrencia efetivas dependem da conta e da carga; se houver 429,
SOURCE_TIMEOUT ou crescimento sustentado de latencia, propor 45-60 segundos
antes de alargar utilizacao. Nao reduzir seguranca nem aumentar tentativas.
Dispositivos suspensos nao oferecem garantia de deteccao em 30 segundos; ao
regressar, a verificacao e retomada com limitacao de frequencia.

## Validacao posterior, apenas com autorizacao

1. Rever Draft PR e testar primeiro com Sheet/Apps Script ficticios isolados.
2. Nao e necessaria publicacao de Apps Script nem alteracao de variaveis/API
   para esta correcao frontend. A publicacao continua sujeita a autorizacao.
3. Em duas sessoes de teste, guardar em A e observar B sem F5; inverter papeis.
4. Manter um modal com texto nao guardado e atualizar a fonte por outra sessao:
   confirmar aviso discreto, texto/scroll intactos e conflito seguro ao guardar.
5. Repetir apos mais de uma hora; distinguir READ_REQUIRED de sessao expirada.
6. Testar offline, retoma, resposta perdida, revisao concorrente e recuperacao
   com o ID original, sem eventos duplicados.
7. Medir pedidos/tempos reais e erros, sem imprimir dados pessoais; interromper
   se crescerem quotas/latencia ou se a revisao nao for confirmada.

Rollback de frontend continua compativel com o JSON e IndexedDB existentes,
mas repoe o defeito do comprovativo antigo e remove a consulta automatica.
Nunca limpar pedidos ou backups como parte de um rollback.
