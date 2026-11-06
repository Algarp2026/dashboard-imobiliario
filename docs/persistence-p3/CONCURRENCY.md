# Concorrencia e durabilidade

## CAS real

O snapshot e capturado por uma transacao readonly. Hashes, codecs e validacao de pedidos sao preparados depois dessa captura, fora de transacoes. Uma transacao readwrite sobre os stores envolvidos relê a fotografia persistente, compara metadados/corpos e so entao escreve.

O nucleo usa CAS otimista conservador sobre o snapshot completo, seguido da comparacao expectedLocalRevision do workspace. Se outro separador alterar a DB durante a preparacao, o snapshot e relido e revalidado, com tentativas limitadas; nao se reaproveita uma validacao antiga. Isso prioriza seguranca, podendo criar contencao entre workspaces independentes. BUSY e erro explicito, nao sucesso nem perda silenciosa.

A fotografia selecionada de uma branch usa sempre baseRef/baseRemoteRevision do pedido original, mesmo se a propria instancia recebeu entretanto um ack de outra operacao. Nao herda a base mais recente por conveniencia. A revisao local observada do workspace e monotona; proposalExpectedLocalRevision identifica separadamente a revisao original, enquanto generation identifica a atualizacao do ponteiro. Uma nova proposta a partir dessa view conflitante exige revisao explicita da cabeca atual com refresh; nao ha rebase silencioso nem eliminacao da branch antiga.

No caso obrigatorio A/B em revisao 10:

1. As duas propostas originais sao primeiro capturadas com identidades distintas.
2. O primeiro commit passa o workspace para 11.
3. O segundo observa 11, nao substitui a cabeca e persiste branch com base/payload e revisoes 10/11.
4. A instancia perdedora conserva a sua fotografia/proposta. A vencedora conserva a cabeca aceite. Ambas podem exportar e reabrir os originais.

Corpos, pedido, indice de identidade, cabeca ou branch e fotografia de instancia sao protegidos por transacoes. Nenhum sucesso e devolvido antes de oncomplete. O staging separado pode sobreviver a um commit abortado: isto preserva o original, mas nao equivale a uma branch confirmada ou cabeca aceite.

## Falhas

- Quota/aborto no staging: transacao revertida; nenhuma nova operacao anunciada como duravel.
- Quota ao criar branch: cabeca vencedora intacta; proposta staged continua recuperavel; o erro nao diz que a branch existe.
- Ack local falhado: comprovativo e pedido anteriores preservados; LOCAL_ACK_PENDING e tentativa duravel separada quando possivel.
- Reinicio em SENDING: tratar como incerto e consultar identidade original; nunca criar outro ID.
- Nova proposta depois de um envio: ack antigo nao a confirma nem substitui.
- Leitura de comprovativo historico: somente consulta, sem mudar a fonte ficticia ou cabeca para uma versao anterior.

Nao existem Web Locks/BroadcastChannel como requisito de correcao. O CAS real e exercitado por separadores distintos na mesma origem e DB. O handle proprio de cada instancia nao e substituido por variaveis de outro separador.

O modulo nao resolve automaticamente um conflito nem torna escritores antigos cooperantes. As correcoes do produto atual permanecem exatamente como na main; estas garantias novas so existem no laboratorio P3 desativado.
