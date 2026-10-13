# The View - Integridade da sincronizacao: fase 2

## Ambito e proveniencia

Branch: `codex/fix-commercial-auth-sync`. Commit anterior auditado: `170f5aa1f95f38c41da081f60971bb1295662c2a`. O commit final desta fase pode ser obtido com `git rev-parse HEAD`.

Foi lido o AGENTS.md e o relatorio independente do Work em `C:/Users/Algarpredio/.codex/.chatgpt-projects/g-p-6a57b927d1608191bd0ffd9f5e981573/audit/validation/resultado-validacao.md`. A auditoria anterior foi essencialmente de leitura e nao provou escrita, concorrencia ou Google real.

Sem push, publicacao ou alteracao da aplicacao/Sheet de producao. Sem autorizacoes Google modificadas. A pre-visualizacao HTTPS e um projeto separado, sem Git conectado, com fonte ficticia e rede de saida bloqueada. Simuladores e endpoints de teste ficam fora do repositorio da aplicacao.

## Ficheiros desta fase

- `commercial.js`: confirmacao efetiva, ID pendente preservado em recuperacao rejeitada, metadados PDF offline e mensagens de estado.
- `api/commercial-data.js`: recibo persistido e identificador obrigatorios; capacidade de escrita confirmada tambem na fonte.
- `server/commercial-store.js`: erros controlados de escrita desativada e capacidade.
- `google_apps_script.gs`: gate de escrita, timestamp da intencao, verificacao B2/B3, deduplicacao de backup e limite preventivo.
- `tests/helpers/apps-script-store.js`: falhas controladas de backup/Store e representacao das celulas.
- `tests/commercial-sync-client.test.js`: cache, refresh, falsas confirmacoes, expiracao durante recuperacao e tres PDFs.
- `tests/commercial-write-integrity.test.js`: fluxo completo API/Apps Script simulado, concorrencia e escritas parciais.
- `scripts/check-google-read.js`, `tests/google-read-check.test.js`, `tests/fixtures/google-test-store.json`: preparacao da verificacao Google somente de leitura e base inteiramente ficticia.
- `COMMERCIAL_SYNC_SECURITY.md` e este documento: configuracao, limites e evidencias.

Nao alterados nesta fase: config.js, URL /exec, data.json, data.xlsx, app.js, HTML/CSS, plantas, pricing, recomendacoes, compset e funcoes comerciais do CRM em cinco abas. Nao houve migracao destrutiva de Store!B2 nem mudanca da chave principal local.

## Confirmacao e concorrencia

O navegador envia uma unica tentativa por operacao, com snapshot local duravel, ID, revisao e comprovativo de leitura assinado. HTTP 200 nao basta: a resposta deve ter `persisted:true`, o ID enviado, protocolo, revisao esperada e data valida. O servidor verifica novamente a revisao SHA-256 do JSON deterministico enviado.

O timestamp apresentado nos tres PDFs e a ultima confirmacao real conhecida da fonte, incluindo em estado offline/pendente/conflito. Sem confirmacao anterior, nenhuma data e inventada. A data de geracao do PDF permanece independente.

CAS: leitura da revisao efetiva B2, comparacao, intencao, backup, escrita, espelhos e recibo ocorrem no mesmo `getScriptLock()`. Duas sessoes da mesma revisao nao conseguem ambas substituir a base: a segunda escrita recebe 409. Alterar a revisao no pedido sem um comprovativo correspondente ou reutilizar o comprovativo de outra sessao recebe 403 antes de chamar Google.

As revisoes sao hashes, nao contadores 100/101. Mudancas externas ao protocolo e escritores de outros projetos nao respeitam esse lock: todas as publicacoes legadas devem ser revistas pelo administrador antes de uma ativacao real.

## Escrita parcial e recuperacao

Google Sheets nao oferece uma transacao unica entre todas as abas. A consistencia e detetavel e reparavel, nao atomicidade completa.

1. `B5` regista ID, base, hash desejado e timestamp original antes da mutacao.
2. O backup preserva B2 anterior; B2/B3 sao verificados antes de atualizar os seis espelhos.
3. So depois dos espelhos e emitido recibo B4 e retirada a intencao B5.
4. Se houver falha, nenhuma resposta positiva e emitida. Leituras confirmadas e novas operacoes sao bloqueadas por B5.
5. A recuperacao manual usa o mesmo ID/conteudo/base; repara B3/espelhos, conserva a hora original e nao duplica um backup ja acrescentado.
6. Uma sessao expirada durante a recuperacao nao elimina o ID local de uma tentativa anterior desconhecida. Renovar o acesso permite retomar a mesma operacao.
7. Se a resposta se perder depois da conclusao, uma nova leitura verifica o estado; nao existe repeticao automatica cega.

Nao apagar B5 manualmente. Se o navegador perder o snapshot necessario, ou a fonte mudar fora do protocolo, a recuperacao exige intervencao administrativa e backups. Intencoes antigas sem timestamp nao possuem a mesma garantia de deduplicacao de um backup anterior a Store; requerem revisao administrativa.

Gate adicional: `CRM_API_WRITES_ENABLED` deve ser exatamente `true` nas Script Properties. Ausente/false desativa tanto crmWrite/crmRecover como testWrite. `canWrite` exige este gate e os gates do servidor. Nenhum gate foi ativado numa fonte real nesta entrega.

## Capacidade de Store

A fixture anterior de 63 clientes tinha 60 783 caracteres. Testes em memoria nao reproduzem limites de celulas Google. A pre-visualizacao desta fase conserva 63 clientes ficticios, mas remove campos redundantes apenas dessa fixture, antes de gerar a base; nao compacta nem apaga dados da aplicacao.

Foi adotado um limite preventivo de 50 000 caracteres para o JSON desejado e o anterior que seria guardado no backup. Uma base maior recebe `STORE_SIZE_LIMIT`/413 antes de criar intencao ou backup. Dados locais ficam preservados e nenhum texto e truncado. Isto pode bloquear escritas de uma carteira real grande: medir a fonte antes de ativar escrita. Um eventual armazenamento repartido/alternativo exigira tarefa propria, migracao e autorizacao.

[Google documenta o risco de celulas com mais de 50 000 caracteres na conversao Excel para Sheets](https://support.google.com/drive/answer/37603?hl=en-uk). A capacidade efetiva por chamada Apps Script e os limites da conta ainda devem ser verificados na Sheet de testes; nao foram medidos no servico real.

## Evidencias automatizadas

16 suites em tests/*.test.js aprovadas, incluindo pricing/compset, CRM progressivo, cinco abas, follow-ups, recomendacoes, relatorios, rotas e sincronizacao.

- Criar cliente, ler em nova sessao, editar preferencias, reler, criar evento: IDs/historico/campos desconhecidos preservados.
- Duas sessoes, pedidos concorrentes, revisao manipulada e comprovativo de outra sessao: rejeicao correta e dados atuais preservados.
- Fonte indisponivel, timeout, HTTP 401/403/500, JSON invalido e resposta 200 sem recibo: nunca confirmados como sucesso.
- Backup/header/append antes e depois, Store antes e depois, B2 atualizado sem B3 e espelho interrompido: B5 detetavel e recuperacao idempotente.
- Resultado perdido depois da conclusao: leitura verifica a persistencia, sem duplicar escrita/backup.
- Sessao assinada realmente expirada: 401 sem acesso a Google; snapshot anterior preservado.
- Base acima do limite preventivo: B2/B3, backup e intencao inalterados.
- Perfil sem cache e fonte indisponivel: zero clientes comerciais confirmados, zero importacoes/migracoes e zero escritas; leitura recuperada depois.
- Tres PDFs com dados sincronizados e locais: ultima confirmacao historica conhecida e nenhuma alteracao comercial durante exportacao.

O navegador usa a aplicacao, login, API nativa e Apps Script real executado sobre uma Sheet simulada. A fonte em memoria nao persiste quando o ambiente termina. A evidencia completa e os PDFs sinteticos encontram-se na pasta de artefactos `phase2-preview`, fora do Git.

Validacao local completa: 63 clientes iniciais, 64 apos criacao e 62 incluidos nos filtros PDF (dois encerrados excluidos). Seis PDFs sincronizados/offline renderizados: 11+2+5 paginas em cada estado, total 36. Margens, fonte minima aproximada 8,5 pt, origem, confirmacao e numeracao verificadas em todas as paginas e montagem visual inspecionada. Navegador desktop e perfil mobile limpo sem erros JavaScript nem overflow. A contagem 63 nao e fixa na aplicacao.

## Preparar Google real: administrador

Ainda nao executado: OAuth real, API Executable, LockService no servico, quotas, tamanho efetivo, persistencia Google e espelhos reais. Nao considerar esta fase uma validacao desses pontos.

1. Criar Sheet e Apps Script de testes separados. Usar identidade Google dedicada sem acesso a producao. O administrador inicializa somente essa Sheet com `tests/fixtures/google-test-store.json` em Store!B2; B3 pode conter a hora dessa inicializacao. Nao copiar dados pessoais reais.
2. Apps Script e cliente OAuth devem usar o mesmo projeto Cloud standard, com Apps Script API ativada. Esta arquitetura usa OAuth de utilizador autorizado, nao conta de servico. Configurar consentimento/offline diretamente em canais administrativos seguros.
3. Rever scopes efetivos: `https://www.googleapis.com/auth/spreadsheets` e `https://www.googleapis.com/auth/userinfo.email` para identidade; conceder acesso somente aos recursos de testes. Nao acrescentar Drive/Gmail desnecessarios.
4. Configurar Script Properties: CRM_SPREADSHEET_ID=ID da Sheet de testes, CRM_ENVIRONMENT=test, CRM_API_CALLER_EMAIL=identidade dedicada, CRM_API_WRITES_ENABLED=false. Publicar apenas projeto de testes como API Executable, limitado a identidade autorizada; nao alterar /exec real.
5. Configurar servidor de testes: COMMERCIAL_ACCESS_PASSWORD/SECRET novos; CRM_GOOGLE_CLIENT_ID/CLIENT_SECRET/REFRESH_TOKEN; CRM_GOOGLE_DEPLOYMENT_ID da API Executable; CRM_GOOGLE_SPREADSHEET_ID esperado; VERCEL_ENV=preview; CRM_GOOGLE_WRITES_ENABLED=false; CRM_GOOGLE_TEST_WRITES_ENABLED=false. Segredos nunca pelo chat/Git/frontend/URL/log.
6. Executar `scripts/check-google-read.js` com CRM_GOOGLE_READ_CHECK=true, por processo que recebe os segredos de um gestor autorizado. Recusa Production, usa apenas crmRead e exige fonte test com escrita desativada. Devolve contagens, hash, data e tamanho, nunca nomes/contactos ou tokens. A leitura nao inicializa/repara/espelha dados.
7. Apenas depois de leitura valida e autorizacao para escrever na Sheet ficticia, ativar os tres gates de teste. Repetir criacao/refresh/preferencias/evento, CAS, backups e espelhos com dois navegadores. Exportar evidencia sem dados pessoais.
8. Desativar gates quando terminar. Qualquer ativacao/publicacao de producao exige autorizacao nova e validacao independente.

Documentacao: [Execution API](https://developers.google.com/apps-script/api/how-tos/execute), [LockService](https://developers.google.com/apps-script/reference/lock/lock-service), [OAuth offline](https://developers.google.com/identity/protocols/oauth2/web-server#offline).

## Repetir testes locais

```powershell
node --check commercial.js
node --check app.js
node --check config.js
Get-ChildItem tests -Filter '*.test.js' | ForEach-Object {
  node $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "Falhou: $($_.Name)" }
}
```

## Validacao independente HTTPS

O URL temporario e a password exclusivamente ficticia sao entregues fora do repositorio. O painel /validation.html exige a mesma sessao CRM; /api/test-control exige cookie e origem correta. Servidor, fixture, segredos e biblioteca de testes nao sao servidos como ficheiros publicos. Nao existem esses endpoints na aplicacao de producao.

Procedimento: login em janela privada; confirmar 63 clientes e origem partilhada; criar cliente, aguardar confirmacao, refresh; editar preferencias e registar apresentacao; dois perfis para conflito; usar painel para falhas antes/depois de Store e backups; renovar acesso apos expirar sessao; retomar apenas operacao pendente; gerar tres modelos sincronizados/offline e comparar ultima confirmacao. Usar outro perfil limpo durante indisponibilidade. Restabelecer modo normal e repor apenas fixture no fim.

Limites: password partilhada sem auditoria individual; in-memory nao valida Google; ambiente temporario termina e elimina fixture; falta validacao externa Work desta fase. LocalStorage e PDFs reais exigem dispositivos autorizados. Nunca declarar sucesso integral perante recibo ausente, Store parcial ou fonte nao verificada.
