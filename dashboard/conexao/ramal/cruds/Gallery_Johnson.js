import fs from 'node:fs/promises';
import path from 'node:path';

const directory = path.resolve(process.cwd(), 'dashboard/conexao/ramal/cruds/json/user_galleries');
const userFile = (userId) => {
  if (typeof userId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(userId)) throw new Error('Usuário inválido.');
  return path.join(directory, `${userId}.json`);
};
const pending = new Map();
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const merge = (original, changes) => {
  const next = { ...original };
  for (const [field, value] of Object.entries(changes)) {
    if (value === undefined) continue;
    next[field] = isObject(value) && isObject(next[field]) ? merge(next[field], value) : value;
  }
  return next;
};
const read = async (file) => {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
};
const locked = (userId, fn) => {
  const previous = pending.get(userId) || Promise.resolve();
  const task = previous.then(async () => {
    const file = userFile(userId);
    const items = await read(file);
    const result = await fn(items);
    if (result.changed) {
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(file, JSON.stringify(result.items, null, 2), 'utf8');
    }
    return result.value;
  });
  pending.set(userId, task.catch(() => {}));
  return task;
};

export const galleryJohnson = {
  async list(userId) { return read(userFile(userId)); },
  async get(userId, id) { 
    const targetId = String(id);
    return (await this.list(userId)).find(item => String(item.id || item.mediaId) === targetId) || null; 
  },
  create(userId, record) {
    return locked(userId, items => {
      const id = record?.id || record?.mediaId || `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const targetId = String(id);
      if (items.some(item => String(item.id || item.mediaId) === targetId)) throw new Error('ID da galeria inválido ou já utilizado.');
      const saved = { ...record, id, userId };
      return { changed: true, items: [...items, saved], value: saved };
    });
  },
  update(userId, id, changes = {}) {
    const targetId = String(id);
    return locked(userId, items => {
      const index = items.findIndex(item => String(item.id || item.mediaId) === targetId);
      if (index < 0) return { changed: false, value: null };
      // A referência ao arquivo pertence ao upload; editar metadados não pode
      // desvincular a mídia do seu registro documental.
      const protectedFields = ['id', 'mediaId', 'userId', 'filename', 'url', 'publicId', 'assetId', 'deleteToken', 'size', 'mimeType'];
      const updated = merge(items[index], changes);
      for (const field of protectedFields) {
        if (Object.hasOwn(items[index], field)) updated[field] = items[index][field];
        else delete updated[field];
      }
      updated.userId = userId;
      return { changed: true, items: items.map((item, i) => i === index ? updated : item), value: updated };
    });
  },
  delete(userId, id) {
    const targetId = String(id);
    return locked(userId, items => {
      const next = items.filter(item => String(item.id || item.mediaId) !== targetId);
      return { changed: next.length !== items.length, items: next, value: next.length !== items.length };
    });
  },
};
