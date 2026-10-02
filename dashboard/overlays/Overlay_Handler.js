import { overlayJohnson } from '../conexao/ramal/cruds/Overlay_Johnson.js';
import { getAuthorizedUserId } from '../api/auth/accessValidator.js';

export async function handleOverlayRequest(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const userId = getAuthorizedUserId(req);
    if (!userId) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ ok: false, error: 'Usuário não identificado ou sessão expirada.' }));
    }
    
    const url = new URL(req.url, 'http://localhost');
    const id = url.searchParams.get('id');
    const chunks = [];
    if (['POST', 'PATCH'].includes(req.method)) for await (const chunk of req) chunks.push(chunk);
    const payload = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
    let value;
    if (req.method === 'GET') value = id ? await overlayJohnson.get(userId, id) : await overlayJohnson.list(userId);
    else if (req.method === 'POST') value = await overlayJohnson.create(userId, payload.overlay);
    else if (req.method === 'PATCH' && id) value = await overlayJohnson.update(userId, id, payload.changes);
    else if (req.method === 'DELETE' && id) value = await overlayJohnson.delete(userId, id);
    else { res.statusCode = 405; return res.end(JSON.stringify({ ok: false, error: 'Método não permitido.' })); }
    if (value === null || value === false) { res.statusCode = 404; return res.end(JSON.stringify({ ok: false, error: 'Overlay não encontrado.' })); }
    res.end(JSON.stringify({ ok: true, overlays: Array.isArray(value) ? value : undefined, overlay: Array.isArray(value) || typeof value === 'boolean' ? undefined : value }));
  } catch (error) {
    res.statusCode = /inválid|utilizado/.test(error.message) || error instanceof SyntaxError ? 400 : 500;
    res.end(JSON.stringify({ ok: false, error: error.message }));
  }
}
