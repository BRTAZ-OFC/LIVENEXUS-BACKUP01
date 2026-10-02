import { messagesJohnson } from '../conexao/ramal/cruds/Config_MessagesJohnson.js';
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
    if (size > 16_384) throw new Error('Mensagem muito grande.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

export async function handleMessagesRequest(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;
    if (pathname !== '/api/contacts') return respond(res, 404, { ok: false, error: 'Rota inválida.' });
    
    const id = url.searchParams.get('id');

    // Permitir criação pública (POST) sem autenticação
    if (req.method === 'POST' && !id) {
      const contact = await messagesJohnson.create(await bodyOf(req));
      return respond(res, 201, { ok: true, contact });
    }

    const userId = getAuthorizedUserId(req);
    if (!userId) return respond(res, 401, { ok: false, error: 'Autenticação necessária.' });
    
    // Contacts is currently a global feature for admins to manage
    const isAdmin = String(req.documentUserRole || '').toLowerCase() === 'admin';
    
    if (!isAdmin) return respond(res, 403, { ok: false, error: 'Acesso administrativo necessário.' });
    
    if (req.method === 'GET') {
      const result = id ? await messagesJohnson.get(id) : await messagesJohnson.list(Number(url.searchParams.get('limit')) || 500);
      if (id && !result) return respond(res, 404, { ok: false, error: 'Mensagem não encontrada.' });
      return respond(res, 200, { ok: true, ...(id ? { contact: result } : { contacts: result }) });
    }
    if (req.method === 'PATCH' && id) {
      const contact = await messagesJohnson.update(id, await bodyOf(req));
      return contact ? respond(res, 200, { ok: true, contact }) : respond(res, 404, { ok: false, error: 'Mensagem não encontrada.' });
    }
    if (req.method === 'DELETE' && id) {
      const deleted = await messagesJohnson.delete(id);
      return deleted ? respond(res, 200, { ok: true }) : respond(res, 404, { ok: false, error: 'Mensagem não encontrada.' });
    }
    return respond(res, 405, { ok: false, error: 'Método não permitido.' });
  } catch (error) {
    return respond(res, error instanceof SyntaxError || /inválid|grande/.test(error.message) ? 400 : 500, { ok: false, error: error.message });
  }
}
