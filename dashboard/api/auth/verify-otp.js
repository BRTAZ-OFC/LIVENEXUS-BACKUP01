import {
  getUserByEmail,
  generateSessionId,
  createSession,
  setSessionCookie,
  publicUser,
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
  const otpCode = String(body.otpCode || '').trim();

  console.log(`[VerifyOTP] Email: ${email}, Input Code: ${otpCode}`);

  if (!email || !otpCode) return errorResponse('Email and OTP code required', 400, request, env);

  // Validate activation via Auth_Johnson (OFF-DB)
  const activation = await authJohnson.getActivation(email);
  console.log(`[VerifyOTP] Found activation:`, JSON.stringify(activation));

  if (!activation || activation.code !== otpCode) {
    const errorMsg = `Código de verificação inválido ou expirado. Debug: [Email: ${email}] [Esperado: ${activation?.code}] [Recebido: ${otpCode}]`;
    console.log(`[VerifyOTP] ${errorMsg}`);
    return errorResponse(errorMsg, 401, request, env);
  }

  console.log(`[VerifyOTP] Verification SUCCESS`);

  const user = await getUserByEmail(env, email);
  if (!user) return errorResponse('Usuário não encontrado no banco de dados', 404, request, env);

  // Delete the activation record after use
  await authJohnson.deleteActivation(email);

  const sessionId = generateSessionId();
  await createSession(env, sessionId, user.id);

  const secure = request.url.startsWith('https://');
  const responseData = publicUser(user);
  responseData.token = sessionId;
  responseData.user = publicUser(user);

  return jsonResponse(responseData, 200, {
    'Set-Cookie': setSessionCookie(sessionId, secure),
  }, request, env);
}
