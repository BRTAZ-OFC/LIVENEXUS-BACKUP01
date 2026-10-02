import fs from 'node:fs/promises';
import path from 'node:path';

const getPaths = () => ({
  schemas: path.resolve(process.cwd(), 'dashboard/painel-admin/db/schemas.json'),
  dataDir: path.resolve(process.cwd(), 'dashboard/painel-admin/db/data')
});

export async function handleDatabaseAdminRequest(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const isAdmin = String(req.documentUserRole || '').toLowerCase() === 'admin';
  if (!isAdmin) return res.end(JSON.stringify({ ok: false, error: 'Acesso negado.' }));

  const paths = getPaths();
  const rawSchemas = await fs.readFile(paths.schemas, 'utf8').catch(() => '{}');
  const schemas = JSON.parse(rawSchemas || '{}');

  const url = new URL(req.url, 'http://localhost');
  const method = req.method;
  const id = url.searchParams.get('id');

  try {
    if (method === 'PATCH' && id) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const { name, description, fields } = JSON.parse(Buffer.concat(chunks).toString());
      schemas[id] = { ...(schemas[id] || { id }), name, description, fields };
      await fs.writeFile(paths.schemas, JSON.stringify(schemas, null, 2));
      return res.end(JSON.stringify({ ok: true }));
    }

    if (method === 'POST' && url.pathname.endsWith('/duplicate')) {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const { originalId, newId, newName } = JSON.parse(Buffer.concat(chunks).toString());
        if (schemas[newId]) throw new Error('CRUD já existente.');
        const originalSchema = schemas[originalId] || { id: originalId, name: originalId, fields: [] };
        schemas[newId] = { ...originalSchema, id: newId, name: newName, createdAt: new Date().toISOString() };
        await fs.writeFile(paths.schemas, JSON.stringify(schemas, null, 2));
        await fs.writeFile(path.join(paths.dataDir, `${newId}.json`), '{}');
        return res.end(JSON.stringify({ ok: true }));
    }

    if (method === 'DELETE' && id) {
      if (schemas[id]) {
        delete schemas[id];
        await fs.writeFile(paths.schemas, JSON.stringify(schemas, null, 2));
      }
      // Deletar o arquivo físico de dados APENAS se for uma tabela personalizada do dataDir
      const isCustomTable = !['cenarios', 'overlays', 'biblioteca', 'rtcIdentity', 'reviews', 'contacts', 'templates', 'userGalleries'].includes(id);
      if (isCustomTable) {
        await fs.unlink(path.join(paths.dataDir, `${id}.json`)).catch(() => {});
      }
      return res.end(JSON.stringify({ ok: true }));
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: 'Método não permitido.' }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: err.message }));
  }
}
