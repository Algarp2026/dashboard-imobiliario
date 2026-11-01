# PR25 - Complemento da auditoria de fd978ee

## Base e ambito

Branch `codex/fix-local-recovery-archive`, HEAD inicial `fd978eeaae2098ecd854f9ec72ea5681af1b199f`, sem alteracoes locais ou commits posteriores ao auditado. A PR25 permanece aberta, Draft e com destino main. Nenhuma outra PR, merge, publicacao, migracao ou operacao comercial real.

## Diff funcional complementar

- `commercial.js`: normalizacao da selecao original/atual para proteger apenas diferencas reais. Adicionar/retirar protege; ordem, duplicados numericos, reversao e cancelamento nao originam falsos avisos. Estruturas nao interpretaveis bloqueiam a atualizacao. O rotulo "por guardar" utiliza o mesmo criterio. Nenhuma escrita apenas por consultar ou selecionar.
- O snapshot de deployment inclui cliente, selecao original e atual, valores normalizados, aprovacoes Map como pares explicitos, revisoes e contexto de edicao. Nao inclui DOM ou funcoes. Exportar nao importa nem confirma dados comerciais. A verificacao compara o ficheiro completo e uma nova captura; qualquer alteracao posterior invalida o ficheiro antigo.
- `deployment-guard.js`: Production usa a origem de producao incorporada no build. Num URL imutavel antigo, a navegacao manual vai para essa origem, nao para o deployment anterior. Apenas parametros de navegacao conhecidos sao conservados; cookies, tokens, hashes e armazenamento nao sao copiados.
- Preview ignora a origem de producao e consulta/navega apenas na sua origem. Manifestos e mensagens entre separadores exigem o mesmo ambiente/origem. `scripts/build-deployment-version.cjs` incorpora esse ambiente publico no HTML e manifesto.
- Uma mudanca de origem exige estado confirmado, cache coerente e ausencia de pedidos, rascunhos e copias desconhecidas/pendentes. A verificacao do arquivo reutiliza integridade estrutural, checksum e protecoes existentes, sem alterar a retencao. Backups legacy ainda presentes bloqueiam conservadoramente a saida da origem. Nenhuma limpeza automatica.
- Um backup externo verificado **nao** autoriza a saida de uma origem com trabalho pendente. Mantem-se o separador original e exige-se recuperacao administrativa; IndexedDB/localStorage e autenticacao sao isolados por origem.
- `tv_version`/`tv_from` registam a tentativa de navegacao. O manifesto confirma a identidade efetivamente carregada. Se a pagina continuar antiga, nao existe refresh automatico nem nova tentativa para o mesmo alvo: apenas nova consulta e mensagem de falha. Uma publicacao posterior e distinguida; parametros obsoletos sao removidos ao confirmar a versao corrente.

## Testes e evidencia

Resultados finais e comandos: [evidencia de validacao](docs/fraction-origin-recovery/README.md).

**65/65 suites Node, 31/31 suites de navegador e 150/150 verificacoes de sintaxe aprovadas. Zero falhas finais.** As suites diretamente afetadas de deployment/arquivo foram repetidas no codigo final e passaram. Hash do `commercial.js` validado: `47433104b37bc7fc50761702db01d8e9314d2fe4e64f5f244dd393c6f9c24406`.

Os testes novos exercitam normalizacao, consultas, selecao, reversao, cancelamento, confirmacao remota, refresh, atualizacao concorrente do mesmo cliente, preservacao das aprovacoes, exportacao, ficheiro desatualizado, dominios distintos, cookies/storage separados, Preview, pedido original e falha de navegacao. A suite Node verifica tambem cache incoerente, checksums invalidos e metadados desconhecidos antes de autorizar saida da origem.

Os verificadores de integridade mantem os hashes anteriores de transporte, leitura, escrita e ligacoes. Apenas os trechos explicitamente revistos do rascunho/rotulo e fixture isolada recebem novos hashes. Os catalogos PR21/22 sao ampliados de 30 para 31 suites, sem eliminar nenhuma verificacao.

## Limites e procedimento de revisao

Os testes HTTPS de dominios sao paginas locais fulfilled pelo Playwright, com o monitor/estilo reais. Nao medem Vercel nem Google reais e nao constituem um ensaio de restauracao. A navegacao/autenticacao real entre dominios pode exigir novo login. Nao existe importacao automatica do ficheiro de recuperacao.

Com trabalho pendente, conservar o separador original, descarregar e verificar a copia e solicitar reconciliacao/recuperacao explicitamente autorizada. Nao fechar nem limpar o armazenamento original. Uma falha de arquivo/permissao ou conteudo desconhecido bloqueia a saida; a limitacao e deliberada para evitar perda.

O build deve publicar HTML, scripts e manifesto juntos. A identidade e ambiente devem estar disponiveis; a configuracao e publicacao Vercel nao foram alteradas nesta tarefa. Uma Preview imutavel so pode verificar a sua propria publicacao: nao descobre automaticamente outra Preview de branch.

API, Apps Script, CAS, B5/B6, read tickets, retencao, backups, regras comerciais, PDFs, precos/recomendacoes, estados, dados e plantas permanecem iguais ao commit auditado. Nenhum dado real foi consultado ou usado nos testes. Manter PR em Draft para revisao; nao fazer merge ou deployment.
