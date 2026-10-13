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

  // Helper para ler dados sem modificar ou apagar arquivos no disco durante a inspeção
  async function readJson(filePath, type = 'array_list') {
    const raw = await fs.readFile(filePath, 'utf8').catch(() => '{}');
    let db = {};
    try { db = JSON.parse(raw || '{}'); } catch { db = {}; }
    const result = {};

    for (const [uId, val] of Object.entries(db)) {
      if (type === 'array_list') {
        if (Array.isArray(val) && val.length > 0) {
          result[uId] = val;
        }
      } else if (type === 'library') {
        const total = (val.songs?.length || 0) + (val.albums?.length || 0) + (val.artists?.length || 0) + (val.playlists?.length || 0);
        if (total > 0) {
          result[uId] = val;
        }
      } else if (type === 'rtc') {
        if (val && typeof val === 'object' && Object.keys(val).length > 0) {
          result[uId] = val;
        }
      }
    }
    return result;
  }

  // 1. Cenários
  const cenariosPath = path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/cenarios.json');
  const cenariosDb = await readJson(cenariosPath, 'array_list');
  tables.cenarios = { name: 'Cenários', records: Object.entries(cenariosDb).flatMap(([u, items]) => items.map(i => ({ userId: u, ...i }))), error: null };

  // 1.1. Conexões de Plataformas
  const plataformasPath = path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/conect-plataform.json');
  const plataformasDb = await readJson(plataformasPath, 'array_list');
  tables.plataformas = { name: 'Conexões de Plataformas', records: Object.entries(plataformasDb).flatMap(([u, items]) => items.map(i => ({ userId: u, ...i }))), error: null };

  // 2. Overlays
  const overlaysPath = path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/overlays.json');
  const overlaysDb = await readJson(overlaysPath, 'array_list');
  tables.overlays = { name: 'Overlays', records: Object.entries(overlaysDb).flatMap(([u, items]) => items.map(i => ({ userId: u, ...i }))), error: null };

  // 3. Biblioteca
  const libPath = path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/biblioteca.json');
  const libDb = await readJson(libPath, 'library');
  tables.biblioteca = { name: 'Biblioteca', records: Object.entries(libDb).flatMap(([u, data]) => Object.values(data).flat().map(i => ({ userId: u, ...i }))), error: null };

  // 4. RTC Identity
  const rtcPath = path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/rtc_registry.json');
  const rtcDb = await readJson(rtcPath, 'rtc');
  tables.rtcIdentity = { name: 'RTC Identity', records: Object.entries(rtcDb).map(([u, v]) => ({ userId: u, ...v })), error: null };

  // 5. Templates
  const templData = await fs.readFile(path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/templates.json'), 'utf8').catch(() => '[]');
  tables.templates = { name: 'Templates', records: JSON.parse(templData || '[]'), error: null };

  // 5.1. Galeria Geral
  const galeriaData = await fs.readFile(path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/galeria.json'), 'utf8').catch(() => '[]');
  tables.galeria = { name: 'Galeria Geral', records: JSON.parse(galeriaData || '[]'), error: null };

  // 5.2. Galeria Pessoal (User Galleries)
  try {
    const userGalleriesDir = path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/user_galleries');
    const files = await fs.readdir(userGalleriesDir).catch(() => []);
    const personalRecords = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const uId = path.basename(file, '.json');
        const rawUserGal = await fs.readFile(path.join(userGalleriesDir, file), 'utf8').catch(() => '[]');
        try {
          const items = JSON.parse(rawUserGal || '[]');
          if (Array.isArray(items)) {
            items.forEach(item => {
              personalRecords.push({ userId: uId, ...item });
            });
          }
        } catch {}
      }
    }
    tables.userGalleries = { name: 'Galeria Pessoal', records: personalRecords, error: null };
  } catch (err) {
    tables.userGalleries = { name: 'Galeria Pessoal', records: [], error: err.message };
  }

  // 6. User Created CRUDs
  const schemasData = await fs.readFile(path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/schemas.json'), 'utf8').catch(() => '{}');
  const schemas = JSON.parse(schemasData || '{}');
  for (const [id, schema] of Object.entries(schemas)) {
    try {
      const dataPath = path.resolve(cwd, `dashboard/conexao/ramal/cruds/json/${id}.json`);
      const rawData = await fs.readFile(dataPath, 'utf8').catch(() => '{}');
      const data = JSON.parse(rawData || '{}');
      const cleanCustom = {};
      for (const [uId, items] of Object.entries(data)) {
        if (Array.isArray(items) && items.length > 0) {
          cleanCustom[uId] = items;
        }
      }
      tables[id] = { name: schema.name, records: Object.entries(cleanCustom).flatMap(([u, items]) => Array.isArray(items) ? items.map(i => ({ userId: u, ...i })) : []), error: null };
    } catch (err) {
      tables[id] = { name: schema.name, records: [], error: err.message };
    }
  }

  // 7. Métricas
  try {
    const dataPath = path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/metricas.json');
    const rawData = await fs.readFile(dataPath, 'utf8').catch(() => '{}');
    const data = JSON.parse(rawData || '{}');
    const records = Object.entries(data).flatMap(([u, items]) => Array.isArray(items) ? items.map(i => ({ userId: u, ...i })) : []);
    tables.metricas = { name: 'Métricas', records, error: null };
  } catch (err) {
    tables.metricas = { name: 'Métricas', records: [], error: err.message };
  }

  return res.end(JSON.stringify({ ok: true, tables }));
}
