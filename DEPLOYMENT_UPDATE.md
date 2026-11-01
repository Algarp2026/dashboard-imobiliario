# PR #25: consultas, rascunhos e novas publicacoes

## Ambito e seguranca

Complemento da mesma branch `codex/fix-local-recovery-archive`, a partir de `869397c`. Sem merge, deployment, acesso a fontes comerciais reais ou alteracao de credenciais. API, Apps Script, integridade Google, dados, precos, estados, PDF e arquivo local anteriormente auditado permanecem inalterados.

## Consultas versus edicoes

O guard anterior tratava foco, modais abertos e seletores genericos como edicao. Agora distingue controlos comerciais (formularios, clientes/eventos/agentes e precos) de pesquisa, filtros, ordenacao, comparacao, selecao de apresentacao e opcoes de PDF. So uma diferenca real relativamente ao valor inicial protege o formulario. Preferencias em chips sao comparadas com o rascunho da ficha original, incluindo rascunhos preservados de outros clientes. A simples abertura do editor nao e uma alteracao.

O epoch de edicao continua a mudar para edicoes comerciais, preservando a protecao contra respostas remotas em curso. Consultas nao criam pendingSync/requestId nem desativam a atualizacao automatica. Pedidos enviados nao confirmados conservam o estado de sincronizacao independente do rascunho.

## Identidade da publicacao

`scripts/build-deployment-version.cjs` e executado apenas no build Vercel. Usa SHA-256 de VERCEL_DEPLOYMENT_ID (ou VERCEL_URL, unico por deployment), nunca o SHA do commit como identidade. Falha explicitamente se faltar identificacao. O build:

- Incorpora a identidade no HTML de index, commercial, comparador e access; nao a deduz da primeira resposta da rede.
- Versiona os URLs dos scripts/estilos locais para evitar uma mistura de HTML novo com JS antigo na cache.
- Gera deployment-version.json, contendo apenas format e version, sem dados CRM, ambiente privado ou credenciais.
- Em production incorpora o dominio VERCEL_PROJECT_PRODUCTION_URL: ate um endereco imutavel de deployment consulta a versao ativa na producao. Previews consultam exclusivamente a propria origem, nunca a producao.

O manifesto e publico para funcionar tambem no acesso/login; apenas este ficheiro recebe CORS publico. Consultas a outra origem omitem cookies. Os headers de navegador e CDN sao no-store, e cada GET usa cache:no-store e um parametro unico. Autenticacao das paginas, ficheiros comerciais e API nao foi alterada.

Referencia oficial: [variaveis de sistema Vercel](https://vercel.com/docs/environment-variables/system-environment-variables), incluindo a disponibilidade no build de VERCEL_DEPLOYMENT_ID e VERCEL_PROJECT_PRODUCTION_URL.

## Monitor e procedimento seguro

- Consulta ao abrir, a cada dois minutos, em pageshow/BFCache, online e regresso/foco. Eventos proximos sao limitados, chamadas em curso agregadas, e Web Locks/BroadcastChannel coordenam separadores da mesma origem. Sem essas APIs, cada separador usa polling limitado; dominios diferentes nao partilham locks.
- Erros HTTP, HTML, JSON invalido e falhas de rede nao significam nova publicacao.
- Sem trabalho pendente, um dialogo modal obrigatorio nao aceita Escape. Atualizar agora carrega um URL nao reutilizado da pagina; nao existe refresh automatico nem ciclo de reload.
- Com formulario editado ou pedido pendente, nao recarrega: permite continuar exclusivamente a edicao local ou preservar o trabalho. O aviso continua visivel.
- Depois da deteccao, bloqueia novas gravacoes remotas no inicio da escrita e imediatamente antes do POST. Uma operacao ja enviada pode concluir normalmente, mantendo as validacoes existentes. Nao aborta nem duplica a gravacao.
- Revalida tambem a necessidade de atualizar depois da preparacao/leitura previa, do arquivo do pedido e da renovacao de ticket. Uma mudanca de versao nessas esperas conserva o estado local pendente sem o classificar como falha de rede.
- As leituras comerciais pendentes deixam de poder substituir a ficha depois da deteccao da atualizacao. O monitor de versao continua ativo.

### Preservar campos ainda nao guardados

O ficheiro `the-view-trabalho-antes-de-atualizar.json` inclui os controlos do formulario, valores, selecoes, chips pressionados e contexto, sem passwords ou ficheiros anexos. Inclui as chaves locais CRM originais e, na pagina Comercial, a memoria atual, as copias IndexedDB e os rascunhos complementares. Um preco/cliente ainda apenas no formulario nao e confundido com os dados persistidos.

O download nao e declarado concluido pela criacao do Blob. Existe um link manual persistente e exige-se selecionar o ficheiro guardado. Antes de atualizar, compara-se o ficheiro exato e uma nova captura de campos/memoria/armazenamento. Se algo mudou ou existe uma operacao em curso, nao recarrega. Nenhum pedido, identificador, backup ou chave e eliminado.

Este e um arquivo administrativo, nao uma importacao automatica. Apos atualizar, campos nao submetidos podem necessitar de reposicao manual a partir do ficheiro verificado. Os pedidos originais continuam nos seus locais normais para a recuperacao/reconciliacao ja implementada. Preservar o ficheiro com acesso restrito, pois pode conter dados pessoais.

## Testes e evidencias

Fontes comerciais e analiticas exclusivamente ficticias; rede externa bloqueada. A origem alternativa usada no teste e interceptada e nunca existe uma chamada a producao.

O catalogo Node inclui teste de build isolado com dois deployments do mesmo commit, identidade incorporada, recursos versionados, nenhuma exposicao de segredos e headers. O catalogo de navegador passa de 29 para 30 suites: a nova suite valida desktop/mobile, filtros em todos os modulos, atualizacoes com filtros, foco limpo, rascunho protegido, download/verificacao/tampering, pedidos originais, varios separadores, rede/online, BFCache, temporizador, visibilidade, todas as entradas, origem publicada e resposta perdida/em curso.

Os guards historicos nao foram desativados: `deployment-source.cjs` verifica os hashes dos cinco trechos revistos e reconstitui exatamente 869397c; depois os guards anteriores continuam a verificar arquivo, PDF, CAS, tickets e restante codigo. A fixture de testes e congelada por hash. As expectativas Vercel aceitam apenas buildCommand, outputDirectory e os headers exatos novos; mantem todas as flags de deployment e configuracao anterior.

[Resultados e capturas](docs/deployment-update/README.md):

| Validacao real | Resultado |
| --- | --- |
| Catalogo Node completo | 64/64 aprovado |
| Catalogo de navegador, ultimo resultado de cada suite | 30/30 aprovado apos repeticoes |
| Sintaxe JS/CJS/MJS | 146 verificacoes aprovadas |
| Ultima repeticao dirigida: versao, auto-sync e reconciliacao | 3/3 aprovado |

A primeira passagem completa do navegador terminou com 26/30: uma falha de recuperacao de rede em auto-sync e tres processos terminados sem diagnostico (code:null). Os quatro testes foram repetidos sem reduzir as assercoes e passaram; nao se atribui uma causa de aplicacao aos processos sem diagnostico. Ha sensibilidade temporal residual nos testes de relogio/rede.

A nova suite teve ajustes de fixture: recursos publicos eram redirecionados indevidamente para HTML de login pelo servidor de teste; uma espera de navegacao lia o modulo antes de existir; o relogio tem de ser instalado antes dos temporizadores; e uma iteracao generica acionava o seletor legado oculto de cliente, abrindo a ficha e desviando o foco. Corrigiram-se os testes para usar controlos visiveis e esperas efetivas, mantendo as verificacoes de seguranca e os resultados de falha originais. Nao foi feita uma alteracao especulativa ao renderer da pesquisa.

As tentativas e o resumo por ultimo resultado permanecem separados em JSON. O hash do commercial.js do catalogo Node final coincide com o ficheiro estabilizado; o resumo inclui tambem os hashes dos novos ficheiros e da configuracao. Nenhum resultado constitui uma medicao real da Vercel ou Google. Mobile significa viewport Chrome de 390 px, nao um ensaio fisico em Safari/iOS.

## Limitacoes e publicacao futura

1. **Primeira adocao:** uma pagina aberta antes da primeira instalacao deste monitor nao possui este codigo. Nao e tecnicamente possivel atualiza-la retroativamente so com JS do novo deployment. A primeira publicacao exige comunicar uma atualizacao manual a todos os utilizadores/separadores antigos. Depois, paginas desta versao ou posteriores detetam novas publicacoes. Isto nao substitui autenticacao nem constitui protecao contra um cliente deliberadamente alterado.
2. Nenhum deployment real foi executado nesta etapa. O build e o comportamento Google/Vercel foram validados apenas em ambiente isolado; o funcionamento na plataforma exige verificacao posterior autorizada numa Preview com fonte ficticia. Build Command/Output Directory devem corresponder a vercel.json. Nenhum ficheiro gerado foi importado da producao.
3. Ativar variaveis de sistema no projeto quando necessario; nao criar passwords no frontend. Um build de producao sem identidade ou dominio valido falha, em vez de publicar uma versao sem monitor. Nao executar o gerador contra o checkout de trabalho: ele altera HTML apenas no ambiente efemero de build; os testes usam uma pasta temporaria.
4. Browsers com IndexedDB inacessivel ou que recusam exportacao podem impedir a preparacao integral: manter a pagina e pedir recuperacao administrativa, nunca forcar refresh. Nao apagar o arquivo para desbloquear a atualizacao.
5. Uma implantacao production ainda nao promovida compara com o dominio atualmente ativo; para testar antes da promocao usar Preview com ambiente/fonte ficticios. Nenhuma promocao esta autorizada nesta PR.
6. O aviso nao repara uma gravacao pendente e nao resolve conflitos automaticamente. Estes continuam sujeitos aos protocolos e aprovacao existentes. Nunca limpar B5, pendingWrite ou IndexedDB para atualizar.

Nao publicar nem fazer merge sem revisao e autorizacao expressas.
