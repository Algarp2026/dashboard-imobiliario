# The View · Regras de Trabalho para Agentes

Este projeto é uma ferramenta comercial real para o empreendimento **The View Olhão**. Deve ser tratado com cuidado máximo.

## Estrutura do projeto

Website estático publicado na Vercel, usando HTML/CSS/JavaScript puro.

Áreas principais:

- Versão Comparador
- Versão Comercial

Ficheiros principais:

- `index.html`
- `app.js`
- `style.css`
- `commercial.html`
- `commercial.js`
- `commercial.css`
- `config.js`
- `data.json`
- `google_apps_script.gs`
- pasta `plantas/`

## Regras críticas

Nunca substituir o projeto inteiro sem necessidade.

Nunca remover funcionalidades existentes.

Nunca alterar estrutura de dados sem migração.

Nunca apagar dados comerciais da Google Sheet.

Nunca apagar ou substituir a pasta `plantas/` sem pedido explícito.

Nunca alterar o `GOOGLE_SHEETS_WEBAPP_URL` sem pedido explícito.

Nunca mudar a chave de `localStorage` sem migração.

Preservar sempre:

- clientes
- agentes
- eventos
- estados das frações
- preços finais
- histórico de preços
- reservas
- vendas
- comissões
- indisponíveis
- PDF de proposta
- plantas
- sincronização Google Sheets

## Google Sheets / Apps Script

A fonte principal dos dados comerciais é `Store!B2`, em formato JSON.

As abas abaixo são espelhos/visualizações dos dados:

- `Clientes`
- `Eventos`
- `Agentes`
- `EstadosVendas`
- `PrecosHistorico`
- `VendasComissoes`

O site deve sincronizar com o Google Sheets via Apps Script publicado como Web App `/exec`.

O `config.js` deve conter apenas:

```js
window.THE_VIEW_CONFIG = {
  GOOGLE_SHEETS_WEBAPP_URL: "LINK_EXEC_DO_APPS_SCRIPT"
};
```

O `commercial.html` deve carregar:

```html
<script src="config.js" defer></script>
<script src="commercial.js" defer></script>
```

nesta ordem.

O Apps Script deve:

- aceitar `doGet(e)` com `action=load`;
- suportar JSONP por `callback`;
- aceitar `doPost(e)` via `e.parameter.payload`;
- aceitar `doPost(e)` via `e.postData.contents`;
- não quebrar se `e` estiver indefinido;
- ter função `testWrite()` para teste manual;
- nunca apagar dados em pedidos inválidos.

## Versão Comercial

A Versão Comercial inclui:

- Propostas Clientes
- Dashboard Comercial
- Definições de preços finais e histórico
- Comparador de Frações
- Gerenciamento de Vendas e Propostas

Dentro de **Gerenciamento de Vendas e Propostas** existem abas internas:

- Frações e Estados
- Clientes / Leads
- Agentes
- Eventos / Histórico

A aba default deve ser:

- Frações e Estados

As ações rápidas devem ficar sempre visíveis:

- Novo Cliente
- Novo Agente
- Novo Evento
- Limpar Testes

## PDF de proposta

Preservar:

- escolha de preço de apresentação antes de gerar PDF;
- preço de apresentação não altera preço final nem histórico;
- opção de incluir/remover planta;
- plantas grandes no PDF;
- ABP e Varanda/Terraço aparecem com menos 2 m² e arredondadas para baixo;
- disclaimer comercial;
- frações não disponíveis não devem ser selecionáveis por defeito.

Disclaimer comercial atual:

> Documento meramente informativo e de apresentação comercial. Os valores, áreas e condições aqui indicados não constituem proposta contratual, reserva, promessa de venda ou proposta oficial, estando sujeitos a confirmação e aprovação pela entidade promotora.

## Clientes

- “Novo Cliente” deve abrir ficha vazia.
- Editar cliente deve ser feito apenas pelos botões de edição.
- Cliente pode ter agente associado.
- Agente deve ser selecionado entre agentes já criados.
- Deve ser possível criar agente a partir da ficha do cliente.
- Ao criar agente a partir da ficha do cliente, o modal do agente deve aparecer por cima.

## Agentes

Layout igual ao dos clientes:

- lista à esquerda;
- detalhe à direita;
- edição em modal.

Campos:

- nome do agente;
- agência;
- Nº AMI;
- contacto;
- email;
- comissão padrão;
- notas.

## Eventos

- Ao criar novo evento, deve ser possível criar novo cliente.
- Depois de criar o cliente no evento, ele deve ficar selecionado.
- Reserva e venda atualizam estado da fração.
- Venda pode ser direta ou com agente.
- Se for com agente, registar comissão e receita líquida.

## Estados das frações

Estados possíveis:

- Disponível
- Reservado
- Vendido
- Indisponível

Reserva e venda devem preferencialmente ser criadas por evento.

Indisponível pode ser alteração manual, com motivo.

## Manutenção

Existe área **Limpar Testes**.

Permite eliminar:

- clientes;
- agentes;
- eventos.

Ao eliminar:

- limpar referências associadas;
- sincronizar com Google Sheets.

Para clientes reais, preferir arquivar no futuro em vez de eliminar.

## Antes de alterar

1. Inspecionar ficheiros relevantes.
2. Identificar a menor alteração possível.
3. Não mexer em ficheiros desnecessários.
4. Preservar compatibilidade com dados existentes.
5. Se alterar dados, criar migração.
6. Validar JavaScript com `node --check`.
7. Explicar exatamente o que mudou.

## Depois de alterar

Responder com:

- ficheiros alterados;
- motivo da alteração;
- como testar;
- riscos para dados, se existirem.

## Comandos úteis

Validar JavaScript:

```bash
node --check app.js
node --check commercial.js
node --check config.js
```

## Proibições

Não apagar `Store!B2`.

Não alterar `config.js` sem pedido.

Não trocar o link do Google Sheets sem pedido.

Não remover funcionalidades existentes.

Não apagar `data.json`.

Não apagar `plantas/`.

Não quebrar o PDF.

Não quebrar a sincronização Google Sheets.
