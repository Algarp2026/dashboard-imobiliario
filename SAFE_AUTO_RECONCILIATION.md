# Reconciliacao automatica conservadora

Base original: main `e60486130a3dd362b92691cac80df44567180514` (PR #19).
Branch: `codex/safe-crm-reconciliation` (PR #21).
Integracao final: main `a6727b63fe42418da21b8b52e6351444cba6e9ec`, com PR #20.
O comparador/dados dessa main e o CRM aprovado em `9d939f3` permanecem exatos.
Validacao nova da integracao: `docs/safe-reconciliation/main-integration.json`.
Sem acesso Google real, merge, deployment, migracoes ou alteracao do Apps Script.

## Diagnostico e reproducao

O cliente publicado recusa uma revisao global diferente no GET anterior ao POST,
antes de tentar `reconcileSharedData`. O polling tambem preserva dados locais
pendentes como conflito. Isto reproduz um bloqueio mesmo quando os campos sao
independentes e a reconciliacao manual teria zero conflitos.

Teste antes/depois: outra sessao altera o telefone de um cliente; a sessao com
BASE antiga marca Apt. 3 e 11 como indisponiveis. Antes, CONFLICT sem POST.
Agora: tres vias, arquivo, nova leitura autenticada, CAS e confirmacao; ambos os
eventos/motivos e o telefone remoto permanecem. Refresh preserva o resultado.

Isto confirma a causa do cenario reproduzido, nao a causa forense da ocorrencia
real. Nao foram lidos pedidos, IDs ou registos de producao. A ausencia de uma
confirmacao naquela sessao nunca e interpretada como ausencia de escrita remota.

## Regras exatas

- BASE confirmada conhecida; dados/revisao/comprovativo validados pelo transporte.
- Escrita autorizada, B5 sem operacao pendente e nenhum pedido original local.
- Sem formulario alterado; cache, geracao local e versao de edicao coerentes.
- Timestamp da versao remota valido e nao anterior a ultima leitura confirmada.
- Protecao de rollback existente; sem eliminacao de clientes, agentes ou eventos,
  nem alteracao de eventos anteriores ou perda de historico de precos.
- Apenas campos de dominio revistos; metadados desconhecidos continuam preservados
  e alteracoes nesses campos exigem revisao.
- Referencias de clientes, agentes, eventos e efeitos comerciais verificadas.
- Estados reconhecidos; indisponibilidades novas exigem motivo e novo evento
  administrativo correspondente; precos alterados exigem historico coerente.
- Unidades tocadas por ambas as vias nao sao reconciliadas automaticamente, mesmo
  que os nomes dos campos sejam diferentes. Eventos e campos comerciais do mesmo
  cliente tambem sao tratados como dependencias. Telefone/email nao sao efeitos
  comerciais: podem coexistir com preferencias independentes, incluindo snapshot.
- Reservas, vendas, cancelamentos, comissoes e fronteiras de ciclo nao sao inferidos
  ou recriados. Operacoes criticas locais permanecem sujeitas a revisao manual.
- `reconcileSharedData` continua a ser o unico motor de fusao. Apenas `updated` e
  `updatedAt` do cliente podem escolher o timestamp valido mais recente; conflitos
  dos campos efetivos continuam a bloquear. Datas de eventos nao sao reordenadas.
- A mesma validacao comercial auditada da fonte valida BASE->LOCAL, BASE->REMOTA,
  REMOTA->RESULTADO e LOCAL->RESULTADO antes de qualquer rebase automatico.

O validador de navegador e gerado das mesmas fontes por
`scripts/build-commercial-integrity.js`. Um invólucro isolado impede os modulos
UMD internos de preencher/substituir os modulos da interface. O middleware apenas
acrescenta protecao ao novo ficheiro. O servidor continua a validar sob o bloqueio
de escrita; validacao do navegador nao e uma fronteira de seguranca.

## Gravacao e limites

Arquivar BASE/LOCAL/REMOTA antes de mudar a cache. Relê a fonte depois do arquivo
IndexedDB; qualquer mudanca local, de formulario, revisao ou estado pendente invalida
o plano. No maximo tres avaliacoes (inicial + duas novas tentativas) antes do envio.
`AUTO_RETRY_LIMIT` bloqueia novas tentativas de polling ate revisao explicita.

O resultado usa o percurso existente: requestId novo apenas se nao existir pedido,
read ticket atual, CAS, B5/B6 e confirmacao `persisted` com o identificador esperado.
Gravacoes do mesmo dispositivo permanecem serializadas; alteracoes posteriores ao
payload ficam pendentes para a operacao seguinte, sem duplicar eventos.

Um POST recusado por CAS, sem resposta, ou de resultado incerto conserva sempre o
pedido original. Nao e substituido para tentar outra fusao, mesmo num HTTP 409.
Este caso segue recuperacao idempotente/revisao existente, nao uma repeticao cega.

Backups nao confirmados continuam protegidos. Arquivo sem espaco bloqueia a
operacao, em vez de remover a unica copia. Pode ser necessario exportar/rever o
arquivo em utilizacoes repetidas; nao ha limpeza silenciosa.

## Feedback e formularios

Os estados distinguem alteracao local, conciliacao e confirmacao efetiva. A mensagem
de gravacao confirmada exige uma resposta real de escrita; uma leitura inicial
apenas indica base verificada. Datas, codigo tecnico, alteracoes locais e existencia
de pedido pendente sao visiveis, sem nomes, contactos ou conteudos em logs.

Polling com formulario alterado apenas deteta a versao remota. Nao fecha modais,
substitui campos, muda foco ou elimina rascunhos. Paginas antigas conservam o
percurso manual e os mesmos controlos de servidor; e necessario recarregar para
usar a nova politica. Cache divergente entre abas exige revisao, nao sobreposicao.

## Validacao e publicacao

Resultados originais em `docs/safe-reconciliation/validation.json`; nao substituem
os novos testes da integracao em `docs/safe-reconciliation/main-integration.json`.
Fixtures, API autenticada e Apps Script VM ficam exclusivamente em memoria.
Incluem dois portateis e um mobile, IndexedDB, formulario aberto, resposta perdida,
recuperacao idempotente, revisoes concorrentes e preservacao de historicos.

A regressao encontrou um efeito lateral do primeiro bundle na detecao de modulos
ausentes; foi corrigido com isolamento e acrescentada verificacao especifica.
Os resultados iniciais e repeticoes ficam registados, sem contar falhas como passes.

Nao requer publicacao Google: API, backend, Apps Script, config.js e dados sao
iguais a main. Deployment Git desta branch esta desativado. A nova PR deve ficar
em Draft, para auditoria independente; nao autoriza merge ou publicacao.
