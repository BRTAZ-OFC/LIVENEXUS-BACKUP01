import fs from 'node:fs/promises';
import path from 'node:path';
import {
  resolveSessionId,
  getSession,
  clearSessionCookie,
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

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return errorResponse('Database not configured', 500, request, env);

  const sessionId = resolveSessionId(request, env);
  if (!sessionId) return errorResponse('Não autenticado', 401, request, env);

  // getSession retorna u.* (que inclui 'id' como o PK do usuário) e s.id como 'session_id'
  const session = await getSession(env, sessionId);
  if (!session || !session.id) return errorResponse('Sessão inválida ou usuário não encontrado', 401, request, env);

  const userId = session.id;

  try {
    // 1. Remover primeiro todas as sessões pertencentes ao userId
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();

    // 2. Remover o usuário da tabela users
    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

    // 3. Executar a limpeza dos dados Johnson/JSON pertencentes a esse usuário
    const cwd = process.cwd();
    const jsonFiles = [
      path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/cenarios.json'),
      path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/overlays.json'),
      path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/biblioteca.json'),
      path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/conect-plataform.json'),
      path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/rtc_registry.json')
    ];

    for (const filePath of jsonFiles) {
      try {
        const data = await fs.readFile(filePath, 'utf8').catch(() => '{}');
        const db = JSON.parse(data || '{}');
        if (db[userId]) {
          delete db[userId];
          await fs.writeFile(filePath, JSON.stringify(db, null, 2), 'utf8');
        }
      } catch (err) {
        console.error(`Erro ao limpar dados do usuário em ${filePath}:`, err);
      }
    }

    // 4. Remover arquivo da galeria e vods do usuário
    const galleryFile = path.resolve(cwd, `dashboard/conexao/ramal/cruds/json/user_galleries/${userId}.json`);
    const vodsFile = path.resolve(cwd, `dashboard/conexao/ramal/cruds/json/vods/${userId}.json`);
    await fs.unlink(galleryFile).catch(() => {});
    await fs.unlink(vodsFile).catch(() => {});

    // 5. Limpar a sessão/cookie no final
    const secure = request.url.startsWith('https://');
    return jsonResponse({ ok: true, message: 'Conta excluída com sucesso' }, 200, {
      'Set-Cookie': clearSessionCookie(secure),
    }, request, env);

  } catch (err) {
    console.error('Erro na exclusão definitiva da conta:', err);
    return errorResponse(err.message || 'Falha ao deletar conta', 500, request, env);
  }
}
