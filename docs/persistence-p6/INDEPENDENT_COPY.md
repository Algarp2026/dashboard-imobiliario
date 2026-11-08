# Copia independente de recuperacao

## Independencia demonstrada e limites

O vault usa backend diferente do primario e recusa o mesmo failureDomain configurado. O construtor IndexedDB so aceita DB the-view-p5-lab.p6-copy.*, distinta da DB primaria. Em Node, memoria e ficheiros de diretorios distintos exercitam o mesmo contrato. Identidades dos backends sao configuracao confiavel do controlador de laboratorio, nao valores escolhidos por um endpoint de browser.

Os testes desligam isoladamente o backend primario e o da copia; corrompem cada lado separadamente; reabrem os dois. Uma falha de leitura na primaria nao impede reconstruir a copia, e uma falha/quota/corrupcao no vault nao altera B6 nem impede verificar a fonte saudavel.

Isto prova separacao logica de backends/DBs/diretorios sob falhas simuladas. **Nao prova redundancia entre dispositivos, discos, contas, regioes ou servicos.** Mesmo perfil IndexedDB partilha quota/eviction/dispositivo, e dois diretorios no mesmo computador partilham falhas fisicas. Nenhum Drive, Spreadsheet adicional ou servico real foi configurado.

## Conteudo e proveniencia

A captura e obtida por callback confiavel vinculado a fonte primaria, nao por uma prova fornecida num pedido publico. O pacote inclui fonte/dominio, B6, versao/descritores, raw/JSON completo, revisao, proofs disponiveis, B5 e imagem da autoridade (incluindo blocos/manifests/backups preservados). P5 conserva identidade/pedido original via manifestos e requestVersion; format=2 conserva o recibo disponivel sem inventar antepassados.

O registo independente liga id, fonte, dominios, snapshotHash, autoridadeHash, revisao e bodyRef. Um id reutilizado para outra autoridade/revisao provoca COPY_ID_COLLISION. Um corpo partilhado conserva identidade original; revisao comercial, hash de bytes e checksum do pacote nao sao intercambiaveis.

A copia e da fonte oficial, nao de todos os rascunhos locais ainda nao enviados. Pedidos e rascunhos P3/P4 continuam protegidos no seu dominio. O pacote pode conservar uma intencao nao ativada como evidencia, mas nao a transforma em COMMITTED.

## Gravacao e verificacao

1. Capturar e validar snapshot oficial coerente.
2. Preparar o pacote/corpo e codec fora da transacao, usando P4 identity/gzip e limites de expansao.
3. Persistir corpo e registo STAGED juntos por CAS/strict transaction do backend independente.
4. Reabrir/reler, descodificar e reconstruir a autoridade copiada; validar descritores, provas, hashes e associacao.
5. Mudar apenas STAGED para VERIFIED apos essa validacao; reler novamente.

VERIFIED significa validacao tecnica da copia, **nao recibo comercial**. Depois disso, corpo/registo nao sao substituidos; novas copias usam outras identidades. Repeticao exata pode reutilizar o registo/corpo, apos verifica-lo. Duas criacoes concorrentes sao resolvidas por CAS, sem sobrescrever conteudo diferente.

Os corpos sao P4, guardados com bytes em array para permitir tambem a persistencia JSON do helper de ficheiro. EncodedBytes/cabecalhos nao equivalem a todo o custo dessa representacao ou do IDB. Snapshots com a mesma autoridade mas capturados em geracoes tecnicas diferentes podem ter bodyRef distinto; nao se promete deduplicacao universal apenas pela revisao.

## Classificacoes

- RECOVERABLE_COPY: pacote integral e registo VERIFIED tecnicamente validos.
- FORENSIC: preparacao ainda nao verificada, corpo/referencia/manifesto corrompido ou prova insuficiente. Nao e corrigido/eliminado automaticamente.
- MISSING: identidade ausente no vault consultado.
- INSUFFICIENT: backend/estrutura indisponivel ou nao verificavel.

Mesmo RECOVERABLE_COPY devolve commercialConfirmed=false e isLatest=false. A fonte pode ter avancado durante/depois da captura. O pacote permanece associado a sua revisao original; nunca e reassociado a outra por semelhanca de dados. Consultar/guardar a copia nao altera a autoridade.

Falha antes de STAGED deixa ausencia; falha apos STAGED conserva evidencia forense retomavel; resposta perdida apos VERIFIED permite consulta/repeticao idempotente. Corrupcao ou identidade conflitante bloqueiam substituicao. Nenhum mecanismo de GC ou limpeza de copias protegidas foi adicionado.

## Capacidade

P4 limita o corpo comprimivel a 32 MiB e valida expansao real. Falta de espaco produz erro, nao truncagem ou exclusao. O benchmark com 15 arquivos protegidos/14.84 MiB logicos preserva o hash desses arquivos; so o novo pacote verificado e codificado/comprimido. Nao ha promessa de libertacao de espaco no arquivo real.
