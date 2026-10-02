import { getUserByEmail, verifyPassword, generateSessionId, createSession, setSessionCookie, publicUser, jsonResponse, errorResponse, handleDevPreflight, hashPassword, generateSalt } from './_lib.js';

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

  const user = await getUserByEmail(env, email);
  if (!user) return errorResponse('Invalid email or password', 401, request, env);

  const valid = await verifyPassword(password, user.password_salt, user.password_hash);
  if (!valid) return errorResponse('Invalid email or password', 401, request, env);

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
