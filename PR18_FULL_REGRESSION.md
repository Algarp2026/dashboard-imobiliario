# PR #18: regressao completa antes do merge

Data: 2026-10-22. Codigo funcional testado: `468dc53145414bfcedae220c88813ce0dd98b4e7`.
Branch: `codex/measure-commercial-latency`. Sem alteracoes ao codigo da aplicacao.

## Resultados das execucoes locais

Node: duas execucoes completas, ambas com **52/52 suites aprovadas**.

| Execucao de navegador | Resultado |
| --- | --- |
| Primeira passagem integral | 21/23 |
| Repeticao apos corrigir a espera da venda | 22/23 |
| Verificacao integral final com as duas esperas explicitas | **23/23 aprovadas** |

Nao foram omitidas suites nem reclassificadas falhas. Os tres resultados de
navegador ficam separados em [docs/commercial-latency](docs/commercial-latency/README.md).
O catalogo inclui os mesmos 23 nomes da PR #17, sem argumentos de selecao de suites.
Sintaxe: 118 ficheiros JS/TS e dois .gs aprovados; verificacao de diff sem erros.
Chrome real, desktop/portatil/tablet/mobile conforme os cenarios do catalogo;
dados exclusivamente ficticios, API autenticada local, Script em VM e Sheet em
memoria. Browser limitado ao loopback e chamadas Google substituidas por fixtures.

## Falhas iniciais e testes ajustados

1. `crm-reform-browser.mjs`: o teste encontrava o indicador anterior sincronizado
   antes de a nova venda terminar. O log mostrou GET antes do POST confirmado.
   O teste passa agora a exigir a resposta 200/persisted da venda correspondente
   antes de consultar a fonte. Mantidas as verificacoes de venda, comissao,
   receita liquida, historico, refresh e ausencia de alteracoes noutros clientes.
2. `commercial-client-phase2b-browser.mjs`: a assercao imediata da pesquisa por
   Piso 5 encontrou uma fracao em vez de seis nas duas passagens completas.
   Passou numa repeticao isolada sem alteracoes. Acrescentou-se uma espera pela
   renderizacao das mesmas seis fracoes, seguida da assercao original, e um
   diagnostico limitado ao campo de pesquisa. Sem mudar valores esperados,
   aumentar timeouts, repetir preenchimentos ou dispensar verificacoes.

A suite da venda passou tambem na base PR #17; isso nao prova a ausencia de
intermitencia anterior. A causa precisa da temporizacao da pesquisa nao foi
demonstrada no teste isolado e permanece uma limitacao a acompanhar.
Nao se atribuiu essa falha automaticamente a uma regressao da persistencia.

## Integridade e continuidade

As suites aprovadas cobrem validacao comercial na fonte sob lock antes de B5,
CAS/read tickets, conflitos 409, B5/B6, checksum/blocos, backup, idempotencia,
timeouts/perda de confirmacao, recuperacao PR #14/Apt.16, pedidos antigos,
reconciliacao, quota real de localStorage e arquivo IndexedDB PR #15.
Incluem reservas/vendas/comissoes, precos/historicos, preservacao de campos
desconhecidos e outros clientes, contactos, selecao/apresentacoes, relatorios,
PDFs com plantas, navegacao e autenticacao.

Os ficheiros funcionais continuam identicos a `468dc53`: frontend, API,
`server/commercial-store.js`, ambos os .gs, configuracao, dados, plantas e
protecao de deployment. Apenas dois testes e documentacao/resultados mudaram.
Nenhum teste foi removido, desativado ou convertido num resultado ficticio.

## Comandos

```powershell
node tests/commercial-client-complete-regression.cjs
node tests/commercial-browser-regression.cjs
```

O primeiro foi repetido com `COMPLETE_ARTIFACTS` fora do repositorio. O segundo
foi executado sem argumentos, com Playwright/Chrome configurados, porta local
dedicada e `BROWSER_REGRESSION_OUTPUT` separado em cada passagem. As repeticoes
dirigidas foram guardadas fora do repositorio; nao substituem o catalogo completo.

## Riscos residuais e publicacao

- Testes locais/VM nao medem Google real, arranque frio, quotas ou concorrencia
  distribuida do servico Google. A melhoria real de latencia continua por medir.
- A intermitencia inicial da pesquisa deve continuar visivel no historico de
  validacao; observar a estabilidade futura, sem relaxar a exigencia das seis fracoes.
- A publicacao futura exige manter o bundle `google_commercial_integrity.gs`
  junto do Script. Nenhum deles foi publicado nesta intervencao.
- Sem acesso a base real, credenciais, merge, deployment ou mudancas de producao.
  PR permanece Draft. Os testes nao constituem autorizacao de publicacao.

Conclusao: regressao local aprovada, com 52/52 suites Node e 23/23 suites de
navegador. Nao foram detetadas regressoes de integridade comercial, recuperacao
ou sincronizacao nos cenarios executados. Nao e uma garantia de desempenho ou
validacao de servicos Google reais. A decisao de merge/publicacao fica pendente
de autorizacao expressa do utilizador.
