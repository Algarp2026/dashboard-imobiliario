# Armazenamento comercial por versoes completas

Estado: implementado e testado localmente com dados ficticios. Nao houve leitura/importacao dos ficheiros de recuperacao, alteracao de credenciais, gravacao em Google Sheets, migracao ou deployment nesta intervencao.

## Estrutura e protocolo

- `Store!B2`: JSON legado, nunca escrito, truncado ou apagado pela nova implementacao. Sem B6, continua a ser a fonte de leitura.
- `Store!B3/B4`: metadados legados, preservados. Deixam de representar a versao nova; os consumidores devem usar a API.
- `Store!B5`: intencao de gravacao, com requestId, revisoes, timestamp e descritores verificados. Uma intencao antiga sem format=2 bloqueia operacoes e exige investigacao, nunca limpeza automatica.
- `Store!B6`: pequeno manifesto ativo format=2: descritor da versao, descritor anterior, recibo da operacao e checksum do B2 legado. E o unico ponto de ativacao.
- `StoreVersions`: linhas imutaveis, sem cabecalho: checksum SHA-256 completo, indice do bloco (zero-based), texto prefixado com `:`. Cada bloco tem no maximo 24.000 unidades UTF-16, mais um caracter de prefixo. Pares surrogate nao sao separados; o prefixo impede interpretacao de formulas.
- `BackupsVersions`: timestamp, descritor anterior, descritor novo, metadados da operacao. Os JSON completos ficam nos blocos, nao nesta tabela. A folha `Backups` antiga nao e alterada. Os descritores indicam primeira linha, numero de blocos, comprimento, checksum e timestamp.

Todos os dados do JSON, incluindo campos desconhecidos, sao conservados. A serializacao das novas versoes ordena chaves para manter o protocolo SHA-256 existente; nao preserva indentacao textual. O primeiro backup legado conserva o texto original, incluindo espacos exteriores.

Gravacao: autenticar e validar gates/ambiente/payload; adquirir ScriptLock; verificar revisao e requestId; guardar intencao; preservar a versao anterior em blocos; escrever a candidata completa; reler, reconstruir, validar JSON e checksum; guardar e reler o indice de backup; atualizar espelhos; validar novamente os blocos; escrever e reler B6; confirmar a versao; limpar a intencao; devolver persisted=true. Nenhum endpoint novo foi aberto.

Antes de B6, qualquer falha deixa a fonte anterior ativa e legivel. Uma falha depois de B6 pode significar commit efetuado sem resposta: `crmRecover` confirma o mesmo recibo e conclui a limpeza, sem duplicar dados. A versao anterior permanece nos blocos. Nao se pode prometer rollback depois de um commit cuja resposta se perdeu.

Os espelhos nao sao transacionais e podem ficar parcialmente atualizados numa tentativa falhada. A API nunca le os espelhos; a repeticao da operacao original reconstroi-os antes da ativacao. Backups indexados antes do commit sao candidatos, nao prova de ativacao; B6 e a autoridade.

## Compatibilidade e divergencias

Sem B6, a leitura de B2 funciona sem criar folhas ou migrar. A primeira gravacao autorizada que efetivamente altere dados cria as versoes e o manifesto; as gates atuais continuam obrigatorias. Uma leitura ou `testWrite()` sem argumentos nao inicia migracao. `testWrite(request)` encaminha para o mesmo CAS/autenticacao/gates de `crmWrite`, sem caminho direto de escrita.

B6 invalido ou bloco corrompido falha fechado: nunca volta automaticamente ao B2 antigo. O checksum do B2 e comparado em cada operacao apos migracao para detetar um escritor legado. Essa deteccao nao substitui a revisao administrativa de publicacoes antigas.

O browser bloqueia a substituicao se faltarem clientes/eventos/agentes existentes localmente, se houver registos divergentes sem uma operacao pendente, timestamps locais posteriores ou diferencas em precos/estados/historicos/comissoes locais. Preserva a chave atual, guarda as duas versoes no backup local e arquiva backups anteriores diferentes. A resolucao usa o modal existente, exportacao e confirmacao explicita. Uma base sem ancestral conhecido nao pode ser fundida automaticamente. Divergencias legitimas tambem podem pedir revisao: e uma escolha conservadora. Se localStorage estiver cheio, a substituicao e bloqueada; exportar copias antes de libertar espaco.

## Validacao executada

Executar com Node:

```
node tests/commercial-chunk-storage.test.js
node tests/commercial-capacity.test.js
node tests/commercial-concurrency.test.js
node tests/commercial-sync-api.test.js
node tests/commercial-write-integrity.test.js
node tests/commercial-sync-client.test.js
node tests/google-read-check.test.js
node --check commercial.js
node --check app.js
node --check config.js
```

- Base ficticia de 160.553 caracteres, 63 clientes, 86 eventos e um agente; campos desconhecidos, Unicode, precos e historicos preservados.
- Comprimentos exatos 40.000, 49.000, 50.000, 60.000, 100.000 e 160.000: leitura/gravar/reler/backup integral e diagnostico apenas de leitura.
- Falhas antes/parcialmente durante blocos, corrupcao, antes/depois do indice de backup, antes do apontador e nos espelhos: fonte anterior preservada, recuperacao da mesma operacao e idempotencia.
- Resposta perdida depois de ativar B6: recuperacao confirma o commit sem duplicar backup.
- Restauracao de JSON de uma versao anterior como nova gravacao CAS; revisao obsoleta recusada.
- Corrupcao da versao ativa e escritor legado detetados; sem fallback silencioso.
- Dois browsers, API real do repositorio e Apps Script executado numa VM: primeiro 200, segundo 409, cache local preservada, ticket manipulado 403 e novo conflito depois de reconciliacao concorrente.
- Base local com 63 clientes versus remota com 24, registo diferente sem timestamp, data local mais recente e preco diferente: substituicao bloqueada.

Google Sheets e OAuth sao simulados. Nenhuma destas verificacoes comprova quotas, latencia ou permissoes na conta Google real. Os testes existentes de capacidade da fase anterior foram atualizados para o novo contrato.

## Procedimento futuro de migracao dos 63 clientes (NAO EXECUTADO)

1. Obter autorizacao separada para a migracao. Manter todas as gates de escrita desativadas enquanto se prepara e valida. Suspender edicoes durante a janela aprovada.
2. Preservar as duas copias recuperadas em armazenamento privado independente do browser/Sheet. Verificar localmente SHA-256 identico, JSON valido, IDs unicos, 63 clientes, 86 eventos, um agente e preco comercial do Apt. 2 de 615.000 EUR. O comprimento original esperado e 134.722, mas a serializacao canonica pode ter outro comprimento. Nao colocar ficheiros, payloads ou segredos no Git, logs ou PR.
3. Exportar privadamente o estado atual completo da Sheet e das folhas Store/Backups. Registar apenas hashes, contagens e revisao em relatorios. Preservar o B2 original e verificar que B6 nao contem dados alheios.
4. Criar uma Sheet e um projeto Apps Script de TESTES isolados, com dados ficticios. Instalar o codigo desta branch, OAuth/API Executable autenticados e todas as gates inicialmente false. Repetir os testes de escrita/recuperacao com >150.000 caracteres nessa fonte, ativando apenas as gates de teste mediante autorizacao. Ver guia `COMMERCIAL_SYNC_FINAL_CHECKS.md` para configuracao Google; a antiga recomendacao de armazenamento numa celula foi substituida por este documento.
5. Rever versoes publicadas do Web App `/exec`, API Executables antigos, outros projetos Apps Script, triggers, extensoes e acessos diretos a Sheets. Codigo atualizado no editor nao atualiza publicacoes versionadas antigas. Nao reativar escrita de producao enquanto houver um escritor antigo que possa contornar a revisao. Revogacoes/republicacoes exigem autorizacao; nenhuma foi feita aqui.
6. Depois de aprovacao, instalar a versao revista em producao com gates ainda false. Validar leitura autenticada e o diagnostico `scripts/measure-store-read-only.gs`: devolve apenas dimensao, contagens e revisao da fonte ativa, sem dados pessoais; suporta B2 e B6. A leitura nao escreve nem migra.
7. Preparar privadamente o payload completo recuperado, preservando todos os campos. Nao usar o merge automatico para substituir a base real a partir de um ancestral desconhecido. Rever a diferenca integral com a fonte atual e aprovar explicitamente a substituicao. Nao inserir o JSON em B2.
8. Na janela autorizada, ativar as gates adequadas, autenticar, fazer GET em `/api/commercial-data` e obter revisao/ticket frescos. Enviar POST same-origin autenticado `{action:'save', requestId:<id unico>, baseRevision:<revisao lida>, data:<objeto completo aprovado>}` com `X-CRM-Read-Ticket`. Nao contornar o endpoint com um setValue manual. Uma revisao que mudou exige nova leitura/revisao, nunca overwrite forcado.
9. Exigir resposta persisted=true, requestId e hash corretos. Reabrir noutro browser, confirmar 63/86/1, preco 615.000 e comparar o JSON completo semanticamente com a copia aprovada. Confirmar backup legado em blocos, B2 byte-a-byte intacto, B6 valido e seis espelhos. Desativar gates se houver qualquer divergencia. Fechar a janela somente apos confirmacao independente.
10. Em timeout, conservar payload e requestId e usar `action:'recover'` da mesma operacao autenticada; nao criar IDs sucessivos nem limpar B5. Em corrupcao/manifesto invalido, parar e recuperar numa copia isolada com apoio administrativo. Nunca apagar B6 para forcar fallback ao B2 antigo.

## Recuperacao de uma versao anterior

Com autorizacao administrativa, selecionar o descritor de uma versao conhecida em BackupsVersions/B6.previous, reconstruir os blocos e validar comprimento, indices, JSON e SHA-256. Exportar privadamente e verificar o resultado. Se a fonte ativa estiver saudavel, restaurar esse objeto como uma NOVA gravacao pela API, com ticket/revisao atuais e requestId novo; o estado substituido recebe o seu proprio backup. Nao apontar B6 manualmente para uma versao velha, pois isso descartaria o recibo da operacao.

Se a versao ativa estiver corrompida, a API bloqueia operacoes normais: e necessaria reparacao administrativa revista numa copia isolada. Nao existe endpoint publico de recuperacao arbitraria de backups nem fallback automatico.

## Limites e riscos pendentes

- Limite por celula continua 50.000; blocos usam 24.001 no maximo. Limite total preventivo 900.000 caracteres, abaixo do envelope de 1.000.000 da API. O limite total nao e uma quota Google.
- Uma celula de espelho com texto individual >50.000 continua a causar recusa segura antes da ativacao. O JSON original nao e truncado. Validar esse caso nos dados reais antes da migracao; uma politica de apresentacao de textos longos nos espelhos precisa de decisao separada.
- Versoes sao append-only; nao ha limpeza automatica. Monitorizar espaco/quotas da Sheet. Tentativas interrompidas podem deixar blocos orfaos inativos, que nao sao apagados automaticamente.
- A folha de blocos cresce por insercao de linhas no fim, sem mover versoes existentes, usando os metodos oficiais [getMaxRows/insertRowsAfter](https://developers.google.com/apps-script/reference/spreadsheet/sheet). Quotas ou falhas nessa extensao recusam a ativacao.
- ScriptLock protege os participantes do mesmo projeto Apps Script. Outros projetos e edicoes manuais nao respeitam esse lock. Nao eliminar/reordenar linhas em StoreVersions nem editar manifestos.
- Backups na mesma Sheet nao protegem contra exclusao da Sheet/conta. Manter copias privadas independentes.
- Revisao continua a ser hash do conteudo, conforme protocolo existente, nao um contador monotono. Restaurar exatamente um conteudo anterior produz o mesmo hash; o ticket e a revisao devem ser relidos em cada recuperacao aprovada.
- Ainda falta validacao numa Sheet real de TESTES e revisao/aprovacao deste PR antes de qualquer migracao/publicacao.
