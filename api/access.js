"use strict";

const crypto = require("crypto");

const COOKIE_NAME = "tv_commercial_access";
const SESSION_SECONDS = 60 * 60 * 8;

module.exports = async function access(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const expectedPassword = process.env.COMMERCIAL_ACCESS_PASSWORD || "";
  const signingSecret = process.env.COMMERCIAL_ACCESS_SECRET || expectedPassword;

  if (!expectedPassword || !signingSecret) {
    return response.status(503).json({
      ok: false,
      error: "Access control is not configured"
    });
  }

  let suppliedPassword = "";
  try {
    const body = request.body || {};
    suppliedPassword = String(body.password || "");
  } catch {
    suppliedPassword = "";
  }

  if (!safeEqual(suppliedPassword, expectedPassword)) {
    return response.status(401).json({ ok: false, error: "Invalid password" });
  }

  const issuedAt = String(Date.now());
  const signature = signSession(issuedAt, signingSecret);
  const secure = isLocalHost(request.headers.host) ? "" : "; Secure";
  response.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${issuedAt}.${signature}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; SameSite=Lax${secure}`
  );
  return response.status(200).json({ ok: true });
};

function signSession(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function isLocalHost(host = "") {
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
}
