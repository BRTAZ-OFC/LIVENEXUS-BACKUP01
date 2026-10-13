import fs from 'node:fs/promises';
import path from 'node:path';

const file = path.resolve(process.cwd(), 'dashboard/conexao/ramal/cruds/json/metricas.json');
let pending = Promise.resolve();

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

async function read() {
  try {
    const content = await fs.readFile(file, 'utf8');
    if (!content.trim()) return {};
    return JSON.parse(content);
  }
  catch (error) {
    if (error.code === 'ENOENT') return {};
    if (error instanceof SyntaxError) {
      console.warn(`[MetricasJohnson] Erro de sintaxe detectado em metricas.json.`);
      throw new Error('Banco de dados corrompido.');
    }
    throw error;
  }
}

function write(operation) {
  const task = pending.then(async () => {
    const db = await read();
    const result = operation(db);
    if (result.changed) {
      const temporary = `${file}.${generateId()}.tmp`;
      try {
        await fs.writeFile(temporary, JSON.stringify(result.db, null, 2), 'utf8');
        await fs.rename(temporary, file);
      } catch (error) {
        await fs.rm(temporary, { force: true });
        throw error;
      }
    }
    return result.value;
  });
  pending = task.catch(() => {});
  return task;
}

export const metricasJohnson = {
  async list(userId, limit = 1000) {
    const db = await read();
    const items = db[userId] || [];
    return items
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, limit);
  },
  async get(userId, id) {
    const db = await read();
    const items = db[userId] || [];
    return items.find(item => item.id === id) || null;
  },
  create(userId, data = {}) {
    return write(db => {
      const items = db[userId] || [];
      const item = { 
        ...data, 
        id: `metrica_${generateId()}`, 
        userId, 
        created_date: new Date().toISOString() 
      };
      db[userId] = [item, ...items];
      return { changed: true, db, value: item };
    });
  },
  update(userId, id, changes = {}) {
    return write(db => {
      const items = db[userId] || [];
      const index = items.findIndex(item => item.id === id);
      if (index < 0) return { changed: false, value: null };
      const updated = { 
        ...items[index], 
        ...changes, 
        id, 
        userId, 
        updated_date: new Date().toISOString() 
      };
      db[userId] = items.map((item, i) => i === index ? updated : item);
      return { changed: true, db, value: updated };
    });
  },
  delete(userId, id) {
    return write(db => {
      const items = db[userId] || [];
      const next = items.filter(item => item.id !== id);
      if (next.length === items.length) return { changed: false, value: false };
      db[userId] = next;
      return { changed: true, db, value: true };
    });
  },
};
