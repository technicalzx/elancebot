import { scrypt, timingSafeEqual } from 'node:crypto';

export class HttpError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
/** @returns {never} */
export function fail(status, code, message) { throw new HttpError(status, code, message); }
export const token = (prefix = '') => prefix + crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
export async function digest(value) {
  return Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))).toString('hex');
}
const derive = (password, salt) => new Promise((resolve, reject) => {
  // OWASP scrypt tradeoff: N=2^14, r=8, p=5 (~16 MiB per calculation).
  scrypt(password, salt, 32, { N: 16384, r: 8, p: 5, maxmem: 32 * 1024 * 1024 }, (err, key) => err ? reject(err) : resolve(key));
});
export function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 15 || password.length > 128)
    fail(400, 'invalid_password', 'Use a password of 15–128 characters. A long, unique passphrase works well.');
}
export async function hashPassword(password) {
  validatePassword(password);
  const salt = token().slice(0, 32);
  return `scrypt:16384:8:5:${salt}:${Buffer.from(await derive(password, salt)).toString('hex')}`;
}
export async function checkPassword(password, encoded) {
  if (typeof password !== 'string' || password.length > 128) return false;
  const parts = String(encoded || '').split(':');
  const salt = parts.length === 6 ? parts[4] : '00000000000000000000000000000000';
  const expected = Buffer.from(parts.length === 6 ? parts[5] : '00'.repeat(32), 'hex');
  const actual = await derive(password, salt);
  return actual.length === expected.length && timingSafeEqual(actual, expected) && parts.length === 6;
}
export async function readBounded(stream, maxBytes) {
  if (!stream) return new Uint8Array();
  const reader = stream.getReader();
  const chunks = []; let total = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > maxBytes) { await reader.cancel(); fail(413, 'too_large', `Content exceeds the ${maxBytes}-byte limit.`); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}
export async function readJson(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    fail(415, 'json_required', 'Send Content-Type: application/json.');
  let body;
  try { body = JSON.parse(new TextDecoder().decode(await readBounded(request.body, 48_000))); }
  catch (e) { if (e instanceof HttpError) throw e; fail(400, 'invalid_json', 'Request body must be valid JSON.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'invalid_body', 'Send a JSON object.');
  return body;
}
export function safeUrl(value, allowedHosts) {
  let url;
  try { url = new URL(value); } catch { fail(400, 'invalid_url', 'Enter a complete HTTPS URL.'); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') ||
      host.includes(':') || /^[\d.]+$/.test(host) || !host.includes('.') || host.endsWith('.local') ||
      host.endsWith('.internal') || /(^|\.)(localhost|upwork\.com|fiverr\.com|linkedin\.com)$/.test(host))
    fail(400, 'unsafe_url', 'Only approved public HTTPS websites are supported; marketplace scraping and private addresses are blocked.');
  if (!allowedHosts.split(',').map(h => h.trim().toLowerCase()).filter(Boolean).includes(host))
    fail(403, 'host_not_approved', 'This hostname is not approved for fetching. Ask the operator to allow your owned public domain, or use a pasted-content review.');
  if (url.href.length > 2048 || url.search || url.hash) fail(400, 'invalid_url', 'Use a URL without query parameters or a fragment (maximum 2048 characters).');
  return url;
}
export function checkOrigin(request) {
  if (['GET','HEAD','OPTIONS'].includes(request.method)) return;
  const origin = request.headers.get('origin');
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site')
    fail(403, 'origin_rejected', 'Cross-site changes are not allowed.');
  // Browser session mutations must carry Origin. Server clients use bearer keys.
  if (!origin && request.headers.has('cookie') && !request.headers.has('authorization'))
    fail(403, 'origin_required', 'Session changes require a same-origin request.');
}
