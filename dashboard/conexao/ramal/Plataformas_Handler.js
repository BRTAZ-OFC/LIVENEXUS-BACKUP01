import { PlataformasJohnson } from './cruds/Plataformas_Johnson.js';
import { getAuthorizedUserId } from '../../api/auth/accessValidator.js';

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
    if (size > 16_384) throw new Error('Payload muito grande.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

export async function handlePlataformasRequest(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname !== '/api/plataformas') return respond(res, 404, { ok: false, error: 'Rota inválida.' });
    
    const userId = getAuthorizedUserId(req);
    if (!userId) return respond(res, 401, { ok: false, error: 'Autenticação necessária.' });

    const id = url.searchParams.get('id');

    if (req.method === 'GET') {
      const result = id ? await PlataformasJohnson.get(userId, id) : await PlataformasJohnson.list(userId);
      if (id && !result) return respond(res, 404, { ok: false, error: 'Plataforma não encontrada.' });
      return respond(res, 200, { ok: true, ...(id ? { plataforma: result } : { plataformas: result }) });
    }

    if (req.method === 'POST' && !id) {
      const body = await bodyOf(req);
      const existing = await PlataformasJohnson.list(userId);
      const found = existing.find(i => i.platform?.toLowerCase() === body.platform?.toLowerCase());
      let saved;
      if (found) {
        saved = await PlataformasJohnson.update(userId, found.id, body);
      } else {
        saved = await PlataformasJohnson.create(userId, body);
      }
      return respond(res, 201, { ok: true, plataforma: saved, plataformas: saved });
    }

    if (req.method === 'PATCH' && id) {
      const updated = await PlataformasJohnson.update(userId, id, await bodyOf(req));
      return updated ? respond(res, 200, { ok: true, plataforma: updated, plataformas: updated }) : respond(res, 404, { ok: false, error: 'Plataforma não encontrada.' });
    }

    if (req.method === 'DELETE' && id) {
      const deleted = await PlataformasJohnson.delete(userId, id);
      return deleted ? respond(res, 200, { ok: true }) : respond(res, 404, { ok: false, error: 'Plataforma não encontrada.' });
    }

    return respond(res, 405, { ok: false, error: 'Método não permitido.' });
  } catch (error) {
    return respond(res, 500, { ok: false, error: error.message });
  }
}
