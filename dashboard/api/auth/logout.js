import { SESSION_COOKIE, getCookie, resolveSessionId, deleteSession, clearSessionCookie, jsonResponse, errorResponse, handleDevPreflight } from './_lib.js';

export async function onRequestOptions(context) {
  const { request, env } = context;
  const preflightRes = handleDevPreflight(request, env);
  if (preflightRes) return preflightRes;
  return new Response(null, { status: 204 });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const sessionId = resolveSessionId(request, env);
  const secure = request.url.startsWith('https://');
  const clearCookieHeader = { 'Set-Cookie': clearSessionCookie(secure) };

  if (sessionId && env.DB) {
    try {
      await deleteSession(env, sessionId);
    } catch (err) {
      // Se a invalidação no D1 falhar, retorna erro 500 preservando a limpeza do cookie
      return jsonResponse(
        { ok: false, error: 'Failed to invalidate session' },
        500,
        clearCookieHeader,
        request,
        env
      );
    }
  }

  return jsonResponse({ ok: true }, 200, clearCookieHeader, request, env);
}
