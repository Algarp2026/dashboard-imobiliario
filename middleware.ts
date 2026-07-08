const COOKIE_NAME = "tv_commercial_access";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 8;

export const config = {
  matcher: [
    "/",
    "/index.html",
    "/commercial.html",
    "/commercial.js",
    "/commercial.css",
    "/config.js"
  ]
};

export default async function middleware(request: Request) {
  if (await hasValidSession(request)) return;

  const url = new URL(request.url);
  const loginUrl = new URL("/access.html", request.url);
  loginUrl.searchParams.set("next", url.pathname + url.search);
  return Response.redirect(loginUrl, 303);
}

async function hasValidSession(request: Request) {
  const secret = process.env.COMMERCIAL_ACCESS_SECRET || process.env.COMMERCIAL_ACCESS_PASSWORD || "";
  if (!secret) return false;

  const cookie = parseCookies(request.headers.get("cookie") || "")[COOKIE_NAME] || "";
  const [issuedAt, signature] = cookie.split(".");
  const timestamp = Number(issuedAt);
  if (!issuedAt || !signature || !Number.isFinite(timestamp)) return false;
  if (Date.now() - timestamp > SESSION_MAX_AGE_MS) return false;

  const expected = await signSession(issuedAt, secret);
  return timingSafeStringEqual(signature, expected);
}

async function signSession(value: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(signature)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeStringEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function parseCookies(header: string) {
  return header.split(";").reduce<Record<string, string>>((cookies, part) => {
    const index = part.indexOf("=");
    if (index < 0) return cookies;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) cookies[key] = value;
    return cookies;
  }, {});
}
