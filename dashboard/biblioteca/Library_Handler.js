import { libraryJohnson } from '../conexao/ramal/cruds/Library_Johnson.js';
import { getAuthorizedUserId } from '../api/auth/accessValidator.js';

export async function handleLibraryRequest(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const userId = getAuthorizedUserId(req);
    if (!userId) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ ok: false, error: 'Usuário não identificado ou sessão expirada.' }));
    }
    
    const url = new URL(req.url, 'http://localhost');
    const kind = url.searchParams.get('kind');
    const id = url.searchParams.get('id');
    const chunks = [];
    if (['POST', 'PATCH'].includes(req.method)) for await (const chunk of req) chunks.push(chunk);
    const payload = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
    let value;
    if (req.method === 'GET') value = id ? await libraryJohnson.get(userId, kind, id) : await libraryJohnson.list(userId);
    else if (req.method === 'POST') value = await libraryJohnson.create(userId, kind, payload.item);
    else if (req.method === 'PATCH' && id) value = await libraryJohnson.update(userId, kind, id, payload.changes);
    else if (req.method === 'DELETE' && id) value = await libraryJohnson.delete(userId, kind, id);
    else { res.statusCode = 405; return res.end(JSON.stringify({ ok: false, error: 'Método não permitido.' })); }
    if (value === null || value === false) { res.statusCode = 404; return res.end(JSON.stringify({ ok: false, error: 'Item não encontrado.' })); }
    res.end(JSON.stringify({ ok: true, library: req.method === 'GET' && !id ? value : undefined, item: typeof value === 'boolean' || (req.method === 'GET' && !id) ? undefined : value }));
  } catch (error) {
    res.statusCode = /inválid|utilizado/.test(error.message) || error instanceof SyntaxError ? 400 : 500;
    res.end(JSON.stringify({ ok: false, error: error.message }));
  }
}
