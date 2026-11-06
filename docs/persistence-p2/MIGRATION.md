# Migracao shadow e recuperacao

## Fluxo implementado

1. Capturar explicitamente a origem ficticia. O leitor compara localStorage antes/depois da fotografia readonly de copies. Nao existe transacao distribuida entre ambos.
2. DISCOVERED guarda checkpoint inicial sem alterar a origem.
3. COPYING limita itens e bytes por lote, preserva originais e relacoes e atualiza cursor atomicamente. Um corpo maior que o lote e recusado; nao e truncado.
4. Repetir um lote confirmado nao duplica efeitos. Outra revisao do checkpoint aborta o lote concorrente.
5. VERIFIED religa referencias e reconstrui os hashes, projecoes, pedidos e bases.
6. READY requer nova leitura da origem e nenhuma referencia em falta, variante ou bloqueio. E apenas prontidao de copia fisica shadow, nunca ativacao comercial.

## Interrupcao e divergencia

Aborto/quota antes do commit preserva o checkpoint anterior e nao deixa corpos novos desligados daquele lote. Depois de oncomplete, os corpos/referencias/cursor sao retomaveis. As fases podem ser reabertas e verificadas; apagar um corpo de teste com flag READY continua a provocar erro.

Se duas capturas ou um lote posterior observarem valores diferentes da mesma origem, ambos sao preservados e e criada uma branch de variantes. Uma origem desaparecida tambem bloqueia conclusao sem apagar o original. Um pedido antigo diferente da cache mais recente nao substitui essa cache nem recebe confirmacao do pedido novo.

Os testes cobrem 15 historicos protegidos com aproximadamente 14,84 MiB, pedidos antigos incertos, quatro envelopes desconhecidos, ambas reservas, gzip e edicoes posteriores ao pedido. Nenhuma manutencao, compactacao ou eliminacao da origem e executada.

## Limites que nao podem ser ocultados

- OBSERVED_UNCHANGED significa apenas que as leituras observadas coincidiram. Escritores antigos podem fazer ABA ou alterar dados entre stores sem cooperar. A P2 nao fabrica atomicidade nem base de instancia.
- Uma variante nunca observada e nunca confirmada num lote nao pode ser recuperada depois de o processo terminar. A origem continua intacta, mas escritores antigos podem altera-la; migracao real exige quiescencia/fencing coordenado.
- READY pode conter originais opacos ou conflitos comerciais arquivados, explicitamente classificados. Nao autoriza usa-los como workspace nem resolve disputas comerciais.
- Tipos structured-clone desconhecidos, tamanhos excessivos, codecs indisponiveis ou erro de leitura interrompem sem modificar a origem.
- Hashes locais nao sao autenticacao. Um atacante que consiga reescrever corpos e todos os hashes nao e detetado por integridade nao autenticada.
- Quota partilhada, eviccao, modo privado, power loss e Safari real requerem validacao adicional antes de uma migracao real. A origem real nunca e usada para estes ensaios.

## Retoma autorizada apenas no laboratorio

Reabrir o mesmo perfil descartavel e destino, chamar begin com o mesmo ID, copiar os lotes em falta e voltar a verificar. Nao apagar o checkpoint em caso de quota. Aumentar limite logico ou limpar protegidos nao e um mecanismo de retoma.

Exportacao/recuperacao nesta fase significa reconstruir cada original por bodyRef e validar novamente os bytes/valores. Nao se faz importacao no CRM, restauracao remota ou limpeza de backups.
