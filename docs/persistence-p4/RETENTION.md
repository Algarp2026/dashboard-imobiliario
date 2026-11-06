# Retencao e libertacao

## Analise

dryRun captura todos os stores numa unica transacao readonly. Hashes, descodificacao e classificacao ocorrem fora da transacao. O resultado contem corpo, categoria, razoes, dependencias, totais codificados, metadados serializados, espaco temporario, candidatos, bytes recuperaveis e bloqueios, sem imprimir conteudo comercial.

Corpo aparentemente orfao nao e automaticamente lixo: sem registo de origem LAB_SCRATCH valido permanece desconhecido/protegido. Nenhum registo comercial e removido para fabricar um orfao. Operacoes/branches/pins/arquivos nao tem API de eliminacao nesta fase.

## Libertacao explicita

release aceita apenas um token de fotografia, nao autorizacoes fornecidas pelo cliente. Rele e analisa novamente os registos; um token antigo ou alteracao concorrente aborta. As listas/flags do relatorio enviado pelo chamador nao controlam quais corpos sao eliminados.

Na transacao final strict, rele todos os stores, compara a fotografia completa, reconstroi as referencias estruturais e verifica proveniencia/ausencia de referencias. A igualdade dos bytes confirma que as dependencias descodificadas fora da transacao nao mudaram. Somente corpos scratch comprovadamente sem referencias e o respetivo audit redundante sao removidos atomicamente. Falha em qualquer operacao reverte todo o lote.

Se GC vencer uma corrida com a criacao de uma referencia, o outro escritor deteta a fotografia alterada e aborta/rele. Uma proposta P3 pode recriar o seu corpo preparado junto com a referencia, na mesma transacao. Um pin nao pode ficar apontado para um corpo inexistente. Se a referencia for criada primeiro, GC nao a ultrapassa.

Nao ha tarefa automatica, limpeza em background, limite aumentado, politica por idade ou eliminacao por exportacao externa. Checksums nao comprovam commit remoto. Uma preparacao de compressao pendente permanece protegida; a sua remocao na troca COW e exclusivamente a remocao atomica de uma representacao redundante ja validada.

## Impedimentos deliberados

Um arquivo opaco pode conter dependencias que o leitor nao sabe provar. Nesse caso toda a limpeza do dominio e bloqueada, incluindo outros candidatos aparentes. O corpus de 15 historicos/14,84 MiB conserva zero bytes libertaveis por GC quando contem os desconhecidos previstos. Isto e um resultado de seguranca, nao um erro a contornar.

Compactacao byte a byte de formatos conhecidos pode reduzir armazenamento sem os desproteger. Formatos protegidos desconhecidos nao sao comprimidos. Uma politica futura de pruning comercial exige provas suficientes, migracao autorizada e contratos posteriores; P5 nao foi implementada aqui.
