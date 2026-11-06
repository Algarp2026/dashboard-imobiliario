# Medicoes locais P6

Execucao de 2026-11-06, Node, dados sinteticos, backends de memoria separados e projecoes reais executadas em VM. Nao sao tempos Sheets/Execution API/OAuth nem uma previsao de latencia comercial. Dados individuais, comparacoes por folha e contadores em results.json.

| Cenario | Verificar seis ms | Primeiro plano ms | Reparar seis ms | Criar copia ms | Verificar copia ms |
|---|---:|---:|---:|---:|---:|
| Base pequena | 3.81 | 8.49 | 9.86 | 17.59 | 3.20 |
| 65 clientes / 106 eventos | 17.69 | 29.74 | 49.86 | 71.88 | 11.09 |
| Historia de 100 operacoes | 54.03 | 93.96 | 181.38 | 288.13 | 54.14 |
| Eventos/precos extensos | 84.75 | 160.75 | 256.72 | 306.09 | 61.50 |
| Arquivo protegido 14.84 MiB | 4.87 | 3.46 | 6.11 | 49.89 | 11.76 |
| Espelhos parciais | 2.19 | 5.39 | 5.19 | 6.39 | 1.25 |
| Copia corrompida | 4.16 | 8.17 | 9.73 | 6.21 | 0.28, FORENSIC |

Primeiro plano reconstroi Clientes, exceto no cenario parcial, onde tambem falta Agentes (duas folhas). As listas firstRepairSheets/allRepairSheets tornam explicito o trabalho medido. A copia no ultimo cenario e criada/verificada antes da corrupcao injetada; a leitura posterior termina conservadoramente em FORENSIC.

Sao observacoes de uma execucao, sem significancia estatistica. Cache, GC e carga de outras suites explicam diferencas como um plano de seis folhas ocasionalmente mais rapido do que um de uma folha. Nao se afirma melhoria de desempenho do CRM.

## Leituras/escritas

Na verificacao comum: tres leituras de backend, zero escritas. Reparacao de uma folha: nove leituras/seis compare-exchange; seis folhas: 24 leituras/16 compare-exchange. Ha duas escritas de conteudo por folha (clear/set); os restantes commits sao lock/journal/verificacao tecnica, nao operacoes comerciais. O cenario parcial repara duas folhas no primeiro plano, com 12 leituras/oito commits.

Copia nova: tres leituras e dois commits no backend independente, alem da captura readonly da primaria. Esses commits sao STAGED (corpo+registo) e VERIFIED. **Contadores de backend nao sao RPCs Google**; o harness tambem executa as chamadas Sheets ficticias de projecao. perSheetComparisonMs mede comparacao/inferencia por folha, excluindo o custo comum de capturar a autoridade e gerar as seis projecoes na VM.

## Concorrencia

Duas verificacoes simultaneas passaram em todos os cenarios. Na fonte de 100 operacoes, o par demorou 91.58 ms; a captura intercalada com uma escrita autorizada devolveu SOURCE_CHANGED em 277.50 ms, incluindo o tempo dessa escrita ficticia. Na base de 65 clientes: 23.75 ms para o par e 44.98 ms no caso com escrita intercalada. Isso mede o cenario completo, nao so CPU de leitura.

## Capacidade da copia

| Cenario | Corpo original bytes | Corpo codificado bytes | Cabecalho do corpo bytes | Vault serializado, caracteres |
|---|---:|---:|---:|---:|
| Pequeno | 12832 | 1673 | 367 | 7189 |
| 65 clientes | 570228 | 11980 | 369 | 44361 |
| 100 operacoes | 913388 | 75973 | 369 | 276061 |
| Eventos/precos extensos | 2899286 | 43273 | 370 | 158929 |
| Arquivo protegido | 12832 | 1678 | 367 | 7789058 |

Um corpo unico por copia inicial; copias identicas podem partilha-lo. Os bytes originais/codificados sao do pacote completo (dados, raw, versoes, provas, B5 e metadados), nao apenas JSON comercial. Os cabecalhos sao apenas parte dos metadados. Arrays numericos usados para persistir bytes em JSON, registos e indices podem aumentar o custo. Nao se infere alocacao fisica ou quota livre a partir destes valores.

O cenario de 14.84 MiB usa a medida logica UTF-16 legacy para quinze arquivos protegidos. O hash dos quinze permanece igual antes/depois; nao sao comprimidos, confirmados ou eliminados. A compressao acima aplica-se somente ao novo pacote verificado. A serializacao JSON do vault inclui o arquivo protegido, pelo que nao e comparavel diretamente ao tamanho desse corpo novo.

## Memoria e escalabilidade

heapUsedBefore/After sao medicoes locais do processo, sujeitas a GC, nao pico de memoria. sourceSnapshotCharacters e uma dimensao de representacao logica; nao e RSS nem ocupacao fisica. Snapshot, projecao, hashes e compressao criam copias temporarias e crescem com o volume/historico.

Guardar toda a imagem de autoridade conserva provas e preparacoes, mas pode atingir o limite P4 de 32 MiB por corpo antes de o JSON atual atingir um limite remoto. Esse caso falha sem truncar ou apagar copias anteriores. Batching/segmentacao/retencao de uma futura copia real exigem projeto e autorizacao separados, nao foram ativados nesta fase.

Quota foi injetada em transacoes nativas; crash foi de processo Chromium em perfil descartavel. Nao houve teste de esgotamento fisico do disco, falha de energia, servico Google ou redundancia real entre fornecedores.
