# Seguimento geral

O modelo atual distingue quem responde (cliente, equipa, ninguém), pendência,
última interação, início da espera, observação e lembrete. Os dois contadores
usam datas de calendário e o de espera fica inativo sem pendência.
`priorityHistory` é independente, tal como o estado comercial por fração.
Decisões antigas mantêm-se legíveis e um estado interno neutro não é colapsado
no outro. A decisão de contacto explícita tecnicamente posterior pode vencer a
de seguimento; corrigir uma comunicação retroativa não cria decisão manual
posterior. Mantiveram-se as regras aprovadas de precedência.

## Defeito reproduzido e correção

Cliente legado, sem `followupV1`: escrever e apagar uma observação, guardar.
Antes: o formulário criava uma versão de seguimento a partir dos valores
visíveis e enviava um POST. Agora: a primeira edição guarda a referência dos
campos visíveis; o submit compara os valores, elimina o rascunho revertido e não
grava. Uma alteração exclusiva de prioridade mantém `followupV1` ausente.
Ao guardar observação sem tocar na data de interação, a data visível continua
derivada; não é copiada como decisão manual. Campos originais e desconhecidos
mantêm-se. Não se alteram decisões ou datas já persistidas automaticamente.

A referência para concorrência continua a incluir `followupV1`,
`contactStateHistory` e `priorityHistory`. Um retry após gravação local
conserva a decisão já criada em vez de voltar a anexá-la ao histórico. O caminho
de gravação e a prova de confirmação remota são os existentes.

## Evidência

`commercial-client-followup.test.js`: quatro estados, dois contadores,
histórico de lembrete, datas efetivas, campos desconhecidos, entrada legada,
compatibilidade com a fonte e sincronização de segunda sessão.
`commercial-profile-followup-browser.mjs`: lembretes, pendência, observação,
refresh, edição concorrente e preservação da alteração local.
`commercial-active-write-browser.mjs`: exportação da alteração local e pedido
pendente após falha. Não equivale a exportar campos ainda não submetidos.
`commercial-pr6-regression-browser.mjs`: comunicações retroativas, decisão
manual posterior, edição histórica e refresh.
`commercial-p7-browser.mjs`: cliente sem seguimento, edição revertida sem POST,
prioridade, observação, data derivada, refresh e ausência de efeitos laterais.
