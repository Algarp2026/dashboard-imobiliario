# Publicação coordenada da P7

**Plano, não autorização.** Revisão técnica local e publicação são decisões
separadas. Não fazer merge se isso puder publicar automaticamente. O runtime
Google real, as permissões e a configuração de publicação não foram verificados.

## Componentes

- Navegador: `commercial-opportunities.js`, `commercial-client-workflow.js`
  e `commercial-integrity.js` gerado. Manter as duas correções anteriores em
  `commercial.js` e `commercial-client-followup.js`. O editor legado em
  `commercial.js` chama a política antes de alterar o estado local.
- Política partilhada: `server/commercial-integrity.js`. O gerador incorpora
  as mesmas fontes nos bundles do navegador e Apps Script; `--check` verifica
  os bytes e o SHA. O handler Vercel não executa o módulo Node diretamente:
  verifica a capacidade e delega a validação autoritativa ao Apps Script.
- Fonte: atualizar `google_commercial_integrity.gs` como parte da implantação
  Apps Script que serve `crmRead/crmWrite/crmRecover`. Não alterar
  `google_apps_script.gs`, identificador, protocolo, scopes ou credenciais.
  A versão 1 da capacidade existe nas duas versões: preflight e GET verdes
  não provam que a nova regra está instalada.

## Compatibilidade

A API antiga (a da base P7) e a desta correção são byte a byte iguais. As
linhas abaixo valem para ambas. O protocolo e a estrutura dos dados mantêm-se.

| Navegador | Fonte antiga | Fonte corrigida |
|---|---|---|
| Antigo | Inseguro. O pedido incompatível é gravado e a oportunidade reabre | A escrita incompatível recebe 422. A leitura de uma correção válida no mesmo dia ainda pode reabrir visualmente no separador antigo; não permitir operação até atualizar |
| Corrigido | Inseguro. O formulário bloqueia, mas uma chamada direta autenticada ainda pode gravar | Combinação validada em fixtures; escrita e projeção concordam |

A regressão carrega o bundle antigo em VM e comprova a aceitação antiga,
o risco de leitura de um separador antigo e a recusa de recuperação de um B5
incompatível após a troca do bundle. A recusa não elimina nem confirma B5.
Não há reconstrução automática de eventos legados já sobrescritos: incluir
na revisão pré-publicação um diagnóstico de leitura autorizado para esses
registos, sem imprimir dados pessoais nem inferir requalificação.

## Sequência recomendada, só após autorização

1. Validar em Sheet **isolada**, com dados fictícios, projeto e implantação
   próprios e `CRM_ENVIRONMENT=test`. Confirmar a identidade esperada
   (`CRM_API_CALLER_EMAIL`), o acesso OAuth da Execution API e a associação
   correta de `CRM_SPREADSHEET_ID` com o `CRM_GOOGLE_SPREADSHEET_ID` e
   `CRM_GOOGLE_DEPLOYMENT_ID` da API. Nunca reutilizar credenciais de produção
   num ambiente de teste ou disponibilizar os seus valores.
2. Numa janela aprovada, suspender novas gravações, confirmar que não há
   operações em curso e guardar cópia verificada da autoridade, versões,
   B5/B6 e comprovativos. Inspecionar pedidos pendentes apenas com autorização:
   não continuar se houver B5 incerto ou incompatível. Não limpar B5 nem
   reapresentar um pedido antigo com outro identificador. Preservar rascunhos e
   cópias locais. Usar as barreiras existentes `CRM_GOOGLE_WRITES_ENABLED` na
   Vercel e `CRM_API_WRITES_ENABLED` na fonte; verificar que a suspensão
   efetivamente alcança todos os consumidores e instâncias.
3. Com escrita suspensa, preparar a implantação da fonte com o bundle
   regenerado no mesmo destino autorizado. Verificar versão/artefacto
   publicado e identidade da fonte. O anúncio `commercialIntegrity: 1`
   não é suficiente. Validar no ambiente isolado 422 sem mutações para
   P7-11, 200 para correção segura, 409 para CAS e replay confirmado.
4. Publicar o frontend correspondente e confirmar que os módulos servidos
   pertencem ao mesmo commit. Atualizar ou fechar todos os separadores
   antigos de forma coordenada, preservando rascunhos e pedidos locais.
   Não limpar armazenamento. Confirmar a leitura, estados, contadores e
   versão na URL autorizada antes de reabrir a escrita.
5. Só reabrir por aprovação separada, com validação de origem e revisão,
   monitorização e plano para pedidos antigos. Não usar dados reais como
   fixture nem fazer uma escrita de teste em produção sem autorização própria.

## Suspensão e reversão

Parar perante divergência de versão ou revisão, 422 inesperado, falha de
autenticação, rascunho perdido ou B5 não resolvido. Suspender nos dois lados
antes de reverter. Um rollback do frontend pode reintroduzir a leitura
incorreta, mesmo com fonte nova; manter a escrita suspensa. Não restaurar
uma fonte antiga com escrita ativa: reporia a falha. Preferir manter a
validação nova e resolver a incompatibilidade em ambiente isolado. Não
restaurar snapshots, alterar B5/B6 ou apagar registos como parte de um
rollback de código. Uma recuperação de dados real exige decisão separada.
