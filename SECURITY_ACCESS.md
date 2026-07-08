# The View - Acesso a Versao Comercial

Este projeto guarda dados comerciais e dados pessoais de clientes/leads. A protecao da versao comercial nao deve depender de uma password escrita no JavaScript, porque qualquer segredo no frontend fica visivel ou contornavel no browser.

## Solucao recomendada

Ativar protecao no proprio Vercel, antes de o browser receber `index.html`, `config.js`, `commercial.js` ou qualquer resposta ligada aos dados comerciais.

Configuracao recomendada:

1. Abrir o projeto no Vercel Dashboard.
2. Ir a `Settings` > `Deployment Protection`.
3. Ativar um metodo de protecao:
   - `Password Protection`, se o plano/add-on permitir.
   - Ou `Vercel Authentication`, se a equipa preferir acesso apenas para utilizadores Vercel autorizados.
4. Para proteger a pagina principal em producao, escolher um escopo que proteja o dominio de producao, idealmente `All Deployments`.
5. Guardar e testar em janela anonima antes de partilhar o link.

## Comparador publico

Se a antiga Versao Comparador tiver de continuar publica, a solucao mais limpa e separar em outro projeto/domino da Vercel, por exemplo:

- Projeto privado: versao comercial, com Deployment Protection ativo.
- Projeto publico: `comparador.html`/comparador, sem dados comerciais.

No mesmo projeto, a protecao da Vercel tende a proteger o projeto/deployment conforme o escopo escolhido. Evitar tentar resolver isto com uma password no frontend.

## O que nao fazer

- Nao colocar a password em `config.js`.
- Nao colocar a password em `commercial.js`.
- Nao criar uma chave de acesso apenas em `localStorage`.
- Nao confiar em esconder elementos com CSS/JavaScript como seguranca real.
- Nao deixar `config.js` e `commercial.js` carregarem antes da autenticacao em qualquer solucao temporaria.

## Fallback implementado sem Vercel Pro

Como Password Protection da Vercel pode exigir plano/add-on pago, este repositorio inclui uma barreira propria para a versao comercial usando:

- `middleware.ts`: bloqueia a entrega de `/`, `index.html`, `commercial.html`, `commercial.js`, `commercial.css` e `config.js` sem sessao valida.
- `access.html`: pagina publica de login, sem carregar `config.js` nem `commercial.js`.
- `api/access.js`: valida a password no servidor e cria cookie `HttpOnly`.
- `api/logout.js`: limpa o cookie e volta para o login.

A password nao fica no codigo. Configure no Vercel:

1. Abrir `Settings` > `Environment Variables`.
2. Criar `COMMERCIAL_ACCESS_PASSWORD` com uma password forte.
3. Criar `COMMERCIAL_ACCESS_SECRET` com um segredo longo e aleatorio para assinar a sessao.
4. Aplicar em Production e redeploy.

Esta solucao e melhor do que password no frontend porque impede o browser de receber `config.js` e `commercial.js` antes do acesso. Ainda assim, e uma barreira inicial, nao substitui uma solucao completa de identidade e autorizacao.

## Apps Script

Mesmo com esta barreira, o Google Apps Script deve ser revisto numa fase seguinte. Se o Web App estiver publico e aceitar `action=load`, quem descobrir o URL pode tentar ler a base `Store!B2`.

Recomendacao futura:

- exigir token no Apps Script;
- guardar o token fora do frontend, se houver backend;
- ou migrar a camada comercial para backend autenticado.

## Checklist de teste

1. Abrir a pagina principal em janela anonima.
2. Confirmar que aparece `access.html` antes de mostrar qualquer conteudo comercial.
3. Confirmar que `index.html`, `config.js` e `commercial.js` redirecionam para login sem sessao.
4. Entrar com credencial valida.
5. Confirmar que Clientes / Leads carrega normalmente.
6. Confirmar que Google Sheets sync continua ativo.
7. Confirmar que PDFs e comparador comercial continuam a funcionar.
8. Confirmar o comportamento pretendido para `comparador.html`: protegido no mesmo projeto ou publico em projeto separado.
