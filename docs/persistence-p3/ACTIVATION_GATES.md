# Corte e ativacao futuros - nao executados

## Contrato de compatibilidade

WriterEpoch 2 e apenas valor de laboratorio. O simulador verifica frontend/API/fonte; a fonte aplica a propria barreira independentemente do preflight da API. Frontend novo bloqueia perante API/fonte antigas. Escritor antigo via API antiga nao ultrapassa uma fonte nova com fence. A tabela de oito combinacoes e testada, nao publicada.

O registo privado do simulador permite validar comprovativos sinteticos e consultar pedidos exatos sem reativar versoes. Nao implementa Google OAuth, cadeia B6, assinatura autenticada, recibos historicos de producao ou atomicidade multi-celula. Essas provas pertencem a P5.

## Pre-requisitos para qualquer ativacao real

1. Aprovacao separada da arquitetura final, politicas de acesso e recuperacao, sem dados pessoais nos ensaios.
2. Validacao de quota fisica, Safari/iOS, eviction, modo privado e riscos de falha fisica.
3. Captura/inventario de pendencias e backups antigos; preservar IDs e conteudos incertos. Exportacao nao autoriza eliminar.
4. Fonte/API ficticias autenticadas com fence efetivo na fonte, negociacao de capacidades e recibos ancorados. Testar API antiga contra fonte nova, sem confiar num header arbitrario.
5. Plano de quiescencia e corte: suspender gravacoes controladamente, fechar/reabrir tabs antigas, verificar shadow, bases e identidades antes de criar autoridade nova.
6. Leitura e recuperacao compativeis com todos os formatos antigos; nao reinterpretar originais opacos como pedidos novos.
7. Publicacao coordenada de fonte/API/frontend apenas com autorizacao expressa; nenhum frontend pode ativar uma capacidade que nao exista efetivamente na fonte.

## Reversao

Nesta P3 basta retirar modulos/testes experimentais: nenhum estado real foi migrado. Conservar qualquer DB de laboratorio necessaria a reproducao, sem limpeza automatica.

Depois de uma eventual ativacao futura, rollback nao pode ser simplesmente voltar ao escritor antigo LS que desconhece os novos pedidos. Suspender escrita e manter leitor compativel/so-leitura, corpos, branches e recibos. Nunca reativar versao historica ou limpar pedido incerto para permitir rollback.

## Limitacoes explicitas

Um escritor antigo offline pode continuar a modificar a propria cache; isolamento da DB nova nao o torna cooperante. As condicoes de fence sao apenas simuladas nesta fase e nao foram instaladas na API/Apps Script reais. Nao existe autorizacao de P4-P9 ou publicacao implicita.
