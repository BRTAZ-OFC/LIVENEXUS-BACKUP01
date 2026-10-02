import fs from 'node:fs/promises';
import path from 'node:path';

const file = path.resolve(process.cwd(), 'dashboard/biblioteca/biblioteca.json');
const categories = { song: 'songs', album: 'albums', artist: 'artists', playlist: 'playlists' };
const empty = () => ({ songs: [], albums: [], artists: [], playlists: [] });
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const merge = (original, changes) => {
  const next = { ...original };
  for (const [field, value] of Object.entries(changes)) {
    if (value === undefined) continue;
    next[field] = isObject(value) && isObject(next[field]) ? merge(next[field], value) : value;
  }
  return next;
};
let pending = Promise.resolve();
const key = (userId) => {
  if (typeof userId !== 'string' || !userId.trim()) throw new Error('Usuário não identificado.');
  return userId;
};
const category = (kind) => {
  const value = categories[kind] || (Object.values(categories).includes(kind) ? kind : null);
  if (!value) throw new Error('Tipo de item inválido.');
  return value;
};
const read = async () => {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return {}; throw error; }
};
const locked = (fn) => {
  const task = pending.then(async () => {
    const db = await read();
    const result = await fn(db);
    if (result.changed) await fs.writeFile(file, JSON.stringify(db, null, 2), 'utf8');
    return result.value;
  });
  pending = task.catch(() => {});
  return task;
};

export const libraryJohnson = {
  async list(userId) { return { ...empty(), ...(await read())[key(userId)] }; },
  async get(userId, kind, id) { return (await this.list(userId))[category(kind)].find(item => String(item.id || item.videoId) === String(id)) || null; },
  create(userId, kind, item) {
    return locked(db => {
      const list = db[key(userId)] || empty();
      const field = category(kind);
      const id = item?.id || item?.videoId;
      if (!id || list[field].some(entry => String(entry.id || entry.videoId) === String(id))) throw new Error('ID da biblioteca inválido ou já utilizado.');
      db[userId] = { ...list, [field]: [...list[field], item] };
      return { changed: true, value: item };
    });
  },
  update(userId, kind, id, changes = {}) {
    return locked(db => {
      const list = db[key(userId)] || empty();
      const field = category(kind);
      const index = list[field].findIndex(item => String(item.id || item.videoId) === String(id));
      if (index < 0) return { changed: false, value: null };
      const original = list[field][index];
      const updated = { ...merge(original, changes), id: original.id, videoId: original.videoId };
      db[userId] = { ...list, [field]: list[field].map((item, i) => i === index ? updated : item) };
      return { changed: true, value: updated };
    });
  },
  delete(userId, kind, id) {
    return locked(db => {
      const list = db[key(userId)] || empty();
      const field = category(kind);
      const next = list[field].filter(item => String(item.id || item.videoId) !== String(id));
      const changed = next.length !== list[field].length;
      if (changed) db[userId] = { ...list, [field]: next };
      return { changed, value: changed };
    });
  },
};
