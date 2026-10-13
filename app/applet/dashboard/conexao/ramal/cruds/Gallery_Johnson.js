import fs from 'node:fs/promises';
import path from 'node:path';

const directory = path.resolve(process.cwd(), 'dashboard/conexao/ramal/cruds/json/user_galleries');
const generalGalleryFile = path.resolve(process.cwd(), 'dashboard/conexao/ramal/cruds/json/galeria.json');

const userFile = (userId) => {
  if (typeof userId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(userId)) throw new Error('Usuário inválido.');
  return path.join(directory, `${userId}.json`);
};

const pending = new Map();
let generalPending = Promise.resolve();

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

const lockedGeneral = (fn) => {
  const next = generalPending.then(async () => {
    let items = [];
    try {
      const raw = await fs.readFile(generalGalleryFile, 'utf8');
      items = JSON.parse(raw || '[]');
      if (!Array.isArray(items)) items = [];
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      items = [];
    }
    const result = await fn(items);
    if (result.changed) {
      await fs.mkdir(path.dirname(generalGalleryFile), { recursive: true });
      await fs.writeFile(generalGalleryFile, JSON.stringify(result.items, null, 2), 'utf8');
    }
    return result.value;
  });
  generalPending = next.catch(() => {});
  return next;
};

export function generateGeneralGalleryId(filename) {
  if (!filename) return `img_${Date.now()}`;
  const baseName = path.parse(filename).name;
  const slug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return slug.startsWith('img_') ? slug : `img_${slug || Date.now()}`;
}

export const generalGalleryJohnson = {
  async list() {
    try {
      const raw = await fs.readFile(generalGalleryFile, 'utf8');
      const items = JSON.parse(raw || '[]');
      if (!Array.isArray(items)) return [];
      return items.map(item => ({ ...item, userId: null }));
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
  },

  async get(id) {
    const items = await this.list();
    const target = String(id);
    return items.find(item => String(item.id) === target || String(item.filename) === target) || null;
  },

  create(record) {
    return lockedGeneral(items => {
      const filename = record?.filename;
      const id = record?.id || generateGeneralGalleryId(filename);
      const targetId = String(id);
      const cleanBaseName = filename ? path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_') : filename;
      
      const saved = {
        id,
        userId: null,
        filename: cleanBaseName || record?.filename,
        size: typeof record?.size === 'number' ? record.size : 0,
        uploadedAt: record?.uploadedAt || new Date().toISOString(),
        url: record?.url || `/dashboard/Imagem/${cleanBaseName}`,
        ...(record?.title ? { title: record.title } : {}),
        ...(record?.description ? { description: record.description } : {})
      };

      const existingIdx = items.findIndex(item => String(item.id) === targetId || (cleanBaseName && item.filename === cleanBaseName));
      let nextItems;
      if (existingIdx >= 0) {
        nextItems = items.map((item, idx) => idx === existingIdx ? { ...item, ...saved, userId: null } : item);
      } else {
        nextItems = [...items, saved];
      }
      return { changed: true, items: nextItems, value: saved };
    });
  },

  update(id, changes = {}) {
    const targetId = String(id);
    return lockedGeneral(items => {
      const index = items.findIndex(item => String(item.id) === targetId);
      if (index < 0) return { changed: false, value: null };
      const updated = merge(items[index], changes);
      updated.id = items[index].id;
      updated.userId = null;
      return { changed: true, items: items.map((item, i) => i === index ? updated : item), value: updated };
    });
  },

  delete(id) {
    const targetId = String(id);
    return lockedGeneral(items => {
      const next = items.filter(item => String(item.id) !== targetId && String(item.filename) !== targetId);
      return { changed: next.length !== items.length, items: next, value: next.length !== items.length };
    });
  }
};

export const galleryGeneralJohnson = generalGalleryJohnson;

export const galleryJohnson = {
  general: generalGalleryJohnson,

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
