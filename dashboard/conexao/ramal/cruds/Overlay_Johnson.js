import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const file = path.resolve(process.cwd(), 'dashboard/overlays/overlays.json');
let pending = Promise.resolve();
const key = (userId) => {
  if (typeof userId !== 'string' || !userId.trim()) throw new Error('Usuário não identificado.');
  return userId;
};
const read = async () => {
  try {
    const content = await fs.readFile(file, 'utf8');
    if (!content.trim()) return {};
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    if (error instanceof SyntaxError) {
      console.warn(`[Overlay_Johnson] Erro de sintaxe detectado em overlays.json. Preservando arquivo original. Erro: ${error.message}`);
      try {
        await fs.copyFile(file, `${file}.corrupt-${Date.now()}`);
      } catch {}
      throw new Error('Banco de dados de overlays corrompido. Recuperação manual necessária.');
    }
    throw error;
  }
};
const write = async (db) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, JSON.stringify(db, null, 2), 'utf8');
    await fs.rename(temporary, file);
  } catch (error) {
    await fs.rm(temporary, { force: true });
    throw error;
  }
};
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const merge = (original, changes) => {
  const next = { ...original };
  for (const [field, value] of Object.entries(changes)) {
    if (value === undefined) continue;
    next[field] = isObject(value) && isObject(next[field]) ? merge(next[field], value) : value;
  }
  return next;
};
const locked = (fn) => {
  const task = pending.then(fn);
  pending = task.catch(() => {});
  return task;
};

export const overlayJohnson = {
  async list(userId) { return (await read())[key(userId)] || []; },
  async get(userId, id) { return (await this.list(userId)).find(item => item.id === id) || null; },
  create(userId, overlay) {
    return locked(async () => {
      const db = await read();
      const items = db[key(userId)] || [];
      if (!overlay?.id || overlay.id === 'overlay-main' || items.some(item => item.id === overlay.id)) throw new Error('ID de overlay inválido ou já utilizado.');
      db[userId] = [...items, overlay];
      await write(db);
      return overlay;
    });
  },
  update(userId, id, changes = {}) {
    return locked(async () => {
      const db = await read();
      const items = db[key(userId)] || [];
      const index = items.findIndex(item => item.id === id);
      if (index < 0) return null;
      const updated = { ...merge(items[index], changes), id };
      db[userId] = items.map((item, i) => i === index ? updated : item);
      await write(db);
      return updated;
    });
  },
  delete(userId, id) {
    return locked(async () => {
      const db = await read();
      const items = db[key(userId)] || [];
      const next = items.filter(item => item.id !== id);
      if (next.length === items.length) return false;
      db[userId] = next;
      await write(db);
      return true;
    });
  },
};
