# Comparador e recomendacoes de outubro de 2026

Base: `658da6f038f061aad5f532cb66c98c529591dfe1` (main, PR #18).
Atualizacao de integracao: main `e604861` (PR #19), preservada integralmente.
Branch independente: `codex/update-comparator-belaformosa`.
Sem merge, deployment, acesso a Google Sheets ou alteracoes no CRM.

## Dados e preservacao

A folha `Dados` de `data.xlsx` continua a ser a fonte canonica. `data.json` e
gerado por `scripts/data_workbook.py`; nao existe uma segunda tabela runtime
de precos ou estacionamento em JavaScript.

- 39 recomendacoes substituidas exatamente pela tabela da gestao.
- Total recomendado: **27.395.000 EUR**, incluindo os seis produtos fora de comercializacao.
- PVP originais, valores propostos/alvo e todos os restantes dados originais
  das 39 fracoes preservados, exceto os campos autorizados de analise/garagem.
- Versao de analise `2026-10`; justificacoes anteriores mantidas como contexto
  historico, com identificacao clara da decisao da gestao.
- Apt. 3 e 11: `Sem estacionamento`. O lugar `P0Inf — Lugar 02` fica sem
  atribuicao. Restantes garagens inalteradas: 39 lugares associados, sem duplicacao.
- Apt. 30–35: `Fora de comercializacao` na analise, como anteriormente.
  Nao foram lidos ou alterados os seus estados na base comercial.
- 280 registos concorrenciais anteriores preservados; apenas metadados aditivos
  de localidade/fonte foram acrescentados onde verificados.
- Acrescentados 216 BelaFormosa: 60 LB, 48 LF, 60 RB e 48 RF.
- Concorrencia externa: **280 -> 496**; linhas totais com The View: **319 -> 535**.
- BelaFormosa: 180 convencionais, 32 rooftops, 4 duplex e 20 reservas.
  Reservas nao sao vendas nem ofertas ativas.

O PDF original tem sete paginas e foi identificado por SHA-256, registado em
[source-manifest.json](docs/belaformosa/source-manifest.json). Os codigos de bloco,
pisos, tipologias, areas e precos foram extraidos das linhas individuais, nao da
legenda geral de tipos. A soma interior + exterior confere nas 216 linhas.

Alguns precos de reservas nao aparecem na tabela visivel, mas constam do texto
do PDF. O utilizador autorizou expressamente mante-los, identificados como
reservados. O aviso de desconto de 5% da fonte nao foi aplicado automaticamente.
Garagem/arrecadacao BelaFormosa nao incluidas: nao foi inventada uma atribuicao.

## Importacao local e compatibilidade

`scripts/update_belaformosa.py` e uma migracao local explicita, nao executada
pelo website. Sem `--apply`, apenas valida/exibe contagens e manifesto.

```powershell
python scripts/update_belaformosa.py "caminho/para/lista-setembro-2026.pdf"
python scripts/update_belaformosa.py "caminho/para/lista-setembro-2026.pdf" --apply
python scripts/data_workbook.py --check
```

A extracao requer `pypdf`, disponivel no runtime utilizado. A migracao usa os
helpers XML/ZIP ja existentes no repositorio, preservando os outros componentes
nativos do Excel. So tres partes XML mudam: folha Dados, tabela DadosCompset e
Resumo BD. Este ultimo recebe os novos totais, BelaFormosa e o total recomendado.
As colunas de metadados sao aditivas/opcionais; as linhas anteriores nao recebem
campos artificiais vazios no JSON. Nenhuma coluna existente foi renomeada.

Ha validacao antes da substituicao local e testes de idempotencia por hash:
reimportar a mesma fonte nao muda os ficheiros nem duplica registos. Pedidos
invalidos deixam o ficheiro original intacto. Nao existe ligacao a migracoes,
credenciais ou armazenamento comercial Google.

## Quatro camadas exclusivas

- **A, diretos:** familia funcional, mesmo piso e classe de vista suficientemente
  fiavel. Produtos especiais, vistas estimadas e qualidade baixa/nao informada
  nao sao tratados como correspondencias exatas.
- **B, adjacentes prioritarios:** mesma familia e vista fiavel, piso imediatamente
  acima/abaixo, sem equivaler automaticamente areas/configuracoes diferentes.
- **C, indiretos/ajustados:** divergencias de vista, piso ou areas, dentro de um
  intervalo de relevancia explicito (ate tres pisos, interior entre 0,5 e 2,5 vezes
  o alvo quando conhecido). A falta de dados e identificada.
- **D, especiais:** rooftop, duplex ou piscina explicitamente privativa; referencias
  de posicionamento, nao equivalentes convencionais.

T1+1/T2 e T2+1/T3 continuam familias funcionais, sem esconder a tipologia real.
T1-Duplex continua pesquisavel na familia T1, mas e produto especial.
Sem A valido, apresenta-se `Sem comparavel direto`.

Os dados originais contem codigos Le Parc repetidos com areas/precos diferentes.
Nao foram apagados: a projecao apresenta uma unica referencia por codigo,
identifica a divergencia e permite consultar as variantes historicas. Estes
codigos nao alimentam correspondencias exatas.

## Influencia e leitura dos valores

O ranking combina peso existente na fonte, segmento, atualidade, estado,
qualidade, tipologia real/funcional, vista, proximidade de piso e areas.
Orientacao/estacionamento conhecidos tambem influenciam proximidade; ausencia
de informacao nao e convertida em ausencia de garagem ou orientacao factual.
A localidade e independente do segmento e da qualidade. O fator geografico e 1
na mesma localidade, 0,7 noutra localidade e 0,85 quando falta confirmacao.
E uma hipotese de ranking, nao um desconto no preco; nao depende da palavra
"regional". Nao foram inventadas distancias ou unidades de distancia.

`Localidade` e `Fonte localidade` sao colunas opcionais da fonte canonica:
EVO Lux Garden e Palacio BR Avenida ficam em Faro, conforme
[Libertas](https://libertas.pt/portfolio/) e
[Palacio BR Avenida](https://palaciobravenida.pt/localizacao/).
The View, BelaFormosa e Del Mar ficam em Olhao; Del Mar e sustentado pela
[fonte JLL](https://residential.jll.pt/imovel/apartamento-t1-com-varanda-em-olhao-algarve/19744519).
As restantes localidades continuam por confirmar, sem deducao pelo segmento.

Precos por m2: interior, total e equivalente, apresentados separadamente.
`Area equivalente = interior + 30% do exterior`, ajustavel entre 0 e 100%
apenas na sessao de analise. Nao e uma equivalencia oficial de avaliacao.
Areas totais divergentes da soma ficam sinalizadas; falta de ABP nao e
substituida silenciosamente por area total para calcular o indicador interior.

O ranking ordena referencias; **nunca calcula ou grava os precos recomendados**.
As diferencas exibidas usam a recomendacao da gestao como referencia, nao o PVP
original nem precos negociados. PVP e recomendacao permanecem visiveis/separados.
Nao se consultam valores comerciais reais pela pagina publica do comparador.

Selecao inicial curta: ate quatro referencias por camada, maximo duas por
empreendimento, favorecendo blocos distintos. As restantes ficam em detalhes.
Cada codigo ocorre apenas numa camada; o BelaFormosa nao ganha peso pelo volume.

Uma secao complementar recupera benchmarks premium fora dos limites de piso ou
area das quatro camadas. A selecao exclui previamente todos os codigos ja
classificados em A/B/C/D e produtos especiais. Mantem diversidade por
empreendimento, fontes, indicadores e o aviso de que nao sao concorrentes diretos.
Inclui Del Mar BZ, T3/vista 1, para Apt. 36; Del Mar T2 para Apt. 37; e T3 premium
de outros empreendimentos para Apt. 39. Respeita o filtro de empreendimento.

## Exemplos verificados

| The View | Recomendado (EUR) | Enquadramento verificado |
| --- | ---: | --- |
| Apt. 1 | 675.000 | RF108 nao e direto; vista preliminar 2–3 nao equivale a vista 1. |
| Apt. 9 | 1.000.000 | LF204/RF204 como ajustados; rooftops em D, nao equivalentes. |
| Apt. 23 | 1.000.000 | LF402/RF402 como ajustados; propostas/precos atuais nao alterados. |
| Apt. 36 | 1.500.000 | LF504/RF504 convencionais do piso 5 em C; LF604/RF604 em D. |
| Apt. 37 | 1.105.000 | LF507/RF507 em C: vista estimada 2–3, nao vista 2 confirmada. |
| Apt. 38 | 490.000 | RB503/RB504 e equivalentes LB no piso 5; rooftops separados. |
| Apt. 39 | 1.150.000 | LB507/RB507 em C, com intervalo estimado 2–3. |

## Revisao dos oito empreendimentos anteriores

- Del Mar: mantem fontes enriquecidas 2026 e historicos separados; maior peso
  para oferta atual documentada de segmento premium.
- Le Parc: preserva 59 linhas, mas baixa qualidade/codigos divergentes impedem
  correspondencias exatas; continua referencia ajustada/contextual.
- Aura: 27 linhas atuais com baixa qualidade, usadas com cautela, sem vista exata.
- Saramago: 25 registos 2024/2026; historicos menos influentes e qualidade em falta visivel.
- Palacio BR Avenida: 31 registos, mantendo tipologias especiais e lacunas identificadas.
- EVO: 77 registos; qualidade nao informada nao e tratada como alta nem vista confirmada.
- Prestige V: oito registos e classe comparavel 4 preservados, distinguida da vista factual ausente.
- Plessis: seis registos premium regionais; area interior ausente nao e inventada,
  com localidade ainda por confirmar (fator 0,85).

Isto e uma revisao da influencia dos dados existentes, nao uma confirmacao
em tempo real de disponibilidade ou precos de terceiros.

## Testes e revisao visual

Registo abaixo: validacao anterior a integracao da main, no commit `4967d26`.
Para a reexecucao atual, incluindo PR #19 e pesquisa Piso 5, consultar
[main-integration.json](docs/belaformosa/main-integration.json).

Resultados consolidados: [validation.json](docs/belaformosa/validation.json).
Capturas reais: [galeria](docs/belaformosa/README.md).

- 53 suites Node, incluindo compset, pricing, integridade, CAS, recuperacao,
  reservas, comissoes, propostas e preservacao do codigo comercial.
- Tres testes Python: ficheiros Excel/JSON coerentes, apenas tres partes XML
  alteradas, importacao repetida identica e falha de fonte sem substituicao.
- Reexecucao das 24 suites Chrome: 23 passaram. A suite
  `commercial-client-phase2b-browser.mjs` falhou na linha 39, ao aguardar os seis
  resultados de pesquisa de "Piso 5"; a consulta continuava em "34". A mesma
  falha foi reproduzida numa copia inalterada de `1825c6e`, e na repeticao isolada
  da versao corrigida. Nao foi contabilizada como aprovacao nem foi alterado CRM
  para a contornar. Os resultados anteriores ficam como historico, nao como
  substituto desta execucao.
- Comparador testado em 1440, 1366, 820 e 390 px; sete fracoes representativas,
  filtros, quatro camadas, coeficiente, ausencia de duplicacao/overflow/erros.
- Zero pedidos a API comercial no teste do comparador; CRM sempre ficticio nas
  restantes suites. Nenhum acesso a Google real.
- Comparador repetido depois do ajuste CSS mobile: aprovado; BZ visivel no
  benchmark do Apt. 36, Del Mar T2 no Apt. 37 e T3 de outros projetos no Apt. 39.
- 119 verificacoes `node --check` aprovadas. Excel e JSON conferem; tres testes
  Python aprovados, incluindo formatos, preservacao nativa e idempotencia.

Comandos: `node tests/commercial-client-complete-regression.cjs`,
`node tests/commercial-browser-regression.cjs`,
`node tests/commercial-browser-regression.cjs commercial-client-phase2b-browser.mjs comparator-belaformosa-browser.mjs`,
`python tests/test_belaformosa_workbook.py` e
`python scripts/data_workbook.py --check`. Servidores exclusivamente em loopback
dedicado, com fixtures ficticias e rede externa bloqueada nos testes de navegador.

Os testes historicos que congelavam toda a tabela ou valores de setembro foram
atualizados apenas para a alteracao autorizada, mantendo verificacoes exatas
dos PVP, 280 registos anteriores, restantes garagens e infraestrutura comercial.
Nenhuma suite foi retirada. O runner passa a guardar diagnosticos enquanto corre.

## Limitacoes e publicacao

Vistas BelaFormosa continuam estimativas: as 216 fracoes recebem os intervalos
expressamente definidos pela gestao; nenhuma recebe uma vista factual confirmada.
LF/RF: 4–5 -> 1; 6–8 -> 2–3; 1–3 -> 3–4.
LB/RB: 6–9 -> 2–3; 2–5 -> 3–4; 1/10/11 -> retaguarda 3–4.
O piso afeta a confianca/proximidade, nao cria confirmacao geometrica. Orientacoes e entrega
nao foram inventadas. Nao existe penalizacao por futura construcao suposta.

A abertura real no Microsoft Excel 16.0, em modo so de leitura, confirmou as dez
folhas, tabela A1:AR536, novas colunas e total recomendado. Macros desativadas,
ligacoes externas sem atualizacao e fecho sem guardar; hash identico antes/depois.
As exportacoes nativas foram inspecionadas visualmente: corrigidos o formato
monetario indevido das vistas, linhas de metadados e campos cortados no resumo.
Os outros componentes do ficheiro foram comparados byte a byte e preservados.

Face a main atual (PR #19), nenhuma alteracao em commercial.js, modulos CRM,
API, Apps Script, autenticacao, sincronizacao, config.js ou plantas.
Nao e necessario publicar Apps Script.
Deployment Git desta branch esta desativado. Nao houve merge/deployment.

A main com PR #19 foi incorporada nesta branch. Os tres conflitos foram
combinados manualmente: ambos os catalogos de testes, guardas de seguranca e
validacoes analiticas, e ambas as entradas de branches em vercel.json.
O teste `pr20-main-integration.test.js` exige igualdade exata dos ficheiros
da PR #19 fora dos tres ficheiros combinados e dos dados/comparador aprovados.
Resultados atuais: [integracao da main](docs/belaformosa/main-integration.json).

Integracao validada: 56 suites Node, 25 suites de navegador (apos repeticoes),
tres testes Excel/JSON e 123 verificacoes de sintaxe. Piso 5, sincronizacao
automatica, renovacao de leitura e comparador aprovados. Duas execucoes iniciais
terminaram sem resultado; na repeticao, o teste de reserva/cancelamento revelou
uma espera pelo indicador antigo de sincronizacao. O teste passou a exigir a
resposta POST da operacao concreta, mantendo estado remoto e HTTP 200 obrigatorios.
Nenhuma regra comercial foi alterada para resolver essa espera.
