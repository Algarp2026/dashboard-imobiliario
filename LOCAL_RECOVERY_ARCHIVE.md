# Arquivo local: capacidade, recuperacao e exportacao

## Origem e restricoes

Branch `codex/fix-local-recovery-archive`, criada da main `54dfd0a55e643dfeda0a4589ad8b7e050b565a03`, confirmada no GitHub antes do trabalho. A PR visual #24 nao faz parte desta base e nao foi alterada. Sem acesso a arquivos reais, Google Sheets, Apps Script ou configuracoes de producao; testes exclusivamente ficticios.

## Diagnostico

O incidente relatado em 30/10/2026 e coerente com um limite interno, nao com indisponibilidade da rede: 17 registos legacy, quatro before-remote e um conflict protegidos ocupavam aproximadamente 15,67 MiB, perto de `LOCAL_BACKUP_BYTES = 16 * 1024 * 1024`.

O codigo anterior:

- Protegia por defeito todos os arquivos de pre-leitura, conflitos e migracoes, sem reconhecer posteriormente muitos conteudos ja confirmados.
- A confirmacao de um pedido desprotegia apenas write-request, deixando checkpoints equivalentes protegidos.
- A confirmacao de checkpoint limpava flags de outras copias por comparacao de datas, nao exclusivamente da copia revista.
- Convertia a rejeicao de capacidade em boolean false, depois em LOCAL_STORAGE_FAILED; a interface apresentava genericamente Sem ligacao.
- Revogava o URL Blob imediatamente depois do clique de download.

A reproducao isolada usa IndexedDB real no Chrome: exatamente as 22 copias protegidas e dimensao proxima de 15,67 MiB; uma nova copia que ultrapassa 16 MiB e recusada sem alteracao das existentes. O comportamento tambem e testado com 16 MiB completos. A confirmacao da causa refere-se ao codigo e a reproducao ficticia; nao e uma nova auditoria do navegador real do utilizador.

## Politica de retencao

Os limites nao foram aumentados: 64 registos, 16 MiB estimados, cinco copias confirmadas elegiveis. A estimativa contabiliza UTF-16 do raw, signature e rawChecksum; nao equivale a quota fisica do Chrome.

1. Conteudos equivalentes, incluindo identificadores e campos desconhecidos, nao criam novas copias em chamadas sequenciais. A comparacao ignora somente datas de preparacao e a data de ultima confirmacao no fingerprint semantico, mantendo o raw original.
2. SHA-256 semantico serve a deduplicacao. Novas copias recebem tambem rawChecksum para proteger o raw completo, incluindo metadados. Copias antigas continuam legiveis sem alterar os seus bytes ou identificadores.
3. A classificacao automatica de copia confirmada exige dados e base iguais, ausencia explicita de pedido e de alteracoes pendentes, esquema de envelope conhecido e correspondencia com uma revisao/conteudo efetivamente confirmados pela fonte nesta sessao. Um texto de revisao com 64 caracteres nao constitui prova. remoteData, quando presente, tambem deve corresponder a uma confirmacao conhecida. A prova em memoria tem retencao maxima de oito revisoes, nao altera o CRM.
4. Campos desconhecidos no envelope/metadados ou ausencia de prova impedem a desprotecao automatica. O nome legacy nunca autoriza descarte.
5. Uma resposta efetiva de gravacao pode desproteger as copias do MESMO requestId, baseRevision e conteudo integral confirmado, incluindo checkpoints correspondentes. O recibo local do pedido tem de estar integro e continuar identico dentro da transacao; caso contrario a confirmacao local e bloqueada e o pedido original e preservado. Copias sem pedido podem ser reconhecidas como incorporadas somente se forem iguais ao conteudo efetivamente gravado ou se a reconciliacao pura, sem conflitos, reproduzir exatamente esse conteudo a partir da base local e da base remota validada para o CAS. A origem da confirmacao fica registada nos metadados do arquivo. Copias com dados mais recentes, envelopes desconhecidos, conflitos nao resolvidos ou outros pedidos continuam protegidas. O pedido original no localStorage nao e alterado por esta classificacao.
6. A retencao reduzida remove exclusivamente copias confirmadas verificadas e sem revisao pendente, na mesma transacao que grava a nova copia. Abortos revertem inclusoes e remocoes. Leituras de verificacao confirmam a copia gravada.
7. Checkpoints novos recebem uma ordem monotonica local, atribuida dentro da transacao, para nao depender de timestamps iguais ou de um relogio que recua. Registos antigos sem essa ordem continuam suportados. A confirmacao de checkpoint incide apenas no id/raw/ordem efetivamente revistos.

O object store e o nome/versao do IndexedDB permanecem os mesmos. rawChecksum e checkpointOrder sao metadados aditivos do arquivo local, nao campos de clientes/eventos nem uma migracao comercial. Nenhum arquivo antigo e reescrito em massa.

### Consulta com arquivo cheio

Uma copia redundante de uma base comprovadamente confirmada pode ser dispensada se o unico erro for LOCAL_BACKUP_CAPACITY. A leitura fresca continua sujeita a todas as verificacoes existentes, ao controlo de mudancas locais e a commitLocalCache. Nenhuma alteracao local nao confirmada ou pedido beneficia desta excecao. O aviso de capacidade permanece visivel, mesmo quando a base partilhada foi verificada.

Sem prova suficiente, a substituicao local continua bloqueada. A leitura remota obtida e preservada no estado de consulta e a ligacao e distinguida do armazenamento; o procedimento administrativo abaixo permite libertar espaco sem apagar dados atuais. Nao ha bypass de CAS, read tickets, revisoes ou pedidos de resultado desconhecido.

## Erros e ligacao

| Codigo | Significado / acao |
| --- | --- |
| LOCAL_BACKUP_CAPACITY | Limite interno atingido; exportar, verificar ficheiro e gerir copias elegiveis |
| LOCAL_STORAGE_FAILED | Falha real de cache/armazenamento, incluindo quota efetiva do navegador; manter pagina e exportar |
| LOCAL_VAULT_UNAVAILABLE | IndexedDB recusado/indisponivel; verificar permissoes e preservar copia local |
| LOCAL_VAULT_BLOCKED | Abertura bloqueada; fechar outros separadores e voltar a tentar |
| LOCAL_VAULT_ABORTED | Transacao interrompida, sem limpeza confirmada |
| LOCAL_VAULT_TIMEOUT | Prazo local excedido; nao assumir operacao confirmada |
| LOCAL_BACKUP_INTEGRITY / UNVERIFIABLE | Conteudo nao verificavel; preservar arquivo e pedir revisao |
| LOCAL_BACKUP_CHANGED | Ficheiro ja nao corresponde ao arquivo/cache/memoria atuais; reexportar |
| LOCAL_BACKUP_PROTECTED | Pedido ou ultimo checkpoint nao elegivel para remocao administrativa |

O codigo original e preservado ao atravessar os caminhos de backup e de escrita. sourceReachable representa leitura remota bem-sucedida; archiveWarning conserva o diagnostico local independentemente de novos GETs. Uma falha exclusivamente local deixa de receber a legenda Sem ligacao. verified e as condicoes de autorizacao de escrita nao sao enfraquecidos. A interface distingue preparacao de ficheiro de confirmacao remota.

## Exportacao e verificacao

- Exportar copia local conserva o recoveryFormat 1 existente: data, base, pedido original e metadados selecionados, sem tickets ou cookies de autenticacao.
- Exportar arquivo local produz recoveryArchiveFormat 2: todos os registos, incluindo protegidos, current (tambem a memoria atual) e localEntries com os valores originais das chaves CRM relevantes. O arquivo contem informacao confidencial e deve ser guardado com acesso restrito.
- O SHA-256 do manifesto cobre todos os campos exportados. A verificacao posterior exige selecionar o ficheiro guardado e compara manifesto, todos os registos, valores das chaves e memoria atual. Mudancas concorrentes invalidam a autorizacao de limpeza.
- O link de download continua disponivel na pagina. O URL nao e revogado imediatamente apos o clique; substituicao/fecho adiam a libertacao por 60 segundos. Um clique automatico recusado deixa um link manual, sem exigir desbloquear pop-ups.
- A mensagem e Exportacao preparada, nao Backup concluido. O sucesso real de download so e observavel pelo teste de navegador; a aplicacao nao inventa essa confirmacao. A leitura posterior do ficheiro e a confirmacao do utilizador sao exigidas para remover copias.
- Falha na leitura do arquivo interrompe a exportacao completa com aviso explicito; nao substitui silenciosamente um arquivo integral por uma copia parcial. Exportar copia local continua independente do acesso ao IndexedDB.

## Operacao administrativa segura

1. Nao limpar localStorage, pedidos ou o IndexedDB pela consola. Nao restaurar nada sobre a Sheet.
2. Em detalhes de sincronizacao, utilizar Exportar arquivo local; guardar em local restrito e manter uma segunda copia externa.
3. Utilizar Verificar arquivo externo e gerir espaco e selecionar o ficheiro acabado de guardar. O sistema exige igualdade com o arquivo/cache/memoria atuais.
4. Selecionar apenas copias historicas a manter exclusivamente no arquivo externo. Pedidos, copias nao interpretaveis e o ultimo checkpoint ficam desativados. Confirmar explicitamente o numero de copias a retirar.
5. A operacao so remove os IDs selecionados do IndexedDB. Revalida o estado dentro da transacao. Se outra aba alterar o arquivo ou os dados, nada e removido por essa tentativa. Os clientes, eventos, precos, estados, cache e pedidos nao sao modificados.
6. Manter ambos os ficheiros externos. Voltar a tentar a leitura da fonte. Se existir pedido pendente, seguir o diagnostico existente; nao trocar IDs nem reutilizar conteudos.
7. Um pedido criado antes de uma falha de arquivo pode nunca ter sido enviado. Apos libertar espaco, fazer leitura fresca e seguir Sincronizar quando autorizado; nao forcar uma recuperacao de operacao inexistente nem limpar o pedido. Resultado desconhecido exige o fluxo de recuperacao existente e revisao.
8. Confirmar contagens, revisao e ausencia de duplicacoes; nao realizar qualquer escrita real sem aprovacao operacional.

Esta PR nao executa os passos num navegador real do utilizador.

## Arquivo manual v1 do incidente

O ficheiro the-view-browser-backup-manual-v1 deve ser preservado exatamente como foi criado, com copia adicional e SHA-256 do ficheiro. A nova interface NAO importa esse formato nem o usa para uma limpeza automatica.

O utilitario abaixo apenas le ficheiros locais, valida estrutura/IDs e compara todos os campos. Imprime contagens e hashes, nunca raws, nomes, contactos, precos, identificadores ou credenciais:

```text
node scripts/verify-browser-archive.cjs CAMINHO_DO_ARQUIVO
node scripts/verify-browser-archive.cjs PRIMEIRA_COPIA SEGUNDA_COPIA
```

Manual v1 e reconhecido pelo identificador e campos copies (registos id/raw) e localStorage ou localEntries. Se a estrutura for diferente, o utilitario recusa e exige mapeamento administrativo explicito; nao normaliza nem altera o original. Nao existe manifesto SHA no formato manual: o utilitario informa essa limitacao e calcula o SHA do ficheiro. Comparar duas copias identicas confirma a preservacao externa, nao prova por si so a recuperabilidade comercial ou a atualidade perante a Google Sheet. Uma comparacao inclui tambem snapshots de memoria e metadados desconhecidos; nao considera dois arquivos iguais apenas porque as contagens coincidem.

Para futura recuperacao: trabalhar primeiro numa copia isolada, reconstruir cada raw conservando id/tipo/flags/checksums e os pedidos originais, identificar divergencias, validar contra leitura autenticada autorizada e obter aprovacao para qualquer importacao. Nao executar Apps Script sobre a copia nem sobrescrever a fonte real como teste. Esta PR nao implementa importacao automatica ou restauracao de producao.

## Testes e evidencias

| Execucao | Resultado real |
| --- | --- |
| Catalogo Node completo | 63/63 suites aprovadas |
| Catalogo de navegador completo | 29/29 suites aprovadas |
| Suite especifica repetida apos os ultimos reforcos | Aprovada, incluindo aviso de capacidade, recibo original e reconciliacao incorporada |
| Sintaxe JS/CJS/MJS | 140 verificacoes aprovadas |
| Diff | Sem erros de whitespace; dados, backend, modelos comerciais e ficheiros visuais protegidos inalterados |

[Node](docs/local-recovery-archive/node-results.json), [navegador](docs/local-recovery-archive/browser-results.json), [arquivo](docs/local-recovery-archive/archive-results.json) e [repeticao direcionada final](docs/local-recovery-archive/archive-final-targeted-results.json) contêm apenas resultados/contagens, nao backups nem dados de clientes. O hash do commercial.js testado coincide com o ficheiro final. Os campos de base do agregador historico referem auditorias anteriores; a base desta branch e 54dfd0a e o guard recovery-archive-source reconstitui exatamente essa versao fora dos trechos locais revistos.

Evidencias sao exclusivamente ficticias. A suite nova usa IndexedDB nativo e downloads do Chrome; eventos de abertura bloqueada e timeouts sao injetados/relogio controlado, nao medicoes de falha fisica do disco. Nenhum resultado e apresentado como validacao da base real. Uma fixture de conflito foi corrigida para usar um preco ficticio definido/finito em vez de undefined; a exigencia de preservar o conflito foi mantida.

Comandos:

```text
node tests/commercial-client-complete-regression.cjs
node tests/commercial-browser-regression.cjs
node --check commercial.js
```

A suite nova cobre as 22 copias, 15,67/16 MiB, rejeicao sem alteracao, deduplicacao, retencao confirmada, pedidos pendentes, confirmacao exata, checkpoints mais recentes/mesmo milissegundo, corrupcao, dois separadores, limpeza abortada, arquivo completo, comparacao do ficheiro, falha de preparacao/download e fallback, IndexedDB indisponivel/bloqueado/timeouts e consulta automatica sem POST indevido. As suites existentes continuam a cobrir perda de resposta, idempotencia, CAS, read tickets, reconciliacao, precos/historicos, reservas e vendas.

## Diff, publicacao futura e riscos

- Runtime alterado apenas em commercial.js: arquivo local, exportacao e classificacao de falhas. O protocolo e os validadores comerciais nao mudam. Um guard com hashes dos trechos revistos reconstitui a main e exige igualdade integral fora desses trechos; os guards anteriores de loading/PDF continuam ativos.
- Novos testes/helpers, verificador offline e este relatorio. vercel.json acrescenta apenas a exclusao de deployment desta branch.
- Nenhuma alteracao de API/server, Apps Script, integridade Google, autenticacao, data.json/data.xlsx, precos, estados, modelos CRM, plantas, HTML ou CSS.
- Copias antigas ambiguas permanecem protegidas. Se todas forem pedidos de resultado desconhecido, sera necessaria revisao/confirmacao desses pedidos; nao ha limpeza forcada para obter espaco.
- Corrupcao previa nao e reparada automaticamente. SHA-256 prova integridade/comparacao, nao autentica a origem de um ficheiro malicioso. Guardar arquivos de dados pessoais com permissoes restritas.
- Uma corrida entre gravacoes equivalentes pode conservar uma copia adicional se ainda nao existir prova verificada da outra transacao; prefere-se redundancia a descarte incerto. O limite continua a ser imposto, sem crescimento ilimitado.
- IndexedDB e ficheiros continuam sujeitos a permissoes, quota fisica e falhas do dispositivo. Testes nao simulam perda fisica de energia nem todas as politicas de download empresariais. Validar Safari/iOS separadamente; Chrome desktop e o alvo solicitado.

Apos eventual merge AUTORIZADO: preservar primeiro uma exportacao externa verificada; publicar apenas o frontend de forma controlada; testar com fonte ficticia antes de operar no navegador real; verificar leitura, classificacao e exportacao, depois os fluxos pendentes conforme aprovacao. Nao e necessaria publicacao de Apps Script nem migracao de Google Sheets. Rollback do frontend nao reintroduz copias ja arquivadas externamente: manter os ficheiros. Versoes antigas leem o mesmo object store mas podem voltar a apresentar a politica antiga de capacidade. Nenhum merge, deployment ou recuperacao real foi executado nesta etapa.
