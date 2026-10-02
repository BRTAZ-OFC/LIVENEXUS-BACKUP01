import {
  resolveSessionId,
  getSession,
  upsertUserData,
  getUserById,
  publicUser,
  jsonResponse,
  errorResponse,
  handleDevPreflight
} from './_lib.js';

export async function onRequestOptions(context) {
  const { request, env } = context;
  const preflightRes = handleDevPreflight(request, env);
  if (preflightRes) return preflightRes;
  return new Response(null, { status: 204 });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.DB) return errorResponse('Database not configured', 500, request, env);

  const sessionId = resolveSessionId(request, env);
  if (!sessionId) return errorResponse('Not authenticated', 401, request, env);

  const session = await getSession(env, sessionId);
  if (!session) return errorResponse('Not authenticated', 401, request, env);

  // Return the public user data
  return jsonResponse(publicUser(session), 200, {}, request, env);
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  if (!env.DB) return errorResponse('Database not configured', 500, request, env);

  const sessionId = resolveSessionId(request, env);
  if (!sessionId) return errorResponse('Not authenticated', 401, request, env);

  const session = await getSession(env, sessionId);
  if (!session) return errorResponse('Not authenticated', 401, request, env);

  let body;
  try { body = await request.json(); } catch { return errorResponse('Invalid request body', 400, request, env); }

  const userId = session.id;

  // 1. Update Display Name if requested
  const userDataUpdates = {};
  if (body.display_name !== undefined) {
    userDataUpdates.display_name = body.display_name;
  } else if (body.full_name !== undefined) {
    userDataUpdates.display_name = body.full_name;
  }

  if (Object.keys(userDataUpdates).length > 0) {
    await upsertUserData(env, userId, userDataUpdates);
  }

  const user = await getUserById(env, userId);
  return jsonResponse(publicUser(user), 200, {}, request, env);
}
