# Medicoes locais P3/P4

Execucao em 2026-11-06, dados exclusivamente sinteticos. Resultados individuais dos seis cenarios e seis combinacoes motor/viewport em [results.json](results.json). Nao foram feitas chamadas Google nem medicoes em producao.

## Metodo e unidades

- P3 e P4 usam bases separadas, IndexedDB nativo e o mesmo corpus de cada par. Nao ha delta encoding: quatro pequenas alteracoes conservam cinco corpos completos distintos.
- Tempos em ms, observados numa execucao local, sem garantia estatistica ou extrapolacao para equipamentos reais. A mediana de escrita usa quatro operacoes; o caso shared mede dois commits juntos. Carga concorrente de outras suites e particularidades dos motores afetam os tempos.
- Bytes sao corpos codificados e cabecalhos JSON dos corpos serializados em UTF-8. Nao incluem toda a metadata de workspaces, indices, audit e paginas internas do IndexedDB. Nao sao alocacao fisica nem quota livre demonstrada.
- References conta as ocorrencias estruturais workspace/instance/operation dos benchmarks, nao um contador persistido usado para GC. O inventario completo reconstroi dependencias.
- RecoveryMs mede reconstrucao do pedido original; reopenAndReadWallMs mede reabertura/releitura com overhead do controlador. Nao mede recuperacao no Google.
- CodecMetrics e uma medicao adicional independente, executada depois do benchmark em ambos os modos; nao significa que P3 tenha usado gzip durante as suas escritas.
- O historico compara a codificacao identity P2/P3 dos 22 fragmentos com a importacao experimental P4. Nao e um importador historico operacional P3. Tempos de importacao/recuperacao do historico nao foram isolados por etapa; a equivalencia integral foi testada, sem atribuir tempos nao medidos.

## Espaco, Chromium desktop

| Cenario | P3 bytes | P4 bytes | Ganho observado |
|---|---:|---:|---:|
| Pequeno, cinco corpos | 9578 | 9578 | 0% |
| Representativo, cinco corpos | 1409302 | 16225 | 98.85% |
| Quatro alteracoes pequenas | 1409302 | 16225 | 98.85% |
| Pouco compressivel | 148038 | 148038 | 0% |
| Branches partilhadas, corpo sem cabecalho | 282314 | 2859 | 98.99% |
| Historico protegido, 22 fragmentos | 7810723 | 2110853 | 72.97% |

O corpus representativo tem 65 clientes e 106 eventos ficticios, texto repetitivo deliberado e cerca de 141 mil caracteres. Os ganhos elevados dependem dessa repeticao e nao preveem ganhos numa base real. Firefox/WebKit desktop: 98.59%/98.51% no corpus representativo, 72.97% no historico.

P3 ja deduplicava corpos: duas operacoes e uma branch usam um unico corpo tanto em P3 como em P4. Nao se atribui a P4 uma economia adicional de deduplicacao inexistente nesse comparativo. A diferenca medida resulta sobretudo da compressao. Pedidos continuam independentes e reconstruiveis.

Os 15 historicos somam aproximadamente 14.84 MiB segundo a medida logica legacy. Acrescentam-se os dois slots do hotfix, gzip legacy e quatro fragmentos localStorage, incluindo alteracoes posteriores ao pedido antigo. A representacao de grafo possui uma medida diferente da medida logica legacy, pelo que os denominadores nao sao intercambiaveis. As 18 copias recovery e os 22 fragmentos permanecem intactos. **Zero bytes libertaveis por GC**, porque os formatos desconhecidos exigem revisao.

## Tempos Chromium desktop, P3 -> P4

| Cenario | Escrita mediana | Leitura | Pedido original | Exportacao | Inventario/verificacao |
|---|---:|---:|---:|---:|---:|
| Pequeno | 15.20 -> 15.35 | 2.8 -> 2.8 | 4.3 -> 3.3 | 10.8 -> 8.7 | 7.2 -> 6.6 |
| Representativo | 69.45 -> 59.65 | 11.5 -> 12.0 | 14.9 -> 16.8 | 438.1 -> 114.1 | 104.3 -> 75.8 |
| Alteracoes pequenas | 66.45 -> 53.80 | 10.1 -> 10.4 | 15.1 -> 17.6 | 424.2 -> 99.5 | 89.2 -> 77.3 |
| Pouco compressivel | 19.95 -> 25.70 | 3.6 -> 2.5 | 4.1 -> 3.9 | 51.8 -> 53.1 | 11.0 -> 9.5 |

No corpus representativo, a medicao adicional P4 do primeiro corpo registou 6.2 ms de compressao, 1.7 ms de descompressao e 8.9 ms de verificacao (inclui 3.2 ms de verificacao da origem). Cabecalho identity: 276 bytes; gzip: 368 bytes. Nao somar sourceVerificationMs novamente.

## Resultados desfavoraveis e politica

O piloto com limiar de 10% selecionava gzip para dados pouco compressiveis com apenas cerca de 12% de ganho e penalizacao de latencia. A politica final exige >=4096 bytes, >=256 bytes e >=20% de economia liquida do corpo/cabecalho. Pequenos ou pouco compressiveis mantem identity. A tentativa rejeitada ainda custa CPU: nao e uma otimizacao universal de latencia.

No WebKit desktop final, mediana representativa 765 -> 994 ms; leitura 112 -> 238 ms; exportacao 2142 -> 1200 ms. Pequeno: 736.5 -> 1035 ms; pouco compressivel: 681 -> 1150.5 ms. Metadados adicionais, fotografias completas e diferencas do motor tambem participam nesses custos; este teste nao isola causalidade de cada fator. **Nao aprovar ativacao real ou prometer melhoria global de velocidade com estas medicoes.** Afinacao por motor e amostras repetidas sao gates posteriores, sem alterar o criterio de integridade.

## Quota e capacidade

QuotaExceededError e abortos foram injetados em transacoes nativas, incluindo preparacao e troca COW. A tentativa Chromium via CDP foi limitada a 2 MiB adicionais num perfil descartavel: nao reproduziu quota nativa. Nao se encheu disco. Crash de processo Chromium foi exercitado; nao houve falha de energia. Nenhum destes resultados autoriza limpar ou compactar backups reais.
