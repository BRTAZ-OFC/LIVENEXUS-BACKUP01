// Shared utilities for auth Pages Functions (Cloudflare Pages + D1)
// PBKDF2 password hashing via Web Crypto, session management via D1.

export const SESSION_COOKIE = 'lnx_session';
const SESSION_DURATION_DAYS = 7;
const PBKDF2_ITERATIONS = 100000;

// --- Password hashing (PBKDF2 via Web Crypto) ---

export async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial, 256
  );
  return bufToBase64(bits);
}

export async function verifyPassword(password, salt, expectedHash) {
  const hash = await hashPassword(password, salt);
  return timingSafeEqual(hash, expectedHash);
}

export function generateSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return bufToBase64(arr.buffer);
}

// --- Session management ---

export function generateSessionId() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return bufToHex(arr.buffer);
}

export function getCookie(request, name) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return match ? match[1].trim() : null;
}

export function setSessionCookie(sessionId, secure) {
  const flags = [
    `${SESSION_COOKIE}=${sessionId}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_DURATION_DAYS * 86400}`,
  ];
  if (secure) flags.push('Secure');
  return flags.join('; ');
}

export function clearSessionCookie(secure) {
  const flags = [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (secure) flags.push('Secure');
  return flags.join('; ');
}

// --- D1 queries ---

export async function getUserByEmail(env, email) {
  return env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
}

export async function createSession(env, sessionId, userId) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 86400000).toISOString();
  await env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(sessionId, userId, expiresAt).run();
}

export async function getSession(env, sessionId) {
  return env.DB.prepare(`
    SELECT s.id as session_id, u.*
    FROM sessions s JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).bind(sessionId).first();
}

export async function deleteSession(env, sessionId) {
  await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
}

export async function updateUserChannels(env, userId, channels) {
  await env.DB.prepare("UPDATE users SET channels = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(JSON.stringify(channels), userId).run();
}

// --- Response helpers ---

export function publicUser(row) {
  if (!row) return null;
  let channels = {};
  try {
    channels = typeof row.channels === 'string' ? JSON.parse(row.channels || '{}') : (row.channels || {});
  } catch {}
  let data = {};
  try {
    data = typeof row.data === 'string' ? JSON.parse(row.data || '{}') : (row.data || {});
  } catch {}
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name || row.email,
    role: row.role,
    channels,
    data,
  };
}

export function jsonResponse(data, status, extraHeaders) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...(extraHeaders || {}) },
  });
}

export function errorResponse(message, status) {
  return jsonResponse({ message }, status || 400);
}

// --- Internal ---

function bufToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function bufToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}