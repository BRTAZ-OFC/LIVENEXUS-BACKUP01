import fs from 'node:fs/promises';
import path from 'node:path';

export async function handleDatabaseCreateRequest(req, res) {
  res.setHeader('Content-Type', 'application/json');

  const isAdmin = String(req.documentUserRole || '').toLowerCase() === 'admin';
  if (!isAdmin) {
    res.statusCode = 403;
    return res.end(JSON.stringify({ ok: false, error: 'Acesso negado.' }));
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: 'Método não permitido.' }));
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const { name, id, fields } = body;

    if (!id || !/^[a-z0-9_-]+$/.test(id)) {
        return res.end(JSON.stringify({ ok: false, error: 'Identificador técnico inválido.' }));
    }

    const cwd = process.cwd();
    const schemasPath = path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/schemas.json');
    const dataDir = path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json');
    const dataPath = path.join(dataDir, `${id}.json`);

    // 1. Update schemas
    const rawSchemas = await fs.readFile(schemasPath, 'utf8').catch(() => '{}');
    const schemas = JSON.parse(rawSchemas || '{}');
    if (schemas[id]) {
        return res.end(JSON.stringify({ ok: false, error: 'CRUD já existe.' }));
    }

    schemas[id] = { name, id, fields, createdAt: new Date().toISOString() };
    await fs.writeFile(schemasPath, JSON.stringify(schemas, null, 2), 'utf8');

    // 2. Initialize empty data file
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(dataPath, '{}', 'utf8');

    res.statusCode = 200;
    return res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ ok: false, error: err.message }));
  }
}
