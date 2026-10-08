import fs from 'node:fs/promises';
import path from 'node:path';
import { reviewsJohnson } from '../../conexao/ramal/cruds/Review_Johnson.js';
import { messagesJohnson } from '../../conexao/ramal/cruds/Config_MessagesJohnson.js';
import { getCloudflareD1 } from '../../api/auth/cloudflareD1.js';

export async function handleDatabaseInspectRequest(req, res) {
  res.setHeader('Content-Type', 'application/json');

  const isAdmin = String(req.documentUserRole || '').toLowerCase() === 'admin';
  if (!isAdmin) {
    return res.end(JSON.stringify({ ok: false, error: 'Acesso negado.' }));
  }

  const tables = {};

  const safeCall = async (key, name, callFn) => {
    try {
      const records = await callFn();
      tables[key] = { name, records, error: null };
    } catch (err) {
      tables[key] = { name, records: [], error: err.message };
    }
  };

  await safeCall('reviews', 'Avaliações', () => reviewsJohnson.list(500, true));
  await safeCall('contacts', 'Contatos e Mensagens', () => messagesJohnson.list(500));

  const cwd = process.cwd();

  // Buscar usuários válidos do D1 para limpeza de fantasmas
  let validUserIds = null;
  const d1 = getCloudflareD1();
  if (d1) {
    try {
      const q = await d1.prepare('SELECT id FROM users').all();
      validUserIds = new Set((q.results || []).map(u => u.id));
    } catch {}
  }

  // Helper para limpar e persistir banco JSON sem usuários fantasmas
  async function cleanAndReadJson(filePath, type = 'array_list') {
    const raw = await fs.readFile(filePath, 'utf8').catch(() => '{}');
    let db = {};
    try { db = JSON.parse(raw || '{}'); } catch { db = {}; }
    let changed = false;
    const cleaned = {};

    for (const [uId, val] of Object.entries(db)) {
      // Se tivermos lista de usuários válidos e o uId não estiver lá, é fantasma -> remover
      if (validUserIds && validUserIds.size > 0 && !validUserIds.has(uId)) {
        changed = true;
        continue;
      }
      if (type === 'array_list') {
        if (Array.isArray(val) && val.length > 0) {
          cleaned[uId] = val;
        } else {
          changed = true;
        }
      } else if (type === 'library') {
        const total = (val.songs?.length || 0) + (val.albums?.length || 0) + (val.artists?.length || 0) + (val.playlists?.length || 0);
        if (total > 0) {
          cleaned[uId] = val;
        } else {
          changed = true;
        }
      } else if (type === 'rtc') {
        if (val && typeof val === 'object' && Object.keys(val).length > 0) {
          cleaned[uId] = val;
        } else {
          changed = true;
        }
      }
    }

    if (changed) {
      await fs.writeFile(filePath, JSON.stringify(cleaned, null, 2), 'utf8').catch(() => {});
    }
    return cleaned;
  }

  // 1. Cenários
  const cenariosPath = path.resolve(cwd, 'dashboard/painel-admin/db/cenarios.json');
  const cenariosDb = await cleanAndReadJson(cenariosPath, 'array_list');
  tables.cenarios = { name: 'Cenários', records: Object.entries(cenariosDb).flatMap(([u, items]) => items.map(i => ({ userId: u, ...i }))), error: null };

  // 2. Overlays
  const overlaysPath = path.resolve(cwd, 'dashboard/overlays/overlays.json');
  const overlaysDb = await cleanAndReadJson(overlaysPath, 'array_list');
  tables.overlays = { name: 'Overlays', records: Object.entries(overlaysDb).flatMap(([u, items]) => items.map(i => ({ userId: u, ...i }))), error: null };

  // 3. Biblioteca
  const libPath = path.resolve(cwd, 'dashboard/biblioteca/biblioteca.json');
  const libDb = await cleanAndReadJson(libPath, 'library');
  tables.biblioteca = { name: 'Biblioteca', records: Object.entries(libDb).flatMap(([u, data]) => Object.values(data).flat().map(i => ({ userId: u, ...i }))), error: null };

  // 4. RTC Identity
  const rtcPath = path.resolve(cwd, 'dashboard/configuracao/rtc_registry.json');
  const rtcDb = await cleanAndReadJson(rtcPath, 'rtc');
  tables.rtcIdentity = { name: 'RTC Identity', records: Object.entries(rtcDb).map(([u, v]) => ({ userId: u, ...v })), error: null };

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
      let customChanged = false;
      const cleanCustom = {};
      for (const [uId, items] of Object.entries(data)) {
        if (validUserIds && validUserIds.size > 0 && !validUserIds.has(uId)) {
          customChanged = true;
          continue;
        }
        if (Array.isArray(items) && items.length > 0) {
          cleanCustom[uId] = items;
        } else {
          customChanged = true;
        }
      }
      if (customChanged) {
        await fs.writeFile(dataPath, JSON.stringify(cleanCustom, null, 2), 'utf8').catch(() => {});
      }
      tables[id] = { name: schema.name, records: Object.entries(cleanCustom).flatMap(([u, items]) => Array.isArray(items) ? items.map(i => ({ userId: u, ...i })) : []), error: null };
    } catch (err) {
      tables[id] = { name: schema.name, records: [], error: err.message };
    }
  }

  return res.end(JSON.stringify({ ok: true, tables }));
}
