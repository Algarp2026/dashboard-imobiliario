# Entrada unica do Dashboard Comercial

## Correcao

O index.html legado duplicava o CRM, mas nao carregava os quatro modulos novos. commercial.html ja os carregava corretamente.

- vercel.json encaminha exatamente `/`, `/index` e `/index.html` para `/commercial.html`, com HTTP 307 temporario. O destino nao pertence ao conjunto de origens: nao existe ciclo. Query strings sao preservadas pelo contrato de redirects da Vercel.
- index.html passa a ser uma entrada minima, sem dados, localStorage ou scripts do CRM. Serve de fallback para alojamento estatico sem as regras Vercel, com location.replace a preservar query/hash e meta-refresh/link sem JavaScript.
- A autenticacao existente permanece intacta. Sem sessao, commercial.html encaminha para access.html com next comercial; depois do login, regressa ao HTML canonico. Links antigos de login que apontem para index convergem pelas mesmas regras.
- Comparador, restantes areas, API, Apps Script, sincronizacao e funcionalidades comerciais nao foram alterados.
- O deployment Git automatico fica desativado exclusivamente para a branch corretiva `codex/fix-commercial-home-entry`.

## Validacao local isolada

| Entrada | Desktop 1440x1000 | Mobile 390x844 |
| --- | --- | --- |
| / | Aprovado | Aprovado |
| /index | Aprovado | Aprovado |
| /index.html | Aprovado | Aprovado |

Cada percurso verifica: redirect 307; bloqueio sem sessao; login e next correto; quatro modulos carregados com HTTP 200; cinco componentes novos; editor multiplo de preferencias em vez do modal legado; formularios de apresentacao e negociacao/cancelamento; refresh mantendo a ficha; aliases com sessao; Dashboard/Definicao de Precos; Comparador e respetivo refresh; nova exigencia de login depois de remover a sessao.

Resultados: seis percursos aprovados, zero erros JavaScript, zero POST comerciais e revisao da base ficticia inalterada. A base de testes usa 64 clientes ficticios e Apps Script simulado em memoria. Nao houve acesso a Sheets reais nem utilizacao de credenciais de producao.

- `node tests/commercial-home-entry.test.js`: regras exatas sem ciclos, ausencia de duplicacao, fallback query/hash, quatro modulos e middleware existente.
- `node tests/access-routes.test.js`: autenticacao existente.
- `node tests/commercial-recommendations-ui.test.js`: engine apenas no HTML canonico e index sem CRM.
- Todas as 25 suites `.test.js` passaram; sintaxe de commercial.js, app.js, config.js e novos testes validada.
- Browser: iniciar manualmente `node tests/helpers/commercial-home-entry-preview.cjs` e executar `node tests/commercial-home-entry-browser.mjs`, com PLAYWRIGHT_MODULE e CHROME_EXECUTABLE do runtime local. Porta 5199; redirects lidos de vercel.json e middleware.ts real do repositorio; o alojamento Vercel e emulado, nao contactado.

## Revisao e limites

Nao houve merge, deployment nem promocao. A validacao das regras na infraestrutura Vercel deve ser confirmada num deployment de revisao posteriormente autorizado, sem promover para o dominio publico. A alteracao de producao limita-se a index.html e vercel.json; todos os restantes ficheiros alterados sao testes ou este relatorio. Nenhum preco, estado, cliente, evento ou metadado comercial e alterado por estes redirecionamentos.
