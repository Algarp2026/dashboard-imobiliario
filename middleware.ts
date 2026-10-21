import {hasValidSession} from './server/session.js';
const COMMERCIAL_ACCESS_ENABLED = true;

export const config = {
  matcher: [
    "/",
    "/index",
    "/index.html",
    "/commercial",
    "/commercial.html",
    "/commercial.js",
    "/commercial.css",
    "/config.js",
    "/comparador",
    "/comparador.html",
    "/app.js",
    "/data.json",
    "/data.xlsx",
    "/data.xls",
    "/precos_iniciais_atualizados.json",
    "/google_apps_script.gs",
    "/google_commercial_integrity.gs",
    "/commercial-opportunities.js",
    "/commercial-opportunity-ui.js",
    "/api/commercial-data",
    "/server/:path*"
  ]
};

export default async function middleware(request: Request) {
  if(new URL(request.url).pathname.startsWith('/server/'))return new Response(null,{status:404});
  if (!COMMERCIAL_ACCESS_ENABLED) return;

  if (await hasValidSession(request)) return;

  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return Response.json({ok:false,code:'UNAUTHENTICATED'}, {status:401,headers:{'Cache-Control':'no-store'}});
  const loginUrl = new URL("/access.html", request.url);
  loginUrl.searchParams.set("next", url.pathname + url.search);
  return Response.redirect(loginUrl, 303);
}
