# Codecs e identidade

## Formatos

| Propriedade | Identity P2/P3 | Gzip P4 |
|---|---|---|
| version | 1 | 2 |
| codec | identity | gzip |
| codecVersion | implicita no formato 1 | 1 |
| bodyRef/rawHash | Bytes originais P2 | Os mesmos bytes originais, nunca o hash comprimido |
| encodedHash | RawHash ja verificado pelo formato 1 | SHA-256 independente da representacao gzip |
| bytes | UTF-16LE ou grafo structured-clone | Gzip desses bytes exatos |

MediaType e prefixo b1:u16/b1:graph mantem os dominios separados. PayloadHash canonico e requestHash comercial continuam a ser calculados pela P3, sem depender do codec. Dois objetos semanticamente semelhantes com bytes/ordem original diferentes nao sao fundidos silenciosamente.

Descompressao valida schema, versao, codec, encodedBytes, encodedHash, limite efetivo de expansao, decodedBytes, rawHash, bodyRef e reconstrucao P2. O limite de expansao e 32 MiB, aplicado aos blocos recebidos, nao apenas ao comprimento declarado. Codecs ausentes/desconhecidos e gzip corrompido provocam erro; nao existe fallback que descarte dados.

UTF-16LE conserva NUL e surrogates isolados. O grafo structured-clone P2 conserva os tipos suportados, aliases e ciclos; nao se inventa representacao para tipos desconhecidos. Envelopes gzip legacy permanecem no seu formato original dentro dos corpos, validados pelo leitor P2. Nao ha normalizacao de Unicode ou campos comerciais desconhecidos.

## Politica medida

Nao tentar compressao abaixo de 4096 bytes. Selecionar gzip apenas se economizar pelo menos 256 bytes e 20% do custo identity, incluindo metadados serializados. Unknown/insufficient-integrity de arquivo usa sempre identity. O piloto de 10% mostrou pouco ganho e maior latencia num corpus pouco compressivel; o limiar foi elevado antes da validacao final.

CompressionMs mede o stream de compressao; decompressionMs mede inflacao/recolha de bytes; verificationMs inclui validacao da origem e da representacao reconstruida e comparacao exata. EncodedHashMs e medido separadamente. sourceVerificationMs e um subconjunto informado do custo de verificacao, nao deve ser somado novamente. CandidateSavedBytes pode descrever uma tentativa rejeitada; savedBytes e zero quando identity e mantido.

PhysicalCost soma os bytes e o tamanho UTF-8 do cabecalho JSON serializado. E uma medida reproduzivel do formato, nao a alocacao interna de IndexedDB nem garantia de quota livre. O custo nativo de indices, paginas e blobs varia por motor.

## Copy-on-write

prepareCompression grava uma representacao nova em p4Prepared, espera oncomplete, rele e valida. Os bytes temporarios sao guardados como array JSON para que a P3 possa comparar a fotografia sem executar codecs dentro da transacao. resumeCompression verifica a identidade fisica original e os bytes descodificados, depois troca bodies e remove apenas a copia temporaria redundante na mesma transacao strict. Aborto conserva original/preparacao; nao ha intervalo sem representacao recuperavel.

Nenhuma preparacao desconhecida e eliminada por idade. Quota durante preparacao/troca deixa erro explicito e a ultima fotografia duravel. Isto nao prova resistencia a falha de energia.
