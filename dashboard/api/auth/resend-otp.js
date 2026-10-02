import {
  getUserByEmail,
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
  if (!email) return errorResponse('Email required', 400, request, env);

  const user = await getUserByEmail(env, email);
  if (!user) return errorResponse('User not found', 404, request, env);

  // Generate a new 6-digit OTP via Auth_Johnson (OFF-DB)
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await authJohnson.createActivation(email, otpCode, otpExpires);

  return jsonResponse({ 
    message: 'OTP code resent.',
    email,
    activation_code: otpCode // Retornado para conveniência no ambiente de dev
  }, 200, {}, request, env);
}
