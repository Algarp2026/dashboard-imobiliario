# Medicoes de consulta historica

Execucao local de 2026-11-06, Node, dados ficticios pequenos e backend de memoria com snapshots duraveis equivalentes ao modelo. A validacao comercial durante a construcao usa o Apps Script atual em VM. **Nao sao tempos Google, OAuth ou rede de producao.** Dados detalhados em results.json.

| Operacoes confirmadas | Mais recente ms | Mais antiga ms | Inexistente ms | Manifestos numa consulta completa | Leituras logicas |
|---|---:|---:|---:|---:|---:|
| 1 | 1.82 | 1.28 | 1.27 | 2 | 8 |
| 10 | 3.76 | 4.95 | 4.37 | 11 | 35 |
| 100 | 37.30 | 28.50 | 27.17 | 101 | 305 |

GENESIS tambem e examinado. Mais recente e mais antiga verificam a cadeia inteira; nao se interrompe a verificacao quando se encontra o alvo. Nenhum indice de recibos foi criado. As 100 operacoes formam um historico crescente, sem descartar as anteriores; a construcao completa demorou aproximadamente 12.71 segundos neste ensaio final. Uma execucao anterior sob outra carga mediu 55.34 ms na consulta recente de 100 operacoes; nao se trata de uma amostra estatistica nem de garantia de velocidade.

## Custo e memoria

| Operacoes | Verificacao na consulta recente ms | Snapshot fonte, caracteres | Estimativa de representacao temporaria, bytes |
|---|---:|---:|---:|
| 1 | 0.86 | 7555 | 17046 |
| 10 | 2.68 | 45084 | 92104 |
| 100 | 29.95 | 421220 | 844380 |

verificationMs soma as etapas instrumentadas de integridade (apontador, manifestos, blocos e identidade original); totalMs inclui outras validacoes/copias e o controlador. Nao e uma medicao de CPU pura. A estimativa temporaria e 2*(caracteres do snapshot serializado + maior texto reconstruido), uma medida de representacao UTF-16, nao heap alocado real nem memoria maxima garantida. heapUsedBefore/After sao observacoes adicionais, sujeitas a GC, nao pico de memoria.

reads conta acessos logicos a metadata/descritores/blocos dentro de snapshots e as duas leituras do backend. **Nao corresponde a 305 RPCs Google**. O backend IDB le uma fotografia numa transacao; uma futura fonte Sheets devera validar paginacao/batching e limites reais.

## Limites exercitados

Com profundidade limitada a 1/5/50, os historicos de 1/10/100 devolveram UNKNOWN em aproximadamente 0.73/2.79/15.49 ms. Com o manifesto ativo em falta, UNKNOWN em 0.33/0.46/0.97 ms. Nao se concluiu NOT_FOUND a partir de cadeia truncada. O teste dirigido tambem excede um orcamento cooperativo minimo e exige UNKNOWN.

Defaults: 256 manifestos incluindo GENESIS, 5000 ms cooperativos; maximos aceites 512 e 10000 ms. Inspecao de preparacoes para provar ausencia limitada a 1024 manifestos. Nao ha cancelamento preemptivo de armazenamento, memoria constante ou promessa de desempenho para centenas de payloads grandes.

## Escalabilidade pendente

O custo de uma consulta e linear no historico e nos bytes verificados; preparar muitas escritas repete verificacoes e pode ter custo cumulativo quadratico. A fotografia da fonte cresce porque nao ha pruning. Um futuro indice/batch pode acelerar localizacao, mas nao substituir prova B6 nem converter ausencia do indice em NOT_FOUND. Esta entrega mede o comportamento conservador, nao o otimiza por atalhos.

Os testes de navegador usam Chromium/Firefox/WebKit com fonte ficticia persistida em IndexedDB e validam semantica, reinicio e quota injetada. Nao se apresentam os tempos Node acima como latencia dessas interfaces, de Safari/iOS real ou da infraestrutura Google.
