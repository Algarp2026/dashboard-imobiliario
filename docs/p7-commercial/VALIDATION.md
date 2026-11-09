# Validação P7

## Antes e depois

As três suites de referência na base passaram: `commercial-profile-followup`,
`crm-reform` e `commercial-stage` (navegador). Os testes P7 acrescentam prova
negativa antes da correção: 1 POST em vez de 0 ao repor a observação; 9 em vez
de 8 apresentações no Dashboard. Durante a preparação, a fixture inicial
reinicializava a fonte depois da autenticação/navegação e o navegador seguinte
retinha a revisão anterior: o teste foi corrigido para reinicializar antes de
carregar o CRM. Não houve aumento de timeout nem redução de asserções.

O diagnóstico antigo (`063684c:tests/commercial-p7-cycle-diagnostic.cjs`)
foi reproduzido antes da correção: API autenticada HTTP 200, confirmação
positiva e cliente de Desistiu para Apresentado. A regressão permanente testa
de novo a aceitação antiga carregando o bundle anterior em VM. Com o bundle
novo: correção incompatível HTTP 422, sem alteração a B5/B6, eventos, preços,
comissões, espelhos ou backups; correção segura HTTP 200; revisão antiga HTTP
409; replay sem duplicação. Testa ainda a edição legada, fronteiras no mesmo
dia, cadeias de versões, requalificação, novo movimento, reserva/venda e um B5
antigo incompatível. Ver [matriz](STATE_MATRIX.md).

## Baterias concluídas

| Execução | Resultado |
|---|---|
| Suites Node `tests/*.test.js` | 77/77 |
| Sintaxe JS/CJS/MJS e parse GS | 212/212 |
| Catálogo comercial de navegador | 35/35, sem falhas finais |
| P7 em Chromium, Firefox e WebKit | 12/12 combinações dos quatro tamanhos |
| Laboratórios P1 a P6 | 33/33 combinações; 352 verificações |
| Hotfix #29 | 2/2, desktop e mobile |
| Regressão de ciclo | 422 antes de B5; 200 para correção segura; 409 para CAS; B5 legado preservado |

Os dois testes históricos do catálogo mantêm a comparação exata e incluem
explicitamente a suite nova. Os guards históricos aceitam apenas a chamada
exata no editor legado, as alterações P7 anteriores e os ficheiros de
integridade com hashes revistos. Ambos os bundles são regenerados das fontes
partilhadas e verificados por `node scripts/build-commercial-integrity.js --check`.

As 20 suites de navegador iniciadas antes do ajuste final da edição legada
foram repetidas. O lote de cada resultado está identificado em
[results.json](results.json).

## Reprodução isolada

Utilizar Node 24, Playwright, Chromium/Chrome, Firefox e WebKit e o diretório
de artefactos fora do repositório. Usar as variáveis `PLAYWRIGHT_MODULE`,
`PLAYWRIGHT_BROWSERS_PATH`, `CHROME_EXECUTABLE`, `PDF_LIB_MODULE` conforme o
runtime local. A fixture comercial substitui a comunicação Google, serve um
catálogo também fictício para P7 e bloqueia origens externas no teste dirigido.

```powershell
Get-ChildItem tests -Filter '*.test.js' | Sort-Object Name | ForEach-Object {
  node $_.FullName
  if ($LASTEXITCODE) { throw $_.Name }
}
node tests/commercial-p7-cycle-integrity.test.js
$env:COMMERCIAL_TEST_PORT = '53922'
node tests/commercial-browser-regression.cjs
node tests/commercial-browser-regression.cjs commercial-p7-browser.mjs
```

P1–P6: `node tests/commercial-persistence-pN-browser.mjs` para cada N,
com portas loopback e artefactos próprios. Hotfix #29: servidor
`tests/helpers/active-write-preview.cjs` e
`tests/commercial-active-write-browser.mjs`. Não abrir site real ou reutilizar
perfil do utilizador. Nenhum serviço de teste fica aberto após a execução.

## Limites

Firefox, WebKit e Chromium são motores Playwright em Windows, não dispositivos
físicos. O teste P7 cobre 1440×900, 1366×768, 820×1080 e 390×844; o catálogo
histórico mantém os tamanhos originais de cada suite. Apps Script em VM não
valida quotas, disponibilidade ou comportamento de RPCs da plataforma real.
Falhas de quota injetadas não são medição de quota nativa. Ver
[impacto e riscos](SECURITY_IMPACT.md).
