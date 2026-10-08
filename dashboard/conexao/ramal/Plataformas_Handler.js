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
      const items = await PlataformasJohnson.list();
      // Filtrar por usuário, exceto se admin ou conforme regra
      const userItems = items.filter(i => i.user_id === userId || req.documentUserRole === 'admin');
      if (id) {
        const item = userItems.find(i => i.id === id);
        if (!item) return respond(res, 404, { ok: false, error: 'Registro não encontrado.' });
        return respond(res, 200, { ok: true, plataforma: item });
      }
      return respond(res, 200, { ok: true, plataformas: userItems });
    }

    if (req.method === 'POST') {
      const data = await bodyOf(req);
      const created = await PlataformasJohnson.create({ ...data, user_id: userId });
      return respond(res, 201, { ok: true, plataformas: created });
    }

    if (req.method === 'PATCH' && id) {
      const data = await bodyOf(req);
      const updated = await PlataformasJohnson.update(id, data);
      return respond(res, 200, { ok: true, plataformas: updated });
    }

    if (req.method === 'DELETE' && id) {
      await PlataformasJohnson.delete(id);
      return respond(res, 200, { ok: true });
    }

    return respond(res, 405, { ok: false, error: 'Método não permitido.' });
  } catch (error) {
    return respond(res, 500, { ok: false, error: error.message });
  }
}
