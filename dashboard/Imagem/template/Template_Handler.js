import fs from 'node:fs';
import { templateJohnson } from '../../conexao/ramal/cruds/Template_Johnson.js';

const respond = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

async function payloadOf(req) {
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > 14_000_000) throw new Error('Arquivo muito grande.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

export async function handleTemplateRequest(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const assetPrefix = '/api/templates/assets/';
    if (url.pathname.startsWith(assetPrefix)) {
      if (req.method !== 'GET') return respond(res, 405, { ok: false, error: 'Método não permitido.' });
      const id = decodeURIComponent(url.pathname.slice(assetPrefix.length));
      const physical = await templateJohnson.physicalFile(id);
      if (!physical) return respond(res, 404, { ok: false, error: 'Template não encontrado.' });
      res.setHeader('Content-Type', physical.record.format === 'PNG' ? 'image/png' : 'image/gif');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return fs.createReadStream(physical.filename).pipe(res);
    }
    if (url.pathname !== '/api/templates') return respond(res, 404, { ok: false, error: 'Rota inválida.' });
    const id = url.searchParams.get('id');
    if (req.method === 'GET') {
      const result = id ? await templateJohnson.get(id) : await templateJohnson.list();
      if (id && !result) return respond(res, 404, { ok: false, error: 'Template não encontrado.' });
      const categories = await templateJohnson.listCategories();
      return respond(res, 200, { ok: true, ...(id ? { template: result } : { templates: result, categories }) });
    }
    if (!req.documentUserId) return respond(res, 401, { ok: false, error: 'Autenticação necessária.' });
    if (String(req.documentUserRole).toLowerCase() !== 'admin') return respond(res, 403, { ok: false, error: 'Acesso administrativo necessário.' });
    if (req.method === 'POST') {
      const body = await payloadOf(req);
      if (body.action === 'create_category') {
        const resCat = await templateJohnson.createCategory(body.categoryName || body.category);
        return respond(res, 200, { ok: true, ...resCat });
      }
      if (body.action === 'upload') {
        return respond(res, 200, { ok: true, template: await templateJohnson.upload(body) });
      }
      return respond(res, 400, { ok: false, error: 'Operação inválida.' });
    }
    if (req.method === 'PATCH' && id) {
      const body = await payloadOf(req);
      const template = await templateJohnson.update(id, body.changes);
      return template ? respond(res, 200, { ok: true, template }) : respond(res, 404, { ok: false, error: 'Template não encontrado.' });
    }
    if (req.method === 'DELETE' && id) {
      const deleted = await templateJohnson.delete(id);
      return deleted ? respond(res, 200, { ok: true }) : respond(res, 404, { ok: false, error: 'Template não encontrado.' });
    }
    return respond(res, 405, { ok: false, error: 'Método não permitido.' });
  } catch (error) {
    const invalid = /inválid|grande|Somente PNG|Formato do arquivo|não permitido/i.test(error.message) || error instanceof SyntaxError;
    return respond(res, invalid ? 400 : 500, { ok: false, error: error.message });
  }
}
