# Arquitetura experimental P5

## Referencias examinadas

Contratos P1 e contracts.v1.json, gates P3, referencias/retencao P4, COMMERCIAL_CHUNK_STORAGE, COMMERCIAL_WRITE_RECOVERY, COMMERCIAL_READ_CONTENTION e COMMERCIAL_PERSISTENCE_PERFORMANCE. Codigo operacional examinado somente para compreensao: google_apps_script.gs, server/commercial-store.js e api/commercial-data.js. Os relatorios A/B/C externos nao foram encontrados como documentos autonomos no repositorio; nao se inventam decisoes ausentes. Mantem-se as fronteiras/invariantes D01-D12 referidas pelos contratos existentes.

## Diagnostico de compatibilidade

O B6 operacional format=2 possui version, previous, receipt e legacyChecksum. BackupsVersions regista candidatos antes de B6 e nao demonstra que cada um foi ativado. A cadeia completa nao pode ser inferida desses registos sem novas provas. O teste P5-REAL-GAS-HARNESS executa o Apps Script operacional inalterado em VM: A e B gravam; recuperar A depois de B nao fornece prova historica. Tambem usa readVersion_ real para reconstruir um descritor/blocos de payload gerados pela P5.

O modelo P5 acrescenta **apenas no laboratorio** manifestos format=3 com referencia ao pai e um apontador B6 format=3. Nao converte B6 reais. Os descritores de blocos mantem format=2, indices zero-based, prefixo ':' e blocos ate 24000 unidades UTF-16 sem cortar pares surrogate.

## Modulos

| Modulo | Responsabilidade |
|---|---|
| contracts.mjs | Chaves estritas, hashes, identificacao exata, dados P2 validos, guard localhost sintetico |
| chain.mjs | Blocos, descritores, verificacao integral de ancestrais, recibos minimos |
| backend.mjs | Backend de memoria para nucleo e IndexedDB nativo com compare-exchange transacional |
| source.mjs | Fonte ficticia, lock/CAS, B5/B6, tickets, manifestos/backups e lookup somente de leitura |
| adapter.mjs | Adaptador experimental P3, fonte/credencial no closure, sem HTTP handler |

O estado duravel explicito contem Store{B2,B5,B6}, StoreVersions (linhas), BackupsVersions (descritores), Manifests (registos enderecados pelo hash), generation e lockOwner. Nao e um Map de flags committed. Reiniciar o controlador nao cria prova: apenas a verificacao do estado persistido a partir de B6 permite confirmar.

## Durabilidade e concorrencia

Cada etapa persiste uma nova fotografia por compareExchange da geracao. IndexedDB usa uma transacao readwrite strict para ler a geracao e gravar a fotografia. O lock de escritor e um dono persistido, adquirido por CAS; escritores incompativeis ou concorrentes nao ultrapassam a verificacao. Hashes/validacao/rede ficticia nao correm dentro da transacao IDB. A validacao comercial fornecida pelo controlador confiavel corre sob o lock e antes de B5; nos testes Node e a funcao real do Apps Script em VM.

As fotografias modelam etapas duraveis, nao a atomicidade de chamadas Sheets. Falhas interiores sao injetadas explicitamente, incluindo blocos parciais, quota e B6 aplicado sem resposta. As operacoes Google reais nao foram executadas nem tiveram a sua atomicidade prometida.

Leitores nao adquirem lock: capturam o estado, verificam a cadeia e reconsultam a fonte. Mudanca de geracao/Store/fonte produz UNKNOWN. Nenhuma consulta chama compareExchange, limpa B5, escreve espelhos ou muda B6.

Falha normal liberta somente o lock do proprio escritor; conserva B5 e todos os blocos/manifestos/backups. Se houver um crash que deixe o lock persistido, o sistema bloqueia, sem lease/expiracao que possa permitir dois escritores. Recuperacao administrativa desse lock nao esta implementada nem autorizada nesta fase.

## Fonte de laboratorio

Origem http://127.0.0.1 em porta 53xxx, opt-in synthetic=true. DB separada the-view-p5-lab.*, perfis descartaveis; nenhuma DB comercial e aberta. Os testes de ficheiro usam um diretorio temporario ficticio e rename atomico por etapa. Esse helper nao e um lock distribuido para processos externos.

Uma futura publicacao Google exige desenho/validacao separados de armazenamento de manifestos, limites de celula, paginacao/batching, identidade administrativa, autorizacao e coordenacao dos escritores. Esta fase nao cria tal publicacao.
