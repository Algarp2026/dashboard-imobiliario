# The View · Gestão Comercial com Google Sheets

Esta versão mantém o painel igual, mas permite guardar clientes, eventos, estados de venda, preços finais e histórico numa Google Sheet partilhada.

## 1. Criar a Google Sheet

1. Crie uma Google Sheet vazia.
2. Dê um nome, por exemplo: `The View · Base Comercial`.
3. Abra **Extensões > Apps Script**.
4. Apague o conteúdo inicial e cole o conteúdo do ficheiro `google_apps_script.gs`.
5. Guarde o projeto.

## 2. Publicar o Apps Script como Web App

1. Clique em **Implementar > Nova implementação**.
2. Tipo: **Aplicação Web**.
3. Executar como: **Eu**.
4. Quem tem acesso: **Qualquer pessoa com o link**.
5. Clique em **Implementar**.
6. Autorize as permissões.
7. Copie o URL terminado em `/exec`.

## 3. Ligar o website à Google Sheet

Abra `config.js` e cole o URL aqui:

```js
window.THE_VIEW_CONFIG = {
  GOOGLE_SHEETS_WEBAPP_URL: "COLE_AQUI_O_URL_DO_APPS_SCRIPT",
  SYNC_MODE: "google_sheets"
};
```

Depois publique o site no Vercel/GitHub como habitualmente.

## 4. Como funciona

- Ao abrir o site, o painel tenta carregar a base da Google Sheet.
- Ao alterar preços, clientes, eventos ou vendas, o painel guarda localmente e também envia para a Google Sheet.
- A Google Sheet mantém uma aba `Store` com o JSON completo e abas espelho para leitura humana:
  - `Clientes`
  - `Eventos`
  - `EstadosVendas`
  - `PrecosHistorico`

## 5. Importante

Esta versão ainda não tem login por utilizador. Qualquer pessoa com acesso ao link do site pode alterar dados, se o site estiver público. Para restringir edição por utilizador, a próxima etapa recomendada é Supabase/Firebase com autenticação.
