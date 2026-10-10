import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const file = path.resolve(process.cwd(), 'dashboard/conexao/ramal/cruds/json/conect-plataform.json');
let pending = Promise.resolve();

const key = (userId) => {
  if (typeof userId !== 'string' || !userId.trim()) throw new Error('Usuário não identificado.');
  return userId;
};

const read = async () => {
  try {
    const content = await fs.readFile(file, 'utf8');
    if (!content.trim()) return {};
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return {};
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    if (error instanceof SyntaxError) {
      console.warn(`[Plataformas_Johnson] Erro de sintaxe detectado em conect-plataform.json. Preservando arquivo original.`);
      try {
        await fs.copyFile(file, `${file}.corrupt-${Date.now()}`);
      } catch {}
      return {};
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

export const PlataformasJohnson = {
  async list(userId) {
    return (await read())[key(userId)] || [];
  },
  async get(userId, id) {
    return (await this.list(userId)).find(item => String(item.id) === String(id)) || null;
  },
  create(userId, item) {
    return locked(async () => {
      const db = await read();
      const uKey = key(userId);
      const items = db[uKey] || [];
      const record = {
        id: item?.id || randomUUID(),
        user_id: userId,
        platform: item?.platform || 'Twitch',
        channel_id: item?.channel_id || '',
        channel_name: item?.channel_name || '',
        channel_handle: item?.channel_handle || '',
        verification_code: item?.verification_code || '',
        bio_link_code: item?.bio_link_code || '',
        status: item?.status || 'pending',
        created_at: item?.created_at || new Date().toISOString(),
        verified_at: item?.verified_at || null,
        unlinked_at: item?.unlinked_at || null,
        ...item
      };
      db[uKey] = [...items, record];
      await write(db);
      return record;
    });
  },
  update(userId, id, changes = {}) {
    return locked(async () => {
      const db = await read();
      const uKey = key(userId);
      const items = db[uKey] || [];
      const index = items.findIndex(item => String(item.id) === String(id));
      if (index < 0) return null;
      const updated = { ...merge(items[index], changes), id: items[index].id, user_id: userId };
      db[uKey] = items.map((item, i) => i === index ? updated : item);
      await write(db);
      return updated;
    });
  },
  delete(userId, id) {
    return locked(async () => {
      const db = await read();
      const uKey = key(userId);
      const items = db[uKey] || [];
      const next = items.filter(item => String(item.id) !== String(id));
      if (next.length === items.length) return false;
      db[uKey] = next;
      await write(db);
      return true;
    });
  },
  replace(userId, items) {
    if (!Array.isArray(items)) {
      throw new Error('Lista de plataformas inválida.');
    }
    return locked(async () => {
      const db = await read();
      db[key(userId)] = items;
      await write(db);
      return items;
    });
  }
};
