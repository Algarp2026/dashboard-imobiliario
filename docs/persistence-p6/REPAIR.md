# Reparacao controlada, apenas laboratorio

## Plano readonly

plan exige scope mirror-read da fonte selecionada pelo controlador. Captura a autoridade coerente e projecoes reais; devolve repairPlan versionado com fonte, autoridadeHash, revisao, regras, hash dos espelhos, B5, folhas divergentes, projecoes esperadas, estimativas, riscos e bloqueios. Nao escreve nada. Projecoes no plano sao privadas, nao dados para o relatorio publico.

## Execucao

1. Exigir scope repair e verificar o plano e as projecoes contra nova captura.
2. Bloquear plano/versao/regras/espelhos alterados. Adquirir lockOwner por CAS na mesma fonte usada pelo escritor P5.
3. Revalidar autoridadeHash e dono do lock antes de cada etapa; verificar autorizacao novamente.
4. Registar journal tecnico RUNNING, sem criar evento ou requestId comercial.
5. Para cada folha selecionada, persistir clear e depois setValues como duas etapas separadas. Reler e comparar o resultado.
6. Revalidar autoridade/todas as folhas selecionadas, concluir journal e libertar somente o proprio lock.

Uma reparacao nao altera B2/B5/B6, StoreVersions, BackupsVersions, Manifests, JSON comercial, pedidos ou recibos. Geracao, lock e Derived sao os unicos elementos tecnicos modificados. Nao cria vendas, edicoes, comissoes, propostas nem confirmacoes locais P3.

## B5 e manutencao pendente

NONE/COMMITTED permitem o percurso normal, mantendo B5 intacto. PENDING bloqueia por defeito. Para o ensaio critico, authorizePending exige scope separado pending-maintenance e emite token opaco privado, ligado ao plano/autoridade/credencial. Permite exclusivamente reconstruir os espelhos da versao atualmente ativa sob lock, preservando o pedido incerto e os seus blocos. **Nao resolve nem confirma esse pedido.** BLOCKED/desconhecido nao e autorizavel por esse mecanismo.

Nao existe flag booleana no plano que substitua esse token. Uma alteracao em B5/versoes/ancora invalida a autorizacao. Nao foi emitida qualquer autorizacao para uma base real.

## Interrupcao e repeticao

As seis folhas nao constituem uma transacao unica. Uma falha pode deixar Derived parcial. O resultado e PARTIAL, com folhas terminadas/motivo, e o journal fica disponivel quando for possivel persistir. Uma fonte alterada impede continuar. Nao se tenta restaurar B6 nem completar cegamente um plano antigo.

Nova execucao exige reavaliacao a partir da autoridade atual. Repetir uma reparacao concluida para a mesma autoridade/tabelas retorna ALREADY_CONSISTENT sem novas escritas. Um plano antigo apos R2 e bloqueado, mesmo quando o hash comercial possa repetir um conteudo anterior.

Crash pode deixar lock persistido. P6 nao o expira nem limpa automaticamente. O teste Chromium termina somente o processo do perfil descartavel apos persistir lock e clear parcial: depois da reabertura, o lock continua a bloquear e a copia independente continua legivel. Isso nao testa falha de energia nem Apps Script real.

Se storage/lock/contador estiver indisponivel ou esgotado, parar sem declarar sucesso. Limites de contador nao autorizam apagar registos ou contornar CAS.
