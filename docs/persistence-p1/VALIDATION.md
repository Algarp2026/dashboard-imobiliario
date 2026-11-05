# P1 - Validacao local

Data: 05/11/2026. Branch: `codex/p1-commercial-contracts`.
Base: `origin/main` em `0eb44f20ebf0404a86e26be507769c285e259109`.
A referencia foi confirmada localmente; nao se fez fetch, push ou qualquer operacao GitHub remota nesta tarefa. A main local antiga noutro worktree nao foi alterada.

## Historia e fronteiras verificadas

P1 prepara contratos do percurso futuro formulario -> operacao duravel -> API -> CAS/B5/B6 -> comprovativo -> confirmacao local, sem ativar qualquer componente novo nesse percurso. Para preservar o comportamento atual, os testes existentes usam frontend/API reais com Google simulado e dados sinteticos; os testes novos usam funcoes atuais extraidas ou um modelo de referencia isolado.

| Fronteira | Evidencia | Limite |
|---|---|---|
| UI atual -> API local | Dez suites existentes de navegador aprovadas | Loopback autenticado ficticio, nao producao |
| API -> fonte simulada | Suites Node de concorrencia, integridade, escrita, tickets e recuperacao aprovadas | Sem chamada Google real |
| Resposta -> estado local | Loading, arquivo, pedidos pendentes e sincronizacao automatica aprovados | Nao elimina os P1 conhecidos |
| Persistencia proposta | Modelos de contrato/IndexedDB isolados aprovados nos casos descritos | Nao ligados ao produto; nao sao provas de correcao ja publicada |

## Resultados

- **70/70 suites Node aprovadas**, incluindo duas novas suites P1.
- **166/166 verificacoes de sintaxe aprovadas**, incluindo `app.js`, `commercial.js`, `config.js` e todos os novos scripts.
- **10/10 suites existentes de navegador aprovadas**.
- **3/3 motores no laboratorio P1**: Chromium 157.0.8103.39, Firefox 153.0, WebKit 26.5.
- Novo contrato: **15 casos do modelo puro**, dois casos de caracterizacao dos defeitos e sete cenarios browser por motor.
- Zero falhas de teste na execucao final. Os dois defeitos atuais foram reproduzidos intencionalmente: o sucesso do teste de caracterizacao significa que a falha continua presente, nao que foi corrigida.
- Sem pedidos externos no laboratorio P1, zero escritas comerciais remotas. Originais desconhecidos e branches preservados nos cenarios ficticios.

### Suites existentes de navegador executadas

```text
commercial-storage-reliability-browser.mjs
commercial-storage-growth-browser.mjs
commercial-recovery-archive-browser.mjs
commercial-loading-persistence-browser.mjs
commercial-safe-reconciliation-browser.mjs
commercial-auto-sync-browser.mjs
commercial-profile-followup-browser.mjs
commercial-presentation-pdf-browser.mjs
commercial-fraction-draft-browser.mjs
commercial-pending-local-browser.mjs
```

Nao foi executado o catalogo browser integral: a selecao cobre arquivo/PR26, recuperacao, sincronizacao, reconciliacao, loading, formularios e PDF, relevantes para garantir que a entrega aditiva P1 nao mudou o comportamento atual. Nenhuma suite existente, seletor, timeout ou verificacao foi alterado.

## Reproducoes e modelos novos

| Grupo | Testes | Resultado e interpretacao |
|---|---|---|
| Cache atual offline | P1-CUR-01 | Perda da edicao do outro separador reproduzida em Node e tres motores; precisa de correcao futura. |
| Exportacao atual | P1-CUR-02 | Dados e base de instancias diferentes produzem reversao sem conflito; precisa de correcao futura. |
| CAS local proposto | P1-IDB-01/03 | Duas propostas independentes e duas incompativeis permanecem em quatro operacoes, duas branches, com exports coerentes. Modelo teste, nao novo motor comercial. |
| Abort/quota | P1-IDB-02, P1-MIG-02 | Falha injetada reverte alteracoes multi-store; origem e cursor preservados. Nao e esgotamento fisico da quota. |
| Exportacao | P1-EX-01/02/03 | Base incoerente e instancia trocada rejeitadas; sem base verificavel preserva dados com rotulo forense. |
| Identidade e estado | P1-OP-01/02/03/04, P1-ST-01/02 | IDs distintos; retry exato; rejeicao de outro conteudo ou prova incompativel; guards e pedido incerto preservados. |
| Recibo antigo | P1-REC-01 | Cadeia alcancavel confirma A apos B sem reativar A; orfao nao confirmado; outro conteudo bloqueado. Modelo em memoria, nao lookup Google. |
| Migracao | P1-MIG-01/03/04 | Retoma por checkpoints, reabertura normal e preservacao exata de origem opaca com NUL/acento/surrogate isolado. |
| Versoes mistas | P1-MIX-01/02 | Contrato exige verificacao em API e fonte; novo armazenamento isolado nao e alterado pelo antigo, mas cache antiga continua vulneravel. Fence real nao implementado. |

Os modelos nao executam retencao/limpeza de arquivos atuais, nao alteram B5/B6 nem introduzem protocolo remoto ativo.

## Medicoes strict com payloads representativos

Cada fixture: 65 clientes, 106 eventos, 39 estados e 39 precos **todos ficticios**, campos desconhecidos e preenchimento pseudoaleatorio deterministico. Tres tamanhos de snapshot canonico. Dois aquecimentos e oito amostras por tamanho/motor; operacoes pequenas de CAS anteriores separadas do benchmark. Sem outras suites de navegador a correr durante a medicao final.

Serializacao inclui canonicalizacao e UTF-8; hashing mede SHA-256 dos bytes preparados. Compressao mede gzip separadamente; roundtrip e verificado fora desse tempo. Transacao mede abertura ate oncomplete, com escrita de corpo/cabeca e `durability: strict`. Verificacao mede leitura posterior e hash. Cada iteracao varia um campo sintetico, evitando medir apenas put identico. Nao se incluiu rede Google, fila comercial ou migracao real.

Medianas em milissegundos, p95 transacional entre parenteses:

| Motor | Bytes do payload | Serializacao | Hash | Gzip | Transacao strict (p95) | Leitura/verificacao |
|---|---:|---:|---:|---:|---:|---:|
| Chromium | 180091 | 0,9 | 0,2 | 3,9 | 4,9 (5,4) | 1,4 |
| Chromium | 450091 | 1,7 | 0,3 | 8,2 | 5,6 (5,7) | 1,7 |
| Chromium | 850091 | 2,9 | 0,5 | 14,5 | 6,0 (6,6) | 2,4 |
| Firefox | 180091 | 1 | 0 | 2 | 3 (4) | 1 |
| Firefox | 450091 | 2 | 0 | 6 | 5 (6) | 2 |
| Firefox | 850091 | 3 | 1 | 12 | 11 (13) | 4 |
| WebKit | 180091 | 1 | 14 | 16 | 34 (35) | 27 |
| WebKit | 450091 | 1 | 14 | 15 | 34 (36) | 27 |
| WebKit | 850091 | 1 | 14 | 16 | 36 (37) | 25 |

Um zero observado significa resolucao do temporizador, nao custo nulo. P95 com oito amostras e apenas indicativo, nao SLO. As medianas das fases nao devem ser somadas como se fossem mediana de uma operacao completa.

### Interpretacao da diferenca WebKit

A lentidao nao pode ser atribuida apenas ao put ou tamanho: tambem aparece nas etapas assincronas de hash, compressao e verificacao. Este ensaio separa esses custos, mas nao isola a causa interna do motor (scheduling/IPC/IO/temporizadores). Nao foi feito perfil de sistema que permita escolher uma dessas hipoteses como causa confirmada.

As transacoes strict do WebKit mediram 34-36 ms de mediana, em vez de tratar o custo total anterior de aproximadamente 106 ms por operacao pequena como se fosse exclusivamente transacao. O ensaio anterior tinha workload distinto; nao se afirma melhoria percentual nem regressao do produto. Nenhuma garantia foi relaxada. Antes de P2: repetir em Safari real e hardware alvo, com varias repeticoes e payloads/carga representativos; avaliar batching fora das secoes criticas sem sacrificar durabilidade.

## Comandos de reproducao

Node instalado com os runtimes locais; equivalente a:

```powershell
node tests/commercial-persistence-p1-current.test.js
node tests/commercial-persistence-p1-contracts.test.js
Get-ChildItem tests -Filter '*.test.js' | ForEach-Object { node $_.FullName; if ($LASTEXITCODE) { throw $_.Name } }
node --check commercial.js
node --check app.js
node --check config.js
```

Suites existentes: usar `tests/commercial-browser-regression.cjs` com os dez nomes acima, `COMMERCIAL_TEST_PORT=53451` e `BROWSER_REGRESSION_OUTPUT` fora do repositorio. Playwright e Chrome fornecidos por `PLAYWRIGHT_MODULE` e `CHROME_EXECUTABLE`.

Laboratorio novo, separado do catalogo da aplicacao:

```powershell
$env:P1_TEST_PORT='53452'
$env:P1_ARTIFACTS='<pasta externa de resultados>'
$env:P1_BROWSER_ENGINES='chromium,firefox,webkit'
node tests/commercial-persistence-p1-browser.mjs
```

Requer motores Playwright instalados; pode usar `PLAYWRIGHT_BROWSERS_PATH` externo. O runner so aceita localhost em porta 53xxx, bloqueia rede externa, rejeita HTTP nao GET, cria perfis descartaveis e encerra o servidor. Nao abrir o dashboard real nem apontar estes testes a producao.

## Riscos e dependencias de P2

- Os defeitos P1-CUR-01/02 **permanecem no produto**, por restricao desta fase. Evitar interpretar esta entrega como reparacao operacional do incidente.
- Persistencia real, validadores completos de formatos, grafo de referencias, retencao, exportador e migracao shadow sao implementacoes futuras.
- Quota fisica, eviction, perda de energia/processo abrupta e Safari/iOS real nao demonstrados. WebKit Playwright nao e Safari real; storage.estimate estava indisponivel nesse motor.
- Cadeia de recibos e fence sao modelos/contratos, nao protecoes novas publicadas. P3-P5 exigem fonte Google ficticia, contratos coordenados de API/Apps Script e testes com versoes mistas reais.
- Nenhuma copia real foi lida, confirmada, desprotegida, comprimida ou eliminada. Exportacao externa nao autoriza limpeza.
- Nao foi feito push, PR, merge, deployment ou mudanca de visibilidade. Antes de publicar a branch manualmente, rever as politicas de deployment e garantir que previews nao escrevem na fonte real; nenhuma configuracao foi alterada para isso nesta entrega.

Conclusao: **P1 local preparada para revisao de contratos e testes**, nao aprovacao de P2 nem publicacao de nova persistencia. Funcionamento comercial atual preservado por ausencia de alteracoes de runtime e pelas regressoes executadas.
