# PR #37 - Otimizacao das plantas e data de impressao

## Resultado

APTA PARA MERGE, sujeita a revisao e autorizacao do utilizador.
Trabalho local na branch `codex/update-apartment-plans-png`, continuando
`194a513`, baseada em `f44ad5e`. Nao incorpora a PR #35/P7.
Sem push, PR adicional, merge, deployment, Promote ou acesso ao Google real.

## Metodo e qualidade

WebP sem perdas, Pillow/libwebp: lossless=True, quality=100, method=6,
exact=True. Sem redimensionamento, recorte, reconstrucao ou IA.
Todas as 32 imagens mantem 3000 x 2222 e igualdade integral dos pixels RGBA
com os PNG do ZIP, incluindo RGB oculto e transparencia. Os SHA-256 do ZIP,
dos originais, dos WebP e dos pixels descodificados estao nos fixtures.

Primeiro foram comparadas apenas as plantas 01 e 36 (a mais pesada).
Comparacao a 100% e detalhes ampliados a 200%, seguida de descodificacao e
impressao Chromium antes de converter as restantes 30:

| Amostra | PNG original | PNG otimizado sem perdas | WebP sem perdas |
|---|---:|---:|---:|
| 01 | 11.707 MB | 3.227 MB | 1.956 MB |
| 36 | 17.708 MB | 4.725 MB | 2.962 MB |

Nao foi necessaria compressao com perdas. Nao foi observada degradacao
visual nas linhas, simbolos, contornos ou texturas.
No canvas do Chromium, cores opacas e canal alfa coincidem nas duas amostras.
A premultiplicacao dos descodificadores produz diferencas apenas nos RGB de
pixeis semitransparentes; sobre branco, no maximo 1 nivel de 255. Nao se
confunde esta diferenca de composicao com perda dos pixels RGBA do ficheiro.
Os PNG tinham gamma 0.45454 e nenhum perfil ICC personalizado.

## Medicoes locais

MB decimal (1 MB = 1 000 000 bytes).

| Indicador | Original | Otimizado |
|---|---:|---:|
| Numero de imagens | 32 | 32 |
| Tamanho total | 342.338 MB | 57.964 MB |
| Tamanho medio | 10.698 MB | 1.811 MB |
| Maior imagem | 17.708 MB | 2.962 MB |
| PDF Apt21-22, PT/EN, sem preco, com planta | 8.036956 MB | 8.040747 MB |
| Resolucao | 3000 x 2222 | 3000 x 2222 |
| Qualidade | Referencia | RGBA integral preservado |

Reducao efetiva dos recursos: **83.07%**.
O PDF nao diminuiu: Chromium volta a codificar as imagens ao imprimir,
e a nova linha de data acrescenta texto/fontes. Nao foram feitas medicoes
de carregamento remoto nem se alegam ganhos de latencia de producao.
Os PNG pesados sao removidos do estado atual, mas continuam no historico
Git anterior; nao foi reescrito esse historico.

## Fonte, mapeamento e reducao por ficheiro

ZIP local preservado fora do deployment:
`sapotransfer-65ff0d04a9c8dqA.zip`.
SHA-256: `73c6cfcb99389c71f2364d3e0792ea003f43ca3ace816271a71a964cb2b934e6`.

Cada linha substitui o PNG de igual nome-base em `plantas/` pelo WebP indicado.
As fracoes partilhadas continuam a usar um unico recurso.
Os 32 PDF tecnicos originais e respetivos links/metadados ficam inalterados.

| Fracoes | Recurso final em plantas/ | PNG MB | WebP MB | Reducao |
|---|---|---:|---:|---:|
| 1 | `planta-apartamento-01.webp` | 11.707 | 1.956 | 83.29% |
| 2, 10, 17, 24, 31 | `planta-apartamento-02-10-17-24-31.webp` | 13.436 | 2.315 | 82.77% |
| 3 | `planta-apartamento-03.webp` | 7.565 | 1.309 | 82.70% |
| 4 | `planta-apartamento-04.webp` | 9.573 | 1.672 | 82.54% |
| 5 | `planta-apartamento-05.webp` | 9.196 | 1.586 | 82.75% |
| 6 | `planta-apartamento-06.webp` | 12.876 | 2.160 | 83.23% |
| 7, 15 | `planta-apartamento-07-15.webp` | 11.515 | 1.901 | 83.49% |
| 8 | `planta-apartamento-08.webp` | 6.157 | 1.034 | 83.21% |
| 9, 16 | `planta-apartamento-09-16.webp` | 17.643 | 2.947 | 83.30% |
| 11 | `planta-apartamento-11.webp` | 7.448 | 1.236 | 83.41% |
| 12 | `planta-apartamento-12.webp` | 9.379 | 1.577 | 83.19% |
| 13 | `planta-apartamento-13.webp` | 9.180 | 1.558 | 83.02% |
| 14 | `planta-apartamento-14.webp` | 12.888 | 2.169 | 83.17% |
| 18 | `planta-apartamento-18.webp` | 7.460 | 1.250 | 83.24% |
| 19 | `planta-apartamento-19.webp` | 7.639 | 1.312 | 82.82% |
| 20 | `planta-apartamento-20.webp` | 7.322 | 1.269 | 82.67% |
| 21 | `planta-apartamento-21.webp` | 11.187 | 1.931 | 82.74% |
| 22 | `planta-apartamento-22.webp` | 11.597 | 1.938 | 83.29% |
| 23, 30 | `planta-apartamento-23-30.webp` | 12.611 | 2.107 | 83.29% |
| 25 | `planta-apartamento-25.webp` | 7.667 | 1.332 | 82.62% |
| 26 | `planta-apartamento-26.webp` | 11.272 | 1.901 | 83.13% |
| 27 | `planta-apartamento-27.webp` | 9.026 | 1.560 | 82.72% |
| 28 | `planta-apartamento-28.webp` | 9.451 | 1.649 | 82.55% |
| 29 | `planta-apartamento-29.webp` | 8.358 | 1.384 | 83.45% |
| 32 | `planta-apartamento-32.webp` | 7.608 | 1.276 | 83.23% |
| 33 | `planta-apartamento-33.webp` | 10.401 | 1.769 | 82.99% |
| 34 | `planta-apartamento-34.webp` | 14.047 | 2.380 | 83.06% |
| 35 | `planta-apartamento-35.webp` | 13.598 | 2.263 | 83.36% |
| 36 | `planta-apartamento-36.webp` | 17.708 | 2.962 | 83.27% |
| 37 | `planta-apartamento-37.webp` | 13.387 | 2.278 | 82.98% |
| 38 | `planta-apartamento-38.webp` | 7.823 | 1.349 | 82.75% |
| 39 | `planta-apartamento-39.webp` | 15.613 | 2.632 | 83.14% |

## Data e rodape

Apenas `generateClientPresentationPdf()` recebe a linha:
- PT/EN: `Impresso em: DD/MM/AAAA · Generated on: DD/MM/AAAA`.
- PT/FR: `Impresso em: DD/MM/AAAA · Genere le : DD/MM/AAAA` (com acentos no PDF).

`Intl.DateTimeFormat` explicito em `Europe/Lisbon`, um unico `new Date()`
por documento, reutilizado em todas as paginas. Sem pedidos remotos ou
persistencia comercial. Aviso legal inalterado e a 8 pt; apenas espacamento
e entrelinha do proprio rodape ajustados para acomodar a data.

A primeira impressao detetou excesso de altura; a composicao do rodape foi
corrigida sem reduzir plantas, modificar o resto do layout ou afrouxar testes.
A repeticao final dos 16 cenarios e os PDFs renderizados passaram.

Capturas extraidas dos PDFs reais com dados ficticios e relogio controlado:
[PT/EN](docs/apartment-plans-optimization/footer-pt-en.png) e
[PT/FR](docs/apartment-plans-optimization/footer-pt-fr.png).
A data ilustrativa de teste nao esta fixada no produto.
O preco continua desmarcado por defeito; areas, opcoes e nomes preservados.
PDFs internos e comparador nao recebem a data.

## Validacao final

- 78/78 suites Node e agregador historico aprovados:
  `node tests/commercial-client-complete-regression.cjs`.
- 213 verificacoes de sintaxe JS/CJS/MJS/GS aprovadas.
- `commercial-presentation-date.test.js`: relogio controlado, mudanca de dia
  em Lisboa, inicio/fim do horario de verao, duas linguas, uma data/documento,
  preco/planta, aviso legal e alteracao estritamente limitada ao rodape.
- `apartment-plan-assets.test.js`: mapas exatos 1-39, 32 recursos, hashes,
  proveniencia ZIP imutavel, PDFs tecnicos, nenhum PNG/JPG redundante.
- `validate_apartment_plan_pixels.py` com `PLAN_SOURCE_ZIP`: 32/32 descodificados,
  igualdade RGBA com o ZIP e SHA-256 do arquivo original confirmado.
- Navegador: `commercial-presentation-pdf-browser.mjs`,
  `commercial-client-complete-exports.mjs`, `comparator-belaformosa-browser.mjs`,
  `crm-reform-report-browser.mjs`: 4/4 aprovados, dados ficticios.
- `apartment-plans-browser.mjs`: 39 mapeamentos descodificados e 39 detalhes
  abertos em desktop 1440x900 e mobile 390x844; MIME image/webp, hashes,
  resolucao e ausencia de erros/overflow. Ambos os geradores testados
  com as 39 fracoes. Zero gravacoes comerciais.
- 16 PDFs reais, 24 paginas A4: PT/EN e PT/FR, 1/2 apartamentos, com/sem
  preco e com/sem planta. Validacao de texto, data, imagens incorporadas,
  aviso completo abaixo do conteudo, limites imprimiveis e paginas sem cortes.
- Mais 3 PDFs reais: Apt2-10, Apt36-39 e comparador Apt21; 5 paginas A4,
  sem paginas adicionais. A data aparece apenas nos documentos comerciais.
- Inspecao visual das paginas e das duas versoes do rodape concluida.
- `git diff --check` aprovado.

Falhas intermedias resolvidas: rodape demasiado alto antes de compactar o
seu espacamento; exportacao Apt26 tentada antes de a conversao estar concluida;
guard historico do servidor ficticio precisou de reconhecer exclusivamente a
entrada MIME WebP. Os restantes bytes/criterios desse guard mantem-se fixos.
A primeira tentativa sem permissoes de loopback nem chegou ao servidor;
os resultados finais foram obtidos na execucao local isolada autorizada.

Artefactos volumosos (PDFs, paginas renderizadas, comparacoes 100%/200%, logs)
ficam fora do deployment, em `../plan-optimization/` neste workspace.
O ZIP original permanece em Downloads. Nao sao incluidos dados reais.

## Ficheiros desta continuacao

Produto:
- `app.js`: somente caminhos image no PLANT_MAP.
- `commercial.js`: caminhos image e data/composicao do rodape da apresentacao.
- `plantas/plantas-manifest.json`: somente image.
- 32 PNG removidos e 32 WebP adicionados, enumerados na tabela acima.

Testes, provas e documentacao:
- `tests/apartment-plan-assets.test.js`
- `tests/apartment-plans-browser.mjs`
- `tests/commercial-presentation-date.test.js` (novo)
- `tests/commercial-presentation-pdf-browser.mjs`
- `tests/commercial-presentation-pdf.test.js`
- `tests/fixtures/apartment-plan-assets.json`
- `tests/fixtures/apartment-plan-source.json` (novo)
- `tests/helpers/apartment-plan-assets.cjs`
- `tests/helpers/client-phase2a-preview.cjs` (somente MIME ficticio)
- `tests/helpers/presentation-date-source.cjs` (novo)
- `tests/helpers/storage-optimization-source.cjs` (normalizacao exata do MIME)
- `tests/validate_apartment_plan_pixels.py` (novo)
- `tests/validate_presentation_pdfs.py`
- `docs/apartment-plans-optimization/footer-pt-en.png` (novo)
- `docs/apartment-plans-optimization/footer-pt-fr.png` (novo)
- `APARTMENT_PLANS_PNG.md` (nota de relatorio historico)
- `APARTMENT_PLANS_OPTIMIZATION.md` (este relatorio)

Sem alteracoes a dados/precos/areas/estados/clientes, API, Apps Script,
autenticacao, persistencia, sincronizacao, backups, P1-P7, HTML/CSS do CRM,
layout do comparador ou PDFs tecnicos.

## Limitacoes

Compatibilidade de descodificacao e impressao verificada no Chromium local,
em desktop e viewport mobile; nao e uma medicao em Safari/Firefox ou num
telemovel fisico. Navegadores antigos sem WebP nao foram testados.
Os 57.96 MB continuam acima dos JPG antigos, mas preservam a transparencia
e todos os pixels; nao se introduziu compressao com perdas para forcar tamanhos.
O peso final dos PDFs nao beneficia automaticamente da compressao WebP.
A decisao de integracao/publicacao continua exclusivamente com o utilizador.
