import fs from 'node:fs/promises';
import path from 'node:path';
import { reviewsJohnson } from '../../conexao/ramal/cruds/Review_Johnson.js';
import { messagesJohnson } from '../../conexao/ramal/cruds/Config_MessagesJohnson.js';
import { PlataformasJohnson } from '../../conexao/ramal/cruds/Plataformas_Johnson.js';

async function findPlataformaUserId(recordId) {
  const filePath = path.resolve(process.cwd(), 'dashboard/conexao/ramal/cruds/json/conect-plataform.json');
  const raw = await fs.readFile(filePath, 'utf8').catch(() => '{}');
  let db = {};
  try { db = JSON.parse(raw || '{}'); } catch { db = {}; }
  for (const [userId, items] of Object.entries(db)) {
    if (Array.isArray(items)) {
      if (items.some(item => String(item.id) === String(recordId))) {
        return userId;
      }
    }
  }
  if (db[recordId]) {
    return recordId;
  }
  return null;
}

export async function handleDatabaseRecordAdminRequest(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const isAdmin = String(req.documentUserRole || '').toLowerCase() === 'admin';
  if (!isAdmin) {
    res.statusCode = 403;
    return res.end(JSON.stringify({ ok: false, error: 'Acesso negado.' }));
  }

  const url = new URL(req.url, 'http://localhost');
  const method = req.method;
  const tableId = url.searchParams.get('tableId');
  const recordId = url.searchParams.get('recordId');

  if (!tableId || !recordId) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ ok: false, error: 'Parâmetros tableId e recordId são obrigatórios.' }));
  }

  const cwd = process.cwd();
  
  // Mapeamento dos caminhos físicos dos arquivos das tabelas centralizadas
  const paths = {
    cenarios: path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/cenarios.json'),
    overlays: path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/overlays.json'),
    biblioteca: path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/biblioteca.json'),
    rtcIdentity: path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/rtc_registry.json'),
    templates: path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/templates.json'),
    reviews: path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/reviews.json'),
    contacts: path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/messages.json'),
    plataformas: path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/conect-plataform.json'),
    galeria: path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/galeria.json')
  };

  try {
    let chunks = [];
    if (['POST', 'PATCH'].includes(method)) {
      for await (const chunk of req) chunks.push(chunk);
    }
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};

    // ----------------------------------------------------
    // EXCLUIR REGISTRO (DELETE)
    // ----------------------------------------------------
    if (method === 'DELETE') {
      if (tableId === 'plataformas') {
        const userId = await findPlataformaUserId(recordId);
        if (!userId) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Registro não encontrado.' }));
        }
        const success = await PlataformasJohnson.delete(userId, recordId);
        if (!success) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Registro não encontrado.' }));
        }
        return res.end(JSON.stringify({ ok: true }));
      }

      if (['cenarios', 'overlays'].includes(tableId) || !paths[tableId]) {
        const filePath = paths[tableId] || path.resolve(cwd, `dashboard/conexao/ramal/cruds/json/${tableId}.json`);
        const dataRaw = await fs.readFile(filePath, 'utf8').catch(() => '{}');
        const db = JSON.parse(dataRaw || '{}');
        
        let found = false;
        for (const [userId, items] of Object.entries(db)) {
          if (Array.isArray(items)) {
            const next = items.filter(item => String(item.id) !== String(recordId));
            if (next.length !== items.length) {
              db[userId] = next;
              if (db[userId].length === 0) {
                delete db[userId];
              }
              found = true;
              break;
            }
          }
        }
        // Limpar qualquer outra entrada vazia
        for (const [uId, items] of Object.entries(db)) {
          if (!Array.isArray(items) || items.length === 0) {
            delete db[uId];
          }
        }

        if (!found) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Registro não encontrado.' }));
        }
        await fs.writeFile(filePath, JSON.stringify(db, null, 2), 'utf8');
        return res.end(JSON.stringify({ ok: true }));
      }

      if (tableId === 'biblioteca') {
        const filePath = paths.biblioteca;
        const dataRaw = await fs.readFile(filePath, 'utf8').catch(() => '{}');
        const db = JSON.parse(dataRaw || '{}');
        let found = false;
        for (const userId of Object.keys(db)) {
          for (const category of Object.keys(db[userId])) {
            if (Array.isArray(db[userId][category])) {
              const next = db[userId][category].filter(item => String(item.id) !== String(recordId));
              if (next.length !== db[userId][category].length) {
                db[userId][category] = next;
                const totalLeft = (db[userId].songs?.length || 0) + (db[userId].albums?.length || 0) + (db[userId].artists?.length || 0) + (db[userId].playlists?.length || 0);
                if (totalLeft === 0) {
                  delete db[userId];
                }
                found = true;
                break;
              }
            }
          }
        }
        for (const [uId, data] of Object.entries(db)) {
          const total = (data.songs?.length || 0) + (data.albums?.length || 0) + (data.artists?.length || 0) + (data.playlists?.length || 0);
          if (total === 0) {
            delete db[uId];
          }
        }

        if (!found) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Registro não encontrado.' }));
        }
        await fs.writeFile(filePath, JSON.stringify(db, null, 2), 'utf8');
        return res.end(JSON.stringify({ ok: true }));
      }

      if (tableId === 'rtcIdentity') {
        const filePath = paths.rtcIdentity;
        const dataRaw = await fs.readFile(filePath, 'utf8').catch(() => '{}');
        const db = JSON.parse(dataRaw || '{}');
        let found = false;
        for (const [userId, val] of Object.entries(db)) {
          if (String(val.rtcId) === String(recordId)) {
            delete db[userId];
            found = true;
            break;
          }
        }
        if (!found) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Registro não encontrado.' }));
        }
        await fs.writeFile(filePath, JSON.stringify(db, null, 2), 'utf8');
        return res.end(JSON.stringify({ ok: true }));
      }

      if (tableId === 'templates') {
        const filePath = paths.templates;
        const dataRaw = await fs.readFile(filePath, 'utf8').catch(() => '[]');
        const list = JSON.parse(dataRaw || '[]');
        const next = list.filter(item => String(item.id) !== String(recordId));
        if (next.length === list.length) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Registro não encontrado.' }));
        }
        await fs.writeFile(filePath, JSON.stringify(next, null, 2), 'utf8');
        return res.end(JSON.stringify({ ok: true }));
      }

      if (tableId === 'reviews') {
        const success = await reviewsJohnson.delete(recordId);
        if (!success) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Registro não encontrado.' }));
        }
        return res.end(JSON.stringify({ ok: true }));
      }

      if (tableId === 'contacts') {
        const success = await messagesJohnson.delete(recordId);
        if (!success) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Registro não encontrado.' }));
        }
        return res.end(JSON.stringify({ ok: true }));
      }
    }

    // ----------------------------------------------------
    // DUPLICAR REGISTRO (POST)
    // ----------------------------------------------------
    if (method === 'POST') {
      if (tableId === 'plataformas') {
        res.statusCode = 400;
        return res.end(JSON.stringify({ ok: false, error: 'Conexões de plataformas possuem apenas um registro por usuário e não podem ser duplicadas.' }));
      }

      if (['cenarios', 'overlays'].includes(tableId) || !paths[tableId]) {
        const filePath = paths[tableId] || path.resolve(cwd, `dashboard/conexao/ramal/cruds/json/${tableId}.json`);
        const dataRaw = await fs.readFile(filePath, 'utf8').catch(() => '{}');
        const db = JSON.parse(dataRaw || '{}');
        
        let foundRecord = null;
        let ownerId = null;
        for (const [userId, items] of Object.entries(db)) {
          if (Array.isArray(items)) {
            const found = items.find(item => String(item.id) === String(recordId));
            if (found) {
              foundRecord = found;
              ownerId = userId;
              break;
            }
          }
        }
        if (!foundRecord) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Registro original não encontrado.' }));
        }

        const newRecordId = `${recordId}_copy_${Math.random().toString(36).substring(2, 6)}`;
        const duplicated = {
          ...foundRecord,
          id: newRecordId,
          name: foundRecord.name ? `${foundRecord.name} (Copy)` : 'Cópia',
          updatedAt: new Date().toISOString(),
          created_date: new Date().toISOString()
        };
        db[ownerId] = [...db[ownerId], duplicated];
        await fs.writeFile(filePath, JSON.stringify(db, null, 2), 'utf8');
        return res.end(JSON.stringify({ ok: true, record: duplicated }));
      }

      if (tableId === 'biblioteca') {
        const filePath = paths.biblioteca;
        const dataRaw = await fs.readFile(filePath, 'utf8').catch(() => '{}');
        const db = JSON.parse(dataRaw || '{}');
        let foundRecord = null;
        let ownerId = null;
        let catKey = null;
        for (const userId of Object.keys(db)) {
          for (const category of Object.keys(db[userId])) {
            if (Array.isArray(db[userId][category])) {
              const found = db[userId][category].find(item => String(item.id) === String(recordId));
              if (found) {
                foundRecord = found;
                ownerId = userId;
                catKey = category;
                break;
              }
            }
          }
        }
        if (!foundRecord) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Registro original não encontrado.' }));
        }
        const newRecordId = `${recordId}_copy_${Math.random().toString(36).substring(2, 6)}`;
        const duplicated = {
          ...foundRecord,
          id: newRecordId,
          title: foundRecord.title ? `${foundRecord.title} (Copy)` : 'Cópia',
          name: foundRecord.name ? `${foundRecord.name} (Copy)` : 'Cópia'
        };
        db[ownerId][catKey] = [...db[ownerId][catKey], duplicated];
        await fs.writeFile(filePath, JSON.stringify(db, null, 2), 'utf8');
        return res.end(JSON.stringify({ ok: true, record: duplicated }));
      }

      if (tableId === 'templates') {
        const filePath = paths.templates;
        const dataRaw = await fs.readFile(filePath, 'utf8').catch(() => '[]');
        const list = JSON.parse(dataRaw || '[]');
        const found = list.find(item => String(item.id) === String(recordId));
        if (!found) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Registro original não encontrado.' }));
        }
        const newRecordId = `${recordId}_copy_${Math.random().toString(36).substring(2, 6)}`;
        const duplicated = {
          ...found,
          id: newRecordId,
          name: found.name ? `${found.name} (Copy)` : 'Cópia'
        };
        list.push(duplicated);
        await fs.writeFile(filePath, JSON.stringify(list, null, 2), 'utf8');
        return res.end(JSON.stringify({ ok: true, record: duplicated }));
      }

      if (tableId === 'reviews') {
        const record = await reviewsJohnson.get(recordId);
        if (!record) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Registro original não encontrado.' }));
        }
        const newRecordId = `review_${Math.random().toString(36).substring(2, 10)}`;
        const duplicated = {
          ...record,
          id: newRecordId,
          title: record.title ? `${record.title} (Copy)` : 'Cópia'
        };
        await reviewsJohnson.create(duplicated);
        return res.end(JSON.stringify({ ok: true, record: duplicated }));
      }

      if (tableId === 'contacts') {
        const record = await messagesJohnson.get(recordId);
        if (!record) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Registro original não encontrado.' }));
        }
        const newRecordId = `msg_${Math.random().toString(36).substring(2, 10)}`;
        const duplicated = {
          ...record,
          id: newRecordId,
          name: record.name ? `${record.name} (Copy)` : 'Cópia'
        };
        await messagesJohnson.create(duplicated);
        return res.end(JSON.stringify({ ok: true, record: duplicated }));
      }
    }

    // ----------------------------------------------------
    // EDITAR REGISTRO (PATCH)
    // ----------------------------------------------------
    if (method === 'PATCH') {
      const { updatedRecord } = body;
      if (!updatedRecord) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ ok: false, error: 'updatedRecord é obrigatório.' }));
      }

      if (tableId === 'plataformas') {
        const userId = await findPlataformaUserId(recordId);
        if (!userId) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Registro não encontrado.' }));
        }
        const updated = await PlataformasJohnson.update(userId, recordId, updatedRecord);
        return res.end(JSON.stringify({ ok: true, record: updated }));
      }

      if (['cenarios', 'overlays'].includes(tableId) || !paths[tableId]) {
        const filePath = paths[tableId] || path.resolve(cwd, `dashboard/conexao/ramal/cruds/json/${tableId}.json`);
        const dataRaw = await fs.readFile(filePath, 'utf8').catch(() => '{}');
        const db = JSON.parse(dataRaw || '{}');
        
        let found = false;
        for (const [userId, items] of Object.entries(db)) {
          if (Array.isArray(items)) {
            const idx = items.findIndex(item => String(item.id) === String(recordId));
            if (idx !== -1) {
              items[idx] = { ...items[idx], ...updatedRecord, id: recordId };
              found = true;
              break;
            }
          }
        }
        if (!found) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Registro não encontrado.' }));
        }
        await fs.writeFile(filePath, JSON.stringify(db, null, 2), 'utf8');
        return res.end(JSON.stringify({ ok: true }));
      }

      if (tableId === 'biblioteca') {
        const filePath = paths.biblioteca;
        const dataRaw = await fs.readFile(filePath, 'utf8').catch(() => '{}');
        const db = JSON.parse(dataRaw || '{}');
        let found = false;
        for (const userId of Object.keys(db)) {
          for (const category of Object.keys(db[userId])) {
            if (Array.isArray(db[userId][category])) {
              const idx = db[userId][category].findIndex(item => String(item.id) === String(recordId));
              if (idx !== -1) {
                db[userId][category][idx] = { ...db[userId][category][idx], ...updatedRecord, id: recordId };
                found = true;
                break;
              }
            }
          }
        }
        if (!found) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Registro não encontrado.' }));
        }
        await fs.writeFile(filePath, JSON.stringify(db, null, 2), 'utf8');
        return res.end(JSON.stringify({ ok: true }));
      }

      if (tableId === 'rtcIdentity') {
        const filePath = paths.rtcIdentity;
        const dataRaw = await fs.readFile(filePath, 'utf8').catch(() => '{}');
        const db = JSON.parse(dataRaw || '{}');
        let found = false;
        for (const [userId, val] of Object.entries(db)) {
          if (String(val.rtcId) === String(recordId)) {
            db[userId] = { ...val, ...updatedRecord, rtcId: recordId };
            found = true;
            break;
          }
        }
        if (!found) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Registro não encontrado.' }));
        }
        await fs.writeFile(filePath, JSON.stringify(db, null, 2), 'utf8');
        return res.end(JSON.stringify({ ok: true }));
      }

      if (tableId === 'templates') {
        const filePath = paths.templates;
        const dataRaw = await fs.readFile(filePath, 'utf8').catch(() => '[]');
        const list = JSON.parse(dataRaw || '[]');
        const idx = list.findIndex(item => String(item.id) === String(recordId));
        if (idx === -1) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Registro não encontrado.' }));
        }
        list[idx] = { ...list[idx], ...updatedRecord, id: recordId };
        await fs.writeFile(filePath, JSON.stringify(list, null, 2), 'utf8');
        return res.end(JSON.stringify({ ok: true }));
      }

      if (tableId === 'reviews') {
        const success = await reviewsJohnson.update(recordId, updatedRecord);
        if (!success) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Registro não encontrado.' }));
        }
        return res.end(JSON.stringify({ ok: true }));
      }

      if (tableId === 'contacts') {
        const success = await messagesJohnson.update(recordId, updatedRecord);
        if (!success) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Registro não encontrado.' }));
        }
        return res.end(JSON.stringify({ ok: true }));
      }
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: 'Método não permitido.' }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: err.message }));
  }
}
