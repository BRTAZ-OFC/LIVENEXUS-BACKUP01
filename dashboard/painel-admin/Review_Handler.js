import { reviewsJohnson } from '../conexao/ramal/cruds/Review_Johnson.js';
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
    if (size > 16_384) throw new Error('Avaliação muito grande.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

export async function handleReviewsRequest(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname !== '/api/reviews') return respond(res, 404, { ok: false, error: 'Rota inválida.' });
    const id = url.searchParams.get('id');
    
    if (req.method === 'POST' && !id) return respond(res, 201, { ok: true, review: await reviewsJohnson.create(await bodyOf(req)) });
    
    // Permitir GET sem autenticação
    const isAdmin = String(req.documentUserRole || '').toLowerCase() === 'admin';
    if (req.method === 'GET') {
      const result = id ? await reviewsJohnson.get(id, isAdmin) : await reviewsJohnson.list(Number(url.searchParams.get('limit')) || 500, isAdmin);
      if (id && !result) return respond(res, 404, { ok: false, error: 'Avaliação não encontrada.' });
      return respond(res, 200, { ok: true, ...(id ? { review: result } : { reviews: result }) });
    }

    const userId = getAuthorizedUserId(req);
    if (!userId) return respond(res, 401, { ok: false, error: 'Autenticação necessária.' });
    
    if (!isAdmin) return respond(res, 403, { ok: false, error: 'Acesso administrativo necessário.' });
    
    // Operações protegidas que restam: PATCH e DELETE (com id)
    if (req.method === 'PATCH' && id) {
      const review = await reviewsJohnson.update(id, await bodyOf(req));
      return review ? respond(res, 200, { ok: true, review }) : respond(res, 404, { ok: false, error: 'Avaliação não encontrada.' });
    }
    if (req.method === 'DELETE' && id) {
      const deleted = await reviewsJohnson.delete(id);
      return deleted ? respond(res, 200, { ok: true }) : respond(res, 404, { ok: false, error: 'Avaliação não encontrada.' });
    }
    return respond(res, 405, { ok: false, error: 'Método não permitido.' });
  } catch (error) {
    return respond(res, error instanceof SyntaxError || /inválid|grande/.test(error.message) ? 400 : 500, { ok: false, error: error.message });
  }
}
