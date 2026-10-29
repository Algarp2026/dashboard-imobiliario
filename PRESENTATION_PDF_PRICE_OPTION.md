# PDF de apresentacao: preco opcional

Base: `origin/main`, `e2c041dc0acd6cdb281f31fc81138128d68cdb59`.
Branch: `codex/presentation-pdf-price-option`.

## Alteracao

Apenas duas funcoes de `commercial.js` foram alteradas:
`openPresentationPriceModal` e `generateClientPresentationPdf`.

- Checkbox "Apresentar preco no PDF", selecionada por defeito e apenas em memoria.
- Desmarcar remove a totalidade do bloco de preco e a coluna correspondente.
- Preco de apresentacao, plantas, areas ajustadas, idiomas e disclaimer preservados.
- Titulo `Apresentacao_Apt21_TheView` ou `Apresentacao_Apt21-22_TheView`, com os
  acentos pedidos na aplicacao. A impressao nativa sugere o titulo como nome;
  a extensao `.pdf` e a escolha final dependem do navegador. Os oito ficheiros
  produzidos pelo teste terminam em `.pdf`.
- Nenhuma alteracao a sincronizacao, API, Apps Script, dados ou modelo comercial.

Os testes historicos que congelavam `commercial.js` integralmente passam a
autorizar apenas estas duas funcoes, com hashes fixos e comparacao exata de todo
o restante ficheiro com a base. Nenhuma verificacao comercial foi retirada.
O catalogo de navegador mantem as 26 suites anteriores e acrescenta a nova suite.
`vercel.json` apenas desativa previews automaticas desta branch, evitando
publicacao antes da validacao. Nao altera a configuracao de producao.

## Validacao executada

- `node tests/commercial-presentation-pdf.test.js`: 16/16 combinacoes.
  Preco ligado/desligado, uma/duas fracoes, PT/ENG e PT/FR, com/sem plantas.
  Saida com preco comparada integralmente com a anterior, exceto titulo e CSS
  inativo do modo sem preco. Entradas nao sofrem mutacoes.
- `node tests/commercial-client-complete-regression.cjs`: 59/59 suites Node.
  Inclui CAS, concorrencia, integridade comercial, quotas, backups e recuperacao.
- `node tests/commercial-browser-regression.cjs commercial-presentation-pdf-browser.mjs commercial-client-complete-exports.mjs crm-reform-safety-browser.mjs`:
  3/3 suites aprovadas em Chrome real, exclusivamente com clientes ficticios.
- Nova suite gerou oito PDFs reais. Confirmou checkbox selecionada ao reabrir,
  precos personalizados, dois idiomas, plantas carregadas, nenhuma coluna vazia,
  cache comercial identica, revisao remota identica e zero gravacoes.
- `python tests/validate_presentation_pdfs.py <pasta dos PDFs ficticios>`:
  8/8 PDFs, 12/12 paginas, uma pagina por fracao, A4 portrait, metadados de titulo,
  presenca/ausencia de valores, plantas incorporadas e renderizacao aprovados.
  As 12 paginas foram inspecionadas visualmente, incluindo detalhe da segunda
  fracao sem preco em PT/FR. Captura adicional do modal a 390px.
- 130 verificacoes de sintaxe JavaScript aprovadas; `git diff --check` aprovado.

Durante o desenvolvimento, os novos testes foram corrigidos para contar areas
como valores completos (18 vs 118), separar codigo de comentarios e respeitar
o texto em maiusculas aplicado pelo CSS existente. Nao eram falhas da aplicacao.
A execucao final das tres suites de navegador nao teve falhas.

## Preservacao e publicacao

Verificacao de diff exato para `data.json`, `data.xlsx`, `config.js`, API, servidor,
Apps Script, modulos comerciais, HTML, CSS global e `plantas/`: inalterados.
Nao foram consultados clientes reais nem efetuadas operacoes na Google Sheet.
Artefactos de teste ficam fora do repositorio; apenas codigo, testes e este
relatorio devem ser incluidos no commit.

A autorizacao de publicacao e especifica para esta melhoria. Nao inclui a PR #22
nem outras branches. Integrar e verificar o deployment exige acesso de escrita
ao GitHub e confirmacao do SHA efetivamente publicado. Sem esse acesso, nao se
deve declarar a melhoria publicada nem publicar uma copia divergente pela Vercel.
