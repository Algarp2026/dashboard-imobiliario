"use strict";

const COOKIE_NAME = 'tv_commercial_access';
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;
function header(request, name) {
  return request.headers?.get ? request.headers.get(name) || '' : String(request.headers?.[name.toLowerCase()] || '');
}
function sessionCookie(request) {
  const matches = header(request, 'cookie').split(';').map(part => part.trim()).filter(part => part.startsWith(COOKIE_NAME + '='));
  return matches.length === 1 ? matches[0].slice(COOKIE_NAME.length + 1) : '';
}
async function signSession(value, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  const bytes = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2,'0')).join('');
}
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let different = 0;
  for (let i = 0; i < a.length; i++) different |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return different === 0;
}
async function hasValidSession(request, now = Date.now()) {
  const secret = process.env.COMMERCIAL_ACCESS_SECRET || process.env.COMMERCIAL_ACCESS_PASSWORD || '';
  const value = sessionCookie(request);
  if (!secret || !/^\d{13}\.[a-f0-9]{64}$/.test(value)) return false;
  const [issued, signature] = value.split('.'), age = now - Number(issued);
  if (age < -30000 || age >= SESSION_MAX_AGE_MS) return false;
  return safeEqual(signature, await signSession(issued, secret));
}
function sameOrigin(request) {
  try {
    const origin = new URL(header(request,'origin'));
    const host = header(request,'host');
    const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
    return origin.host === host && origin.protocol === (local ? 'http:' : 'https:') && !['cross-site','none'].includes(header(request,'sec-fetch-site'));
  } catch { return false; }
}
exports.COOKIE_NAME = COOKIE_NAME;
exports.header = header;
exports.sessionCookie = sessionCookie;
exports.signSession = signSession;
exports.safeEqual = safeEqual;
exports.hasValidSession = hasValidSession;
exports.sameOrigin = sameOrigin;
