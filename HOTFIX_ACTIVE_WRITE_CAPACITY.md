# Hotfix local - protecao da gravacao com arquivo cheio

Base: `cc5da5d04a10b7b078dd116bc6852d9729af7d89`, main incluindo PR #28.
Branch: `codex/hotfix-active-write-capacity`. Sem push, PR, merge ou deployment.

## Causa e alteracao minima

`performCommercialWrite()` exige uma copia `write-request` antes de qualquer POST. Essa copia era inserida no mesmo orcamento de 64 registos/16 MiB do arquivo historico. Quinze copias protegidas com 14,84 MiB deixam aproximadamente 1,16 MiB: um pedido com dados, base e corpo original pode exceder esse saldo. A transacao aborta com `LOCAL_BACKUP_CAPACITY` antes do envio, mesmo existindo quota fisica livre.

O percurso normal e mantido. Quando o arquivo chega ao limiar de manutencao ja existente (85% dos bytes ou 60 registos), ou a protecao de escrita encontra o limite, utiliza uma reserva limitada no **mesmo IndexedDB e object store `copies` existentes**, sem migracao, nova DB, nova chave localStorage ou novo envelope comercial. A antecipacao evita aceitar uma copia duplicada no historico sem margem posterior para os metadados do ack:

- `active-write.v1`: pedido ativo, original e recuperavel.
- `active-write-confirmed.v1`: ultimo pedido confirmado da reserva, para manter uma copia confirmada durante a gravacao seguinte.
- Maximo de dois registos reservados, ate 6 MiB por registo. O historico continua limitado a **64 registos/16 MiB**; copias antigas nao passam a consumir a reserva. Sao orcamentos logicos distintos, nao espaco fisico garantido.
- A reserva usa o formato existente de `write-request`, com todos os dados/base/pedido/IDs originais. Nao introduz referencias/deltas nem muda a interpretacao de formatos antigos.

A entrada tem 8 KiB de margem logica para metadados de confirmacao. O limite individual acomoda o envelope completo de dados ate ao limite atual da fonte, mas nao autoriza ultrapassar o limite remoto. Quota real, permissoes e disponibilidade de IndexedDB continuam a ser verificadas pelas operacoes reais; se falharem, nao ha POST.

## Garantias

1. O novo pedido e verificado por checksum, gravado numa transacao `strict` e relido antes de devolver a autorizacao para o envio existente.
2. A transacao compara o snapshot do arquivo e verifica o pedido/cache atuais. Uma mudanca concorrente aborta sem substituicao.
3. Retry identico reutiliza o registo original, inclusive ao executar recuperacao com `action=recover`; nao reescreve o original `save`.
4. Um pedido diferente so ocupa o lugar ativo depois de validar o comprovativo persistente **exact-request** do anterior. A rotacao conserva esse anterior no lugar confirmado. Um pedido incerto, desconhecido, adulterado ou por rever bloqueia a rotacao.
5. O lugar confirmado anterior so pode ser substituido se tambem tiver prova exata valida. Nao se usa idade, exportacao externa, flag ou semelhanca de dados para desproteger.
6. A confirmacao de um pedido reservado altera apenas esse pedido. Nao aumenta metadados nem desprotege automaticamente as copias historicas, evitando outro bloqueio de capacidade depois do commit remoto.
7. A manutencao automatica nao apaga nem comprime os dois lugares reservados. O historico conserva a retencao e as regras de prova anteriores. Exportacao completa inclui **todos** os registos, incluindo a reserva, no formato existente.
8. Falha local antes do envio preserva dados/pedido e impede POST. Commit remoto com resposta perdida preserva o pedido para recuperacao exata; falha de ack local nao fabrica comprovativo.

Os diagnosticos existentes continuam a apresentar o orcamento historico. `localRecoveryDiagnostics().activeWrite` acrescenta, tecnicamente, contagem, bytes e limite da reserva; quota fisica da origem continua separada. Nao ha alteracao de layout, botoes, formularios ou regras comerciais.

## Alternativas avaliadas

- Nao aumentar simplesmente os 16 MiB globais: o historico protegido voltaria a consumir a margem.
- Nao comprimir/reinterpretar protegidos desconhecidos neste hotfix: exigiria contratos de codec e migracao mais amplos. A compressao existente de copias confirmadas permanece intacta.
- Nao reduzir envelopes a deltas/referencias: isso pertence a P2-P5 e mudaria a recuperacao/compatibilidade.
- A reserva limitada evita essa migracao e continua a bloquear quando nao existe capacidade fisica suficiente.

## Ficheiros

| Ficheiro | Motivo |
|---|---|
| `commercial.js` | Reserva limitada, verificacao/readback, rotacao com prova, capacidade separada e ack isolado. |
| `tests/commercial-active-write-capacity.test.js` | Testes sinteticos de capacidade, preservacao, reinicio, concorrencia local, identidade, quota/abort, prova errada e falha de ack. |
| `tests/commercial-active-write-browser.mjs` | Percurso completo em desktop/mobile com frontend/API/fonte simulada reais. |
| `tests/helpers/active-write-preview.cjs` | Fonte ficticia grande previamente gravada em blocos, campos individuais abaixo de 50.000 caracteres. |
| `tests/helpers/active-write-capacity-source.cjs` | Pina os dois trechos exatos autorizados e comprova igualdade integral com a main fora deles. |
| `tests/helpers/storage-optimization-source.cjs` | Encadeia essa prova antes de todas as verificacoes historicas existentes, sem as remover. |
| `docs/hotfix-active-write/results.json` | Resultados resumidos, sem conteudo de clientes ou credenciais. |
| `HOTFIX_ACTIVE_WRITE_CAPACITY.md` | Diagnostico, validacao, riscos e procedimento de revisao. |

## Validacao

- **71/71 suites Node aprovadas**, abrangendo comercial, integridade, CAS, tickets, recuperacao, arquivo e sincronizacao.
- **170/170 verificacoes de sintaxe aprovadas**, incluindo `commercial.js`, `app.js`, `config.js` e os novos scripts.
- **10/10 suites existentes de navegador aprovadas**: storage-reliability, storage-growth, recovery-archive, loading-persistence, safe-reconciliation, auto-sync, presentation-pdf, pending-local, fraction-draft e profile-followup.
- Novo teste completo aprovado em **Chromium desktop e mobile**, zero erros JavaScript: 15 copias protegidas/14,84 MiB intactas; gravacoes sucessivas; reload; resposta perdida apos commit; retry sem duplicacao; quota injetada com rollback atomico e zero POST; exportacao apos falha; pedido incerto mais alteracoes novas preservados apos reabrir.
- Teste unitario inclui historico de **64 registos**, limite individual, conflito no arquivo/pedido entre preparacao e transacao, comprovativo errado, ack sem espaco, colisao com formato desconhecido, original comprimido no formato anterior e duplicado historico exato sem alteracao dos seus metadados.
- A suite existente `commercial-storage-reliability-browser.mjs` tambem passou o seu cenario de **quota IndexedDB nativa** no ambiente Chrome descartavel; a quota do novo teste ponta a ponta e explicitamente injetada.
- `tests/commercial-persistence-p1-current.test.js` continua a reproduzir os dois defeitos P1. Nao foram declarados corrigidos.

Evidencia resumida e contagem de sintaxe: [results.json](docs/hotfix-active-write/results.json).

### Ajustes dos ensaios preparatorios

O primeiro servidor de teste estava num contexto de execucao inacessivel ao browser; foi relancado no contexto correto. A primeira fixture grande tinha um unico campo acima do limite por celula e faltavam dois defaults que a normalizacao atual adiciona. Esses problemas foram corrigidos apenas na fixture, mantendo a comparacao integral. Os cenarios finais usam alteracoes unicas por execucao, nao pedidos sem alteracao de conteudo.

Foi mantido o 409 da fonte ao tentar `recover` de um pedido que nunca chegou ao servidor. No teste de quota antes do POST, a retoma usa o pedido original em **save normal com revisao/ticket/CAS atuais**; no teste de resposta perdida apos commit, usa recuperacao exata. Nao se alterou a API nem o Apps Script para fazer esses testes passar. Nenhum teste existente foi removido, enfraquecido ou recebeu timeout maior.

## Como repetir

```powershell
node --check commercial.js
node tests/commercial-active-write-capacity.test.js
node tests/commercial-persistence-p1-current.test.js
```

Para o teste novo de navegador, iniciar apenas o servidor ficticio:

```powershell
$env:PHASE2A_TEST_PORT='53466'
node tests/helpers/active-write-preview.cjs
```

Noutro terminal, com Playwright/Chrome instalados:

```powershell
$env:COMMERCIAL_TEST_ORIGIN='http://127.0.0.1:53466'
$env:HOTFIX_ARTIFACTS='<pasta externa de resultados>'
node tests/commercial-active-write-browser.mjs
```

O runner exige loopback 53xxx e perfis descartaveis; rede externa bloqueada. Fixtures nao carregam credenciais reais. Suites existentes usam o agregador `tests/commercial-browser-regression.cjs` numa porta dedicada diferente. Nao apontar testes ao dashboard/Google real.

## Riscos, compatibilidade e conclusao

- **Apto tecnicamente para revisao do hotfix**, nao autorizacao de publicacao. Nenhuma base real ou backup do utilizador foi aberto/alterado.
- Nao resolve pedidos antigos cujo conteudo difere dos dados locais atuais, conflitos reais, checkpoints pendentes ou regressao remota. Esses casos continuam bloqueados para revisao explicita, com IDs e conteudos preservados.
- A reserva e exclusiva da protecao de escrita. Reconciliacao/restauro que exija uma nova copia historica e nao caiba continua bloqueado; o hotfix nao ignora essa copia obrigatoria. Nao promete desbloquear automaticamente todos os incidentes preexistentes.
- Nao resolve os P1 de sobrescrita offline entre separadores e exportacao com base de outra instancia. As funcoes responsaveis permanecem exatas; os testes continuam a demonstrar os defeitos.
- Capacidade logica adicional nao e reserva fisica: se falta quota, permissao, codec/armazenamento suportado ou o pedido excede a reserva, bloqueia em seguranca e mantem exportacao disponivel.
- Validado no Chromium desktop/mobile, nao em Safari/iOS ou Firefox para este hotfix. Sem IndexedDB, mantem-se o percurso anterior e os seus limites. Uma implementacao que recuse `strict` nao recebe fallback inseguro.
- Reinicio significa recarregamento e reabertura normal. Nao foi executado ensaio de perda de energia, avaria fisica ou eviction; `strict` nao e promessa de ausencia absoluta de falhas.
- O formato continua legivel pelo codigo anterior, sem migracao; rollback antigo pode voltar a bloquear escritas pelo limite global, sobretudo com os registos reservados presentes. **Nao limpar esses registos para fazer rollback.**
- API, autenticacao, transporte, read tickets, CAS, B5/B6, Apps Script, precos, dados analiticos, PDFs, plantas, regras comerciais e layout permanecem inalterados. Nenhuma publicacao Google coordenada e necessaria para esta alteracao de frontend.
- Antes do push manual, confirmar as politicas Vercel de preview e a separacao de permissoes de escrita; nenhuma configuracao foi alterada nesta tarefa.

Parar para o utilizador rever, fazer o push e criar a Draft PR. Sem merge ou deployment autonomo.
