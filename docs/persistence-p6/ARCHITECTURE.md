# Arquitetura P6 e diagnostico atual

## Fonte e problema confirmado em laboratorio

O Apps Script atual guarda intencao B5, prepara blocos, atualiza espelhos e so depois ativa B6. mirrorChanged_ compara dependencias completas e recria folhas ausentes, mas nao certifica o conteudo dos espelhos existentes. Uma falha entre folhas pode deixar Clientes em R1 e Eventos em R0 enquanto B6 continua em R0. Esse comportamento foi reproduzido executando o Apps Script operacional inalterado numa VM, interrompendo antes do clear de Eventos.

Outras divergencias demonstradas: folha ausente, clear sem setValues, escrita truncada, cabecalho errado, valor manual diferente, espelhos de revisoes distintas, fonte nova com espelhos antigos, B5 pendente/bloqueado, blocos oficiais corrompidos e mudanca durante captura. Espelhos nunca sao utilizados para completar ou confirmar a fonte oficial.

## Fronteiras

| Modulo novo | Responsabilidade |
|---|---|
| contracts.mjs | Dependencias exatas, identidade da autoridade, hashes de inputs e diferencas sem valores pessoais |
| snapshot.mjs | Captura coerente e validacao offline do pacote, B6 format=2/3, B5 e provas disponiveis |
| projector-node.mjs | Executa as seis funcoes reais em VM pelo helper existente, sem segunda implementacao de projecao |
| mirrors.mjs | Diagnostico readonly, plano, autorizacao restrita de manutencao pendente e reparacao de folhas |
| copy.mjs | Backend separado, P4 identity/gzip, deduplicacao, staging/validacao e copia imutavel |
| recovery.mjs | Relatorio de recuperacao sem qualquer escrita de autoridade |

O laboratorio aceita apenas origem http://127.0.0.1:53xxx, opt-in sintetico e identidades de fonte ficticias. Autorizacao e fonte sao selecionadas pelo controlador confiavel; nao existe HTTP handler ou import operacional.

## Persistencia experimental

A fonte P5 ja tem generation e lockOwner com compare-exchange duravel. P6 usa esses mesmos campos, sem modificar P5. Acrescenta apenas Derived={version,tables,claims,journal} na **imagem ficticia do laboratorio**. O escritor P5 preserva esse objeto e recusa escrever quando o lock pertence a uma reparacao. Nao e uma migracao do armazenamento operacional.

A reparacao so altera Derived, geracao e o proprio lock tecnico. B2/B5/B6, StoreVersions, BackupsVersions, Manifests, conteudo comercial e pedidos permanecem iguais. A autoridadeHash inclui a totalidade dessas estruturas de autoridade, mesmo blocos/manifestos preparados que ainda nao foram ativados.

A copia usa outro backend, com outro dominio e outra DB. No navegador, a fonte e the-view-p5-lab.p6-primary; a copia e the-view-p5-lab.p6-copy.browser. Em Node sao backends de memoria distintos ou diretorios temporarios distintos. Nenhum object store extra na DB primaria e apresentado como independencia.

## Reutilizacao e limites

P2 valida JSON comercial e conserva campos desconhecidos. P3/P4 mantem pedidos/branches e exportacoes. P4 codifica corpos novos da copia; nao limpa arquivos antigos. P5 verifica a cadeia format=3; o format=2 e lido como prova da versao **atual**, nao como cadeia historica completa.

Os contratos P1-P5, gates, documentacao de armazenamento/recuperacao/contencao/desempenho e hotfix foram consultados juntamente com os ficheiros operacionais. Nao se presume que fases anteriores estejam ativadas. Nenhum ficheiro anterior foi modificado para ligar P6 ao produto.

O harness reproduz entradas setValues/clearContents e falhas por etapa; nao demonstra quotas, latencia, interpretacao de formulas, formatacao visual ou atomicidade do Google real. As transacoes IDB sao locais; nao existe transacao distribuida entre seis folhas, copia e B6.
