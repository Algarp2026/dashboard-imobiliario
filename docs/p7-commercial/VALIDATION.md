# Validação P7

## Antes e depois

As três suites de referência na base passaram: `commercial-profile-followup`,
`crm-reform` e `commercial-stage` (navegador). Os testes P7 acrescentam prova
negativa antes da correção: 1 POST em vez de 0 ao repor a observação; 9 em vez
de 8 apresentações no Dashboard. Durante a preparação, a fixture inicial
reinicializava a fonte depois da autenticação/navegação e o navegador seguinte
retinha a revisão anterior: o teste foi corrigido para reinicializar antes de
carregar o CRM. Não houve aumento de timeout nem redução de asserções.

O diagnóstico de ciclo é executado à parte e **não é aprovação**: comprova que
a correção atravessando desistência global continua a poder ser gravada e a
reativar a oportunidade. Ver [matriz](STATE_MATRIX.md).

## Baterias concluídas

| Execução | Resultado |
|---|---|
| Suites Node `tests/*.test.js` | 76/76 |
| Sintaxe JS/CJS/MJS e parse GS | 211/211 |
| Catálogo comercial de navegador | 35/35, sem falhas finais |
| P7 em Chromium, Firefox e WebKit | 12/12 combinações dos quatro tamanhos |
| Laboratórios P1 a P6 | 33/33 combinações; 352 verificações |
| Hotfix #29 | 2/2, desktop e mobile |
| Diagnóstico de ciclo | Defeito reproduzido; API local HTTP 200 com confirmação |

Os dois testes históricos do catálogo mantêm a comparação exata e incluem
explicitamente a suite nova. O guard histórico do hotfix verifica todos os
bytes fora do predicado e das duas chamadas de contagem P7.

Para garantir a versão final, as 12 suites já iniciadas quando o predicado
foi restringido aos contadores foram reexecutadas. A suite nova P7 também
foi repetida com catálogo inteiramente fictício. O lote de cada resultado
está identificado em [results.json](results.json).

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
node tests/commercial-p7-cycle-diagnostic.cjs
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
