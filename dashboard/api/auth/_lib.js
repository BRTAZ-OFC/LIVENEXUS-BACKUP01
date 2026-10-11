// NOTE: Auth utilities for Cloudflare Pages Functions and local dev server (Cloudflare Pages + D1)
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
  if (!password || !salt || !expectedHash) return false;
  try {
    const hash = await hashPassword(password, salt);
    return timingSafeEqual(hash, expectedHash);
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
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

async function ensureTables(env) {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `).run();
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `).run();
  } catch (e) {
    console.error('ensureTables error:', e);
  }
}

export async function getUserByEmail(env, email) {
  try {
    return await env.DB.prepare(`
      SELECT * FROM users WHERE email = ?
    `).bind(email).first();
  } catch (err) {
    if (String(err.message || err).includes('no such table')) {
      await ensureTables(env);
      return await env.DB.prepare(`
        SELECT * FROM users WHERE email = ?
      `).bind(email).first();
    }
    throw err;
  }
}

export async function getUserById(env, userId) {
  try {
    return await env.DB.prepare(`
      SELECT * FROM users WHERE id = ?
    `).bind(userId).first();
  } catch (err) {
    if (String(err.message || err).includes('no such table')) {
      await ensureTables(env);
      return await env.DB.prepare(`
        SELECT * FROM users WHERE id = ?
      `).bind(userId).first();
    }
    throw err;
  }
}

export async function createSession(env, sessionId, userId) {
  try {
    const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 86400000).toISOString();
    await env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(sessionId, userId, expiresAt).run();
  } catch (err) {
    if (String(err.message || err).includes('no such table')) {
      await ensureTables(env);
      const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 86400000).toISOString();
      await env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
        .bind(sessionId, userId, expiresAt).run();
      return;
    }
    throw err;
  }
}

export async function getSession(env, sessionId) {
  try {
    return await env.DB.prepare(`
      SELECT s.id as session_id,
             u.*
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.expires_at > datetime('now')
    `).bind(sessionId).first();
  } catch (err) {
    if (String(err.message || err).includes('no such table')) {
      await ensureTables(env);
      return await env.DB.prepare(`
        SELECT s.id as session_id,
               u.*
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.expires_at > datetime('now')
    `).bind(sessionId).first();
    }
    throw err;
  }
}

export async function deleteSession(env, sessionId) {
  await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
}

export async function upsertUserData(env, userId, updates) {
  if (!userId || !updates || typeof updates !== 'object') return;
  try {
    const now = new Date().toISOString();
    if (updates.display_name !== undefined) {
      await env.DB.prepare("UPDATE users SET full_name = ?, updated_at = ? WHERE id = ?")
        .bind(updates.display_name, now, userId).run();
    }
  } catch (e) {
    console.error('upsertUserData failed:', e);
  }
}

// --- Response helpers ---

export function publicUser(row) {
  if (!row) return null;
  
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name || row.email,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
    // Atributos virtuais para compatibilidade com o frontend (não salvos no DB)
    data: {},
    channels: {}
  };
}

export function resolveSessionId(request, env) {
  // 1. Tentar pelo Cookie
  const cookieSession = getCookie(request, 'lnx_session');
  if (cookieSession) return cookieSession;

  // 2. Tentar pelo header Authorization
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // 3. Fallback para headers em minúsculo (comum em ambientes simulados)
  const authHeaderLower = request.headers.get('authorization') || '';
  if (authHeaderLower.startsWith('Bearer ')) {
    return authHeaderLower.substring(7).trim();
  }

  return null;
}

export function isOriginAllowed(origin, env) {
  if (!origin) return false;
  const allowedStr = env.DEV_ALLOWED_ORIGINS || '';
  const allowedList = allowedStr.split(',').map(o => o.trim().toLowerCase());
  return allowedList.includes(origin.toLowerCase());
}

export function handleDevPreflight(request, env) {
  const isDev = env && (env.DEV_MODE === 'true' || env.DEV_MODE === true);
  if (isDev && request.method === 'OPTIONS') {
    const origin = request.headers.get('Origin');
    if (origin && isOriginAllowed(origin, env)) {
      const headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      };
      return new Response(null, { status: 204, headers });
    }
  }
  return null;
}

export function jsonResponse(data, status, extraHeaders, request, env) {
  const headers = { 'Content-Type': 'application/json', ...(extraHeaders || {}) };
  if (request && env) {
    const isDev = env.DEV_MODE === 'true' || env.DEV_MODE === true;
    if (isDev) {
      const origin = request.headers.get('Origin');
      if (origin && isOriginAllowed(origin, env)) {
        headers['Access-Control-Allow-Origin'] = origin;
        headers['Access-Control-Allow-Credentials'] = 'true';
        headers['Access-Control-Allow-Methods'] = 'GET, POST, PATCH, PUT, DELETE, OPTIONS';
        headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      }
    }
  }
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers,
  });
}

export function errorResponse(message, status, request, env) {
  return jsonResponse({ message }, status || 400, {}, request, env);
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
