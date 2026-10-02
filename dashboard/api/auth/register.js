import {
  getUserByEmail,
  hashPassword,
  generateSalt,
  jsonResponse,
  errorResponse,
  handleDevPreflight
} from './_lib.js';
import { authJohnson } from '../../conexao/ramal/cruds/Auth_Johnson.js';

export async function onRequestOptions(context) {
  const { request, env } = context;
  const preflightRes = handleDevPreflight(request, env);
  if (preflightRes) return preflightRes;
  return new Response(null, { status: 204 });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return errorResponse('Database not configured', 500, request, env);

  let body;
  try { body = await request.json(); } catch { return errorResponse('Invalid request body', 400, request, env); }

  const email = (body.email || '').toLowerCase().trim();
  const password = body.password || '';
  if (!email || !password) return errorResponse('Email and password required', 400, request, env);
  if (password.length < 6) return errorResponse('Password must be at least 6 characters', 400, request, env);

  const existing = await getUserByEmail(env, email);
  if (existing) return errorResponse('Email already registered', 409, request, env);

  const salt = generateSalt();
  const hash = await hashPassword(password, salt);
  const userId = crypto.randomUUID();

  // Create user in D1 (MINIMALIST SCHEMA)
  await env.DB.prepare(
    'INSERT INTO users (id, email, full_name, password_hash, password_salt, role) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(userId, email, null, hash, salt, 'user').run();

  // Handle activation via Auth_Johnson (OFF-DB JSON FILE)
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins
  await authJohnson.createActivation(email, otpCode, otpExpires);

  return jsonResponse({ 
    message: 'Conta criada! Use o código enviado para ativar.',
    email,
    activation_code: otpCode // Retornado para conveniência no ambiente de dev
  }, 201, {}, request, env);
}
