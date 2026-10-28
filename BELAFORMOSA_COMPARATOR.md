# Comparador e recomendacoes de outubro de 2026

Base: `658da6f038f061aad5f532cb66c98c529591dfe1` (main, PR #18).
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
- 280 registos concorrenciais anteriores preservados integralmente.
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
Segmentos explicitamente regionais recebem menor peso que referencias locais
equivalentes. Nao foram inventadas distancias ou unidades de distancia.

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

## Exemplos verificados

| The View | Recomendado (EUR) | Enquadramento verificado |
| --- | ---: | --- |
| Apt. 1 | 675.000 | RF108 nao e direto; vista preliminar 2–3 nao equivale a vista 1. |
| Apt. 9 | 1.000.000 | LF204/RF204 como ajustados; rooftops em D, nao equivalentes. |
| Apt. 23 | 1.000.000 | LF402/RF402 como ajustados; propostas/precos atuais nao alterados. |
| Apt. 36 | 1.500.000 | LF504/RF504 convencionais do piso 5 em C; LF604/RF604 em D. |
| Apt. 37 | 1.105.000 | LF507/RF507 em C: vista estimada 2–3, nao vista 2 confirmada. |
| Apt. 38 | 490.000 | RB503/RB504 e equivalentes LB no piso 5; rooftops separados. |
| Apt. 39 | 1.150.000 | LB507/RB507 em C, com intervalo estimado 3–4. |

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
  com menor peso geografico que um produto local equivalente.

Isto e uma revisao da influencia dos dados existentes, nao uma confirmacao
em tempo real de disponibilidade ou precos de terceiros.

## Testes e revisao visual

Resultados consolidados: [validation.json](docs/belaformosa/validation.json).
Capturas reais: [galeria](docs/belaformosa/README.md).

- 53 suites Node, incluindo compset, pricing, integridade, CAS, recuperacao,
  reservas, comissoes, propostas e preservacao do codigo comercial.
- Tres testes Python: ficheiros Excel/JSON coerentes, apenas tres partes XML
  alteradas, importacao repetida identica e falha de fonte sem substituicao.
- 24 suites Chrome abrangidas. Duas excederam 240 s na primeira passagem;
  ambas passaram na repeticao isolada com rastreio, sem alterar o codigo comercial.
  Esses timeouts nao foram contabilizados como aprovacoes.
- Comparador testado em 1440, 1366, 820 e 390 px; sete fracoes representativas,
  filtros, quatro camadas, coeficiente, ausencia de duplicacao/overflow/erros.
- Zero pedidos a API comercial no teste do comparador; CRM sempre ficticio nas
  restantes suites. Nenhum acesso a Google real.

Os testes historicos que congelavam toda a tabela ou valores de setembro foram
atualizados apenas para a alteracao autorizada, mantendo verificacoes exatas
dos PVP, 280 registos anteriores, restantes garagens e infraestrutura comercial.
Nenhuma suite foi retirada. O runner passa a guardar diagnosticos enquanto corre.

## Limitacoes e publicacao

Vistas BelaFormosa continuam estimativas: apenas as posicoes sustentadas pelo
pedido receberam intervalos (84 fracoes); 132 ficam sem classe atribuida, por
falta de uma implantacao geometrica unitario-a-unitario confirmada. O piso afeta a
confianca/proximidade, nao cria uma confirmacao geometrica. Orientacoes e entrega
nao foram inventadas. Nao existe penalizacao por futura construcao suposta.

A leitura independente do Excel confirmou as novas recomendacoes. A biblioteca
grafica encerrou sem produzir imagem; a validacao visual no Excel desktop fica
recomendada antes do merge, incluindo Resumo BD e as novas colunas. Os outros
componentes do ficheiro foram comparados byte a byte e preservados.

Nenhuma alteracao em commercial.js, modulos CRM, API, Apps Script, autenticacao,
sincronizacao, config.js ou plantas. Nao e necessario publicar Apps Script.
Deployment Git desta branch esta desativado. Nao houve merge/deployment.

A PR #19 e independente e nao foi incorporada nesta branch. Ao integrar ambas,
preservar as duas entradas de vercel.json e combinar as guardas dos agregadores:
as protecoes de sincronizacao da #19 e a autorizacao limitada de dados analiticos
desta PR nao devem substituir-se mutuamente.
