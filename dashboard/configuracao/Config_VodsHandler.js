import { vodsJohnson } from '../conexao/ramal/cruds/Config_VodsJohnson.js';
import { getAuthorizedUserId } from '../api/auth/accessValidator.js';

const respond = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

async function bodyOf(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 65_536) throw new Error('Documento muito grande.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

export async function handleVodsRequest(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname !== '/api/live-sessions') return respond(res, 404, { ok: false, error: 'Rota inválida.' });
    
    const userId = getAuthorizedUserId(req);
    if (!userId) return respond(res, 401, { ok: false, error: 'Autenticação necessária.' });
    
    const id = url.searchParams.get('id');
    if (req.method === 'GET') {
      const result = id ? await vodsJohnson.get(userId, id) : await vodsJohnson.list(userId, { vodStatus: url.searchParams.get('vodStatus') }, Number(url.searchParams.get('limit')) || 50);
      if (id && !result) return respond(res, 404, { ok: false, error: 'LiveSession não encontrada.' });
      return respond(res, 200, { ok: true, ...(id ? { session: result } : { sessions: result }) });
    }
    if (req.method === 'POST' && !id) return respond(res, 201, { ok: true, session: await vodsJohnson.create(userId, await bodyOf(req)) });
    if (req.method === 'PATCH' && id) {
      const session = await vodsJohnson.update(userId, id, await bodyOf(req));
      return session ? respond(res, 200, { ok: true, session }) : respond(res, 404, { ok: false, error: 'LiveSession não encontrada.' });
    }
    if (req.method === 'DELETE' && id) {
      const deleted = await vodsJohnson.delete(userId, id);
      return deleted ? respond(res, 200, { ok: true }) : respond(res, 404, { ok: false, error: 'LiveSession não encontrada.' });
    }
    return respond(res, 405, { ok: false, error: 'Método não permitido.' });
  } catch (error) {
    return respond(res, error instanceof SyntaxError || /inválid|grande|não confirmado/.test(error.message) ? 400 : 500, { ok: false, error: error.message });
  }
}
