import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAuthorizedUserId } from '../../api/auth/accessValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// O caminho absoluto para o banco de dados JSON de cenários
const CENARIOS_FILE_PATH = path.resolve(__dirname, './cenarios.json');

export async function readCenarios(userId) {
  try {
    if (!fs.existsSync(CENARIOS_FILE_PATH)) {
      return [];
    }
    const data = await fs.promises.readFile(CENARIOS_FILE_PATH, 'utf-8');
    const db = JSON.parse(data || '{}');
    return db[userId] || [];
  } catch (err) {
    console.error('Erro ao ler cenários:', err);
    return [];
  }
}

export async function writeCenarios(userId, cenariosList) {
  try {
    let db = {};
    if (fs.existsSync(CENARIOS_FILE_PATH)) {
      const data = await fs.promises.readFile(CENARIOS_FILE_PATH, 'utf-8');
      db = JSON.parse(data || '{}');
    }
    db[userId] = cenariosList;
    await fs.promises.writeFile(CENARIOS_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Erro ao salvar cenários:', err);
    return false;
  }
}

async function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => {
      resolve({});
    });
  });
}

function mergeChanges(original, changes) {
  const next = { ...original };
  for (const [field, value] of Object.entries(changes)) {
    if (value === undefined) continue;
    next[field] = value && typeof value === 'object' && !Array.isArray(value) &&
      next[field] && typeof next[field] === 'object' && !Array.isArray(next[field])
      ? mergeChanges(next[field], value) : value;
  }
  return next;
}

export async function handleCenariosRequest(req, res) {
  res.setHeader('Content-Type', 'application/json');

  const urlObj = new URL(req.url, 'http://localhost:3000');
  const scenarioId = urlObj.searchParams.get('scenarioId');
  const userId = getAuthorizedUserId(req);

  // Requisições públicas GET por scenarioId são permitidas sem autenticação (Receiver/OBS/mobile)
  if (!userId && !(req.method === 'GET' && scenarioId)) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ ok: false, error: 'Usuário não identificado ou sessão expirada.' }));
  }

  if (scenarioId) {
    if (req.method === 'PATCH') {
      try {
        const { changes } = await readBody(req);
        if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ ok: false, error: 'Alterações inválidas.' }));
        }
        const cenarios = await readCenarios(userId);
        const index = cenarios.findIndex(item => String(item.id) === String(scenarioId));
        if (index < 0) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Cenário não encontrado.' }));
        }
        const cenario = { ...mergeChanges(cenarios[index], changes), id: cenarios[index].id };
        cenarios[index] = cenario;
        if (!await writeCenarios(userId, cenarios)) {
          res.statusCode = 500;
          return res.end(JSON.stringify({ ok: false, error: 'Erro ao salvar cenário.' }));
        }
        res.statusCode = 200;
        return res.end(JSON.stringify({ ok: true, cenario }));
      } catch (err) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
      }
    }
    if (req.method === 'DELETE') {
      try {
        const cenarios = await readCenarios(userId);
        const next = cenarios.filter(item => String(item.id) !== String(scenarioId));
        if (next.length === cenarios.length) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Cenário não encontrado.' }));
        }
        if (!await writeCenarios(userId, next)) {
          res.statusCode = 500;
          return res.end(JSON.stringify({ ok: false, error: 'Erro ao remover cenário.' }));
        }
        res.statusCode = 200;
        return res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
      }
    }
    if (req.method === 'GET') {
      try {
        if (scenarioId && (scenarioId.startsWith('overlay_') || scenarioId.startsWith('overlay-') || scenarioId === 'overlay-main')) {
          const { overlayJohnson } = await import('../../conexao/ramal/cruds/Overlay_Johnson.js');
          let foundOverlay = null;
          if (userId) {
            foundOverlay = await overlayJohnson.get(userId, scenarioId);
          } else {
            const fsPromises = await import('node:fs/promises');
            const pathModule = await import('node:path');
            const file = pathModule.resolve(process.cwd(), 'dashboard/overlays/overlays.json');
            try {
              const dataText = await fsPromises.readFile(file, 'utf8');
              const dbOverlays = JSON.parse(dataText || '{}');
              for (const userKey of Object.keys(dbOverlays)) {
                const found = dbOverlays[userKey]?.find(item => item.id === scenarioId);
                if (found) {
                  foundOverlay = found;
                  break;
                }
              }
            } catch (e) {
              // ignore
            }
          }

          if (foundOverlay) {
            const cenarioMapped = {
              id: foundOverlay.id,
              name: foundOverlay.name,
              visualizerSize: foundOverlay.visualizerSize,
              activeSubcenarioId: 'default',
              subcenarios: [
                {
                  id: 'default',
                  name: 'Principal',
                  background: foundOverlay.background,
                  instances: foundOverlay.instances
                }
              ]
            };
            res.statusCode = 200;
            return res.end(JSON.stringify({ ok: true, cenario: cenarioMapped }));
          } else {
            res.statusCode = 404;
            return res.end(JSON.stringify({ ok: false, error: 'Overlay não encontrado.' }));
          }
        }

        if (!fs.existsSync(CENARIOS_FILE_PATH)) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Nenhum cenário cadastrado.' }));
        }
        const data = await fs.promises.readFile(CENARIOS_FILE_PATH, 'utf-8');
        const db = JSON.parse(data || '{}');

        let foundCenario = null;
        // Se houver userId autorizado, priorizamos buscar apenas nos cenários DELE
        if (userId) {
          const userCenarios = db[userId] || [];
          foundCenario = userCenarios.find((c) => String(c.id) === String(scenarioId));
        }

        // Se não encontrou no usuário autorizado (ou se for admin sem userId na URL), 
        // buscamos globalmente (necessário para Receiver público)
        if (!foundCenario) {
          for (const userKey of Object.keys(db)) {
            const userCenarios = db[userKey] || [];
            const found = userCenarios.find((c) => String(c.id) === String(scenarioId));
            if (found) {
              foundCenario = found;
              break;
            }
          }
        }

        if (foundCenario) {
          res.statusCode = 200;
          return res.end(JSON.stringify({ ok: true, cenario: foundCenario }));
        }

        // Fallback final: verificar se o ID pertence a uma Overlay em overlays.json
        try {
          const fsPromises = await import('node:fs/promises');
          const pathModule = await import('node:path');
          const file = pathModule.resolve(process.cwd(), 'dashboard/overlays/overlays.json');
          const dataText = await fsPromises.readFile(file, 'utf8');
          const dbOverlays = JSON.parse(dataText || '{}');
          let fallbackOverlay = null;
          if (userId && dbOverlays[userId]) {
            fallbackOverlay = dbOverlays[userId].find(item => String(item.id) === String(scenarioId));
          }
          if (!fallbackOverlay) {
            for (const userKey of Object.keys(dbOverlays)) {
              const found = dbOverlays[userKey]?.find(item => String(item.id) === String(scenarioId));
              if (found) {
                fallbackOverlay = found;
                break;
              }
            }
          }
          if (fallbackOverlay) {
            const cenarioMapped = {
              id: fallbackOverlay.id,
              name: fallbackOverlay.name,
              visualizerSize: fallbackOverlay.visualizerSize,
              activeSubcenarioId: 'default',
              subcenarios: [
                {
                  id: 'default',
                  name: 'Principal',
                  background: fallbackOverlay.background,
                  instances: fallbackOverlay.instances
                }
              ]
            };
            res.statusCode = 200;
            return res.end(JSON.stringify({ ok: true, cenario: cenarioMapped }));
          }
        } catch {
          // ignore
        }

        res.statusCode = 404;
        return res.end(JSON.stringify({ ok: false, error: 'Cenário não encontrado.' }));
      } catch (err) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
      }
    } else if (req.method === 'POST') {
      try {
        if (!fs.existsSync(CENARIOS_FILE_PATH)) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Nenhum cenário cadastrado.' }));
        }

        const body = await readBody(req);
        const { activeSubcenarioId } = body;

        if (!activeSubcenarioId) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ ok: false, error: 'ID do subcenário não informado.' }));
        }

        const data = await fs.promises.readFile(CENARIOS_FILE_PATH, 'utf-8');
        const db = JSON.parse(data || '{}');

        let updated = false;
        // Priorizar o userId autorizado
        if (userId && db[userId]) {
          const userCenarios = db[userId] || [];
          const index = userCenarios.findIndex((c) => String(c.id) === String(scenarioId));
          if (index !== -1) {
            userCenarios[index].activeSubcenarioId = activeSubcenarioId;
            const activeSub = userCenarios[index].subcenarios?.find(s => s.id === activeSubcenarioId);
            if (activeSub) {
              userCenarios[index].instances = activeSub.instances || [];
              userCenarios[index].background = activeSub.background || {};
            }
            db[userId] = userCenarios;
            updated = true;
          }
        }

        // Se não atualizou, tenta busca global (para compatibilidade/admin)
        if (!updated) {
          for (const userKey of Object.keys(db)) {
            const userCenarios = db[userKey] || [];
            const index = userCenarios.findIndex((c) => String(c.id) === String(scenarioId));
            if (index !== -1) {
              userCenarios[index].activeSubcenarioId = activeSubcenarioId;
              const activeSub = userCenarios[index].subcenarios?.find(s => s.id === activeSubcenarioId);
              if (activeSub) {
                userCenarios[index].instances = activeSub.instances || [];
                userCenarios[index].background = activeSub.background || {};
              }
              db[userKey] = userCenarios;
              updated = true;
              break;
            }
          }
        }

        if (updated) {
          await fs.promises.writeFile(CENARIOS_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
          res.statusCode = 200;
          return res.end(JSON.stringify({ ok: true, activeSubcenarioId }));
        } else {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Cenário não encontrado.' }));
        }
      } catch (err) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
      }
    } else {
      res.statusCode = 405;
      return res.end(JSON.stringify({ ok: false, error: 'Método não permitido para busca por ID.' }));
    }
  }

  if (req.method === 'GET') {
    const cenarios = await readCenarios(userId);
    res.statusCode = 200;
    return res.end(JSON.stringify({ ok: true, cenarios }));
  }

  if (req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { cenarios } = body;
      if (!Array.isArray(cenarios)) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ ok: false, error: 'Lista de cenários inválida.' }));
      }

      const success = await writeCenarios(userId, cenarios);
      if (success) {
        res.statusCode = 200;
        return res.end(JSON.stringify({ ok: true }));
      } else {
        res.statusCode = 500;
        return res.end(JSON.stringify({ ok: false, error: 'Erro ao salvar cenários no banco de dados.' }));
      }
    } catch (err) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
    }
  }

  res.statusCode = 405;
  return res.end(JSON.stringify({ ok: false, error: 'Método não permitido.' }));
}
