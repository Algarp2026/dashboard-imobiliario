# Atualizacao das plantas dos apartamentos

Relatorio historico da primeira entrega (`194a513`). A otimizacao posterior,
o mapeamento WebP atual e a data de impressao estao documentados em
[APARTMENT_PLANS_OPTIMIZATION.md](APARTMENT_PLANS_OPTIMIZATION.md).

Branch local: `codex/update-apartment-plans-png`.
Base: `f44ad5e0c5d6aceff213d8b2f6cea9b9a4ab35cf` (main, incluindo PR #36).
Nao incorpora nem altera a PR #35.

## Fonte e alteracoes

ZIP fornecido: `sapotransfer-65ff0d04a9c8dqA.zip`, com 32 PNG.
Os ficheiros foram verificados por SHA-256 e por igualdade byte a byte com
o ZIP, sem conversao, redimensionamento, recorte ou perda de qualidade.
Todos tem 3000 x 2222 pixels e transparencia original.

- `app.js` e `commercial.js`: apenas os 39 campos `image` de PLANT_MAP
  mudam de JPG para PNG. Funcoes e demais dados permanecem iguais.
- `plantas/plantas-manifest.json`: os mesmos campos atualizados.
- `plantas/`: 31 PNG adicionados e um PNG preexistente substituido
  (`planta-apartamento-23-30.png`); 32 JPG obsoletos removidos.
  Os 32 PDF originais e os seus links/metadados foram preservados.
- Testes: novo mapeamento/hash e verificacao desktop/mobile; guards historicos
  passam a aceitar exclusivamente esta troca de imagens, sem eliminar os
  testes de precos, analise, dados, CRM, sincronizacao ou seguranca.

As fracoes com a mesma planta partilham um unico caminho. Nao foi acrescentada
uma galeria nem alterado o layout: os detalhes de fracao atuais nao tinham
uma imagem de planta propria. Os usos existentes nos geradores de apresentacao
comercial e comparador passam a obter o PNG novo pelo mapa existente.

## Mapeamento final

| Apartamentos | Ficheiro original no ZIP | Imagem utilizada |
|---|---|---|
| 1 | `Planta_01.png` | `plantas/planta-apartamento-01.png` |
| 2, 10, 17, 24, 31 | `Planta_02, 10, 17, 24 e 31_01.png` | `plantas/planta-apartamento-02-10-17-24-31.png` |
| 3 | `Planta_03.png` | `plantas/planta-apartamento-03.png` |
| 4 | `Planta_04.png` | `plantas/planta-apartamento-04.png` |
| 5 | `Planta_05.png` | `plantas/planta-apartamento-05.png` |
| 6 | `Planta_06.png` | `plantas/planta-apartamento-06.png` |
| 7, 15 | `Planta_07 e 15.png` | `plantas/planta-apartamento-07-15.png` |
| 8 | `Planta_08.png` | `plantas/planta-apartamento-08.png` |
| 9, 16 | `Planta_09 e 16.png` | `plantas/planta-apartamento-09-16.png` |
| 11 | `Planta_11.png` | `plantas/planta-apartamento-11.png` |
| 12 | `Planta_12.png` | `plantas/planta-apartamento-12.png` |
| 13 | `Planta_13.png` | `plantas/planta-apartamento-13.png` |
| 14 | `Planta_14.png` | `plantas/planta-apartamento-14.png` |
| 18 | `Planta_18.png` | `plantas/planta-apartamento-18.png` |
| 19 | `Planta_19.png` | `plantas/planta-apartamento-19.png` |
| 20 | `Planta_20.png` | `plantas/planta-apartamento-20.png` |
| 21 | `Planta_21.png` | `plantas/planta-apartamento-21.png` |
| 22 | `Planta_22.png` | `plantas/planta-apartamento-22.png` |
| 23, 30 | `Planta_23 e 30.png` | `plantas/planta-apartamento-23-30.png` |
| 25 | `Planta_25.png` | `plantas/planta-apartamento-25.png` |
| 26 | `Planta_26.png` | `plantas/planta-apartamento-26.png` |
| 27 | `Planta_27.png` | `plantas/planta-apartamento-27.png` |
| 28 | `Planta_28.png` | `plantas/planta-apartamento-28.png` |
| 29 | `Planta_29.png` | `plantas/planta-apartamento-29.png` |
| 32 | `Planta_32.png` | `plantas/planta-apartamento-32.png` |
| 33 | `Planta_33.png` | `plantas/planta-apartamento-33.png` |
| 34 | `Planta_34.png` | `plantas/planta-apartamento-34.png` |
| 35 | `Planta_35.png` | `plantas/planta-apartamento-35.png` |
| 36 | `Planta_36.png` | `plantas/planta-apartamento-36.png` |
| 37 | `Planta_37.png` | `plantas/planta-apartamento-37.png` |
| 38 | `Planta_38.png` | `plantas/planta-apartamento-38.png` |
| 39 | `Planta_39.png` | `plantas/planta-apartamento-39.png` |

## Validacao

- `node tests/apartment-plan-assets.test.js`: cobertura 1 a 39, 32 caminhos
  unicos, hashes do ZIP, dimensoes, substituicao integral dos JPG e PDFs
  originais intactos.
- `node tests/commercial-client-complete-regression.cjs`: bateria Node
  completa: **77/77 aprovadas**, incluindo verificacoes de igualdade fora
  dos campos autorizados.
- `tests/apartment-plans-browser.mjs`: 39 imagens decodificadas e verificadas
  por hash em desktop 1440x900 e mobile 390x844; 39 detalhes abertos em cada
  tamanho; Dados/Procura/Oportunidades sem overflow ou escritas comerciais.
  Os dois renderers reais exercitados para todas as 39 fracoes.
- Regressao de navegador: apresentacao PDF (16 combinacoes), exportacoes,
  comparador BelaFormosa (incluindo quatro tamanhos) e relatorios.
- `tests/validate_presentation_pdfs.py`: 16 PDF, 24 paginas A4, rodapes
  completos, plantas conforme opcao e ausencia de paginas adicionais.
- PDF adicionais: apartamentos 2/10 (planta partilhada), 36/39 e comparador 21;
  cinco paginas A4 confirmadas, com imagem original 3000x2222 embutida;
  renderizacao para inspecao visual sem cortes nem sobreposicoes. Tamanhos:
  4,85 MB (2/10), 11,76 MB (36/39) e 3,97 MB (comparador 21).

Resultados finais: **4/4 suites de navegador aprovadas**, alem do teste
especifico desktop/mobile (78 imagens decodificadas e 78 detalhes abertos).
Sintaxe JavaScript e parse dos ficheiros Apps Script: **211/211 aprovados**.
Os hashes correspondem aos 32 ficheiros originais no ZIP.
As quatro falhas iniciais de testes Node eram guards historicos que exigiam
os JPG antigos e igualdade literal de PLANT_MAP. Os guards foram atualizados
para verificar a troca exata e os hashes novos, mantendo a igualdade de todo
o restante codigo e dos PDFs originais. No teste adicional de navegador, foi
necessario isolar cada documento de impressao e suprimir a impressao automatica
apenas no teste; nenhum destes ajustes foi feito no gerador do produto.

Todos os dados comerciais usados sao ficticios; a fonte Google e substituida
pelo servidor local de testes. Zero chamadas ou escritas na Sheet real.
Nao ha alteracao de precos, areas, recomendacoes, disponibilidade, eventos,
clientes, reservas, vendas, comissoes, PDFs originais ou layout.

## Limites e revisao

Os 32 PNG totalizam 342337525 bytes (cerca de 326 MiB), consideravelmente mais
do que os JPG substituidos. Isto pode aumentar o carregamento inicial, consumo
de dados, tamanho do repositorio e dos PDF exportados. Nao foi introduzida
compressao ou uma derivada menor sem autorizacao; as imagens sao os originais
fornecidos. O navegador reutiliza o mesmo URL para as plantas partilhadas.
Os testes sao em Chromium Windows, incluindo viewport mobile, nao em telemovel
fisico. Nao foram medidos tempos de carregamento de uma publicacao remota.

Artefactos de teste, screenshots e PDF ficam fora do repositorio no diretorio
`apartment-plans-validation` do workspace. Nenhum servidor fica aberto apos
os testes. Sem push, PR, merge, deployment ou Promote nesta entrega.
