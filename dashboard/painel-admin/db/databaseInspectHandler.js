import fs from 'node:fs/promises';
import path from 'node:path';
import { reviewsJohnson } from '../../conexao/ramal/cruds/Review_Johnson.js';
import { messagesJohnson } from '../../conexao/ramal/cruds/Config_MessagesJohnson.js';

export async function handleDatabaseInspectRequest(req, res) {
  res.setHeader('Content-Type', 'application/json');

  const isAdmin = String(req.documentUserRole || '').toLowerCase() === 'admin';
  if (!isAdmin) {
    return res.end(JSON.stringify({ ok: false, error: 'Acesso negado.' }));
  }

  const tables = {};

  // Função helper para capturar erros e isolar coleções
  const safeCall = async (key, name, callFn) => {
    try {
      const records = await callFn();
      tables[key] = { name, records, error: null };
    } catch (err) {
      tables[key] = { name, records: [], error: err.message };
    }
  };

  // Mapeamento real usando os Johnsons existentes
  // Nota: Como não temos um "AdminJohnson" para listar todos os usuários, 
  // faremos leituras de handlers administrativos específicos que acessam a persistência.
  
  await safeCall('reviews', 'Avaliações', () => reviewsJohnson.list(500, true));
  await safeCall('contacts', 'Contatos e Mensagens', () => messagesJohnson.list(500));
  
  // Para coleções baseadas em userId, precisamos iterar usuários do sistema.
  // Como não temos acesso fácil a lista de todos os usuários aqui,
  // manteremos a leitura dos arquivos de persistência via fs, mas de forma segura,
  // delegando o processamento do JSON aos handlers ou Johnson, se possível.

  // Como o objetivo é observação, vamos ler as estruturas de persistência que o servidor 
  // já aponta como fontes reais.

  const cwd = process.cwd();
  
  // 1. Cenários (dashboard/painel-admin/db/cenarios.json)
  const cenariosData = await fs.readFile(path.resolve(cwd, 'dashboard/painel-admin/db/cenarios.json'), 'utf8').catch(() => '{}');
  tables.cenarios = { name: 'Cenários', records: Object.entries(JSON.parse(cenariosData || '{}')).flatMap(([u, items]) => items.map(i => ({ userId: u, ...i }))), error: null };

  // 2. Overlays (dashboard/overlays/overlays.json)
  const overlaysData = await fs.readFile(path.resolve(cwd, 'dashboard/overlays/overlays.json'), 'utf8').catch(() => '{}');
  tables.overlays = { name: 'Overlays', records: Object.entries(JSON.parse(overlaysData || '{}')).flatMap(([u, items]) => items.map(i => ({ userId: u, ...i }))), error: null };

  // 3. Biblioteca (dashboard/biblioteca/biblioteca.json)
  const libData = await fs.readFile(path.resolve(cwd, 'dashboard/biblioteca/biblioteca.json'), 'utf8').catch(() => '{}');
  tables.biblioteca = { name: 'Biblioteca', records: Object.entries(JSON.parse(libData || '{}')).flatMap(([u, data]) => Object.values(data).flat().map(i => ({ userId: u, ...i }))), error: null };

  // 4. RTC Identity (dashboard/configuracao/rtc_registry.json)
  const rtcData = await fs.readFile(path.resolve(cwd, 'dashboard/configuracao/rtc_registry.json'), 'utf8').catch(() => '{}');
  tables.rtcIdentity = { name: 'RTC Identity', records: Object.entries(JSON.parse(rtcData || '{}')).map(([u, v]) => ({ userId: u, ...v })), error: null };

  // 5. Templates (dashboard/Imagem/template/templates.json)
  const templData = await fs.readFile(path.resolve(cwd, 'dashboard/Imagem/template/templates.json'), 'utf8').catch(() => '[]');
  tables.templates = { name: 'Templates', records: JSON.parse(templData || '[]'), error: null };

  // 6. User Created CRUDs
  const schemasData = await fs.readFile(path.resolve(cwd, 'dashboard/painel-admin/db/schemas.json'), 'utf8').catch(() => '{}');
  const schemas = JSON.parse(schemasData || '{}');
  for (const [id, schema] of Object.entries(schemas)) {
    try {
      const dataPath = path.resolve(cwd, `dashboard/painel-admin/db/data/${id}.json`);
      const rawData = await fs.readFile(dataPath, 'utf8').catch(() => '{}');
      const data = JSON.parse(rawData || '{}');
      tables[id] = { name: schema.name, records: Object.entries(data).flatMap(([u, items]) => Array.isArray(items) ? items.map(i => ({ userId: u, ...i })) : []), error: null };
    } catch (err) {
      tables[id] = { name: schema.name, records: [], error: err.message };
    }
  }

  return res.end(JSON.stringify({ ok: true, tables }));
}
