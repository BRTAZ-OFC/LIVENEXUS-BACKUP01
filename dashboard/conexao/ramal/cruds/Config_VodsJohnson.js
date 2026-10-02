import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const directory = path.resolve(process.cwd(), 'dashboard/configuracao/vods');
const pending = new Map();
function fileFor(userId) {
  if (typeof userId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(userId)) throw new Error('Usuário inválido.');
  return path.join(directory, `${userId}.json`);
}

async function read(userId) {
  try { return JSON.parse(await fs.readFile(fileFor(userId), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}

function write(userId, operation) {
  const task = (pending.get(userId) || Promise.resolve()).then(async () => {
    const items = await read(userId);
    const result = operation(items);
    if (result.changed) {
      const target = fileFor(userId);
      const temporary = `${target}.${randomUUID()}.tmp`;
      await fs.mkdir(directory, { recursive: true });
      try {
        await fs.writeFile(temporary, JSON.stringify(result.items, null, 2), 'utf8');
        await fs.rename(temporary, target);
      } catch (error) {
        await fs.rm(temporary, { force: true });
        throw error;
      }
    }
    return result.value;
  });
  pending.set(userId, task.catch(() => {}));
  return task;
}

export const vodsJohnson = {
  async list(userId, filter = {}, limit = 50) {
    let items = await read(userId);
    if (filter.vodStatus) items = items.filter(item => item.vodStatus === filter.vodStatus);
    return items.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, limit);
  },
  async get(userId, id) { return (await read(userId)).find(item => item.id === id) || null; },
  create(userId, data = {}) {
    if (!data || typeof data !== 'object' || Array.isArray(data) || !String(data.title || '').trim()) throw new Error('LiveSession inválida.');
    // A UI só oferece Salvar após a descoberta confirmar um VOD. A pendência
    // breve continua sendo tratada por recheckPendingSessions, sem promover
    // um registro não confirmado a VOD disponível.
    if (!['available', 'pending'].includes(data.vodStatus) || (data.vodStatus === 'available' && !data.vodId && !data.streamUrl)) {
      throw new Error('VOD não confirmado.');
    }
    return write(userId, items => {
      const item = { ...data, id: `session_${randomUUID()}`, userId, created_by_id: userId, created_date: new Date().toISOString() };
      return { changed: true, items: [item, ...items], value: item };
    });
  },
  update(userId, id, changes = {}) {
    if (!changes || typeof changes !== 'object' || Array.isArray(changes)) throw new Error('Alteração inválida.');
    return write(userId, items => {
      const index = items.findIndex(item => item.id === id);
      if (index < 0) return { changed: false, value: null };
      const updated = { ...items[index], ...changes, id, userId, created_by_id: userId, created_date: items[index].created_date, updated_date: new Date().toISOString() };
      if (!['available', 'pending', 'unavailable'].includes(updated.vodStatus)) throw new Error('Status de VOD inválido.');
      if (updated.vodStatus === 'available' && !updated.vodId && !updated.streamUrl) throw new Error('VOD não confirmado.');
      return { changed: true, items: items.map((item, i) => i === index ? updated : item), value: updated };
    });
  },
  delete(userId, id) {
    return write(userId, items => {
      const next = items.filter(item => item.id !== id);
      return { changed: next.length !== items.length, items: next, value: next.length !== items.length };
    });
  },
};
