import fs from 'node:fs/promises';
import path from 'node:path';

const file = path.resolve(process.cwd(), 'dashboard/biblioteca/biblioteca.json');
const categories = { song: 'songs', album: 'albums', artist: 'artists', playlist: 'playlists' };
const empty = () => ({ songs: [], albums: [], artists: [], playlists: [] });
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function classifyItemKind(item) {
  if (!item) return 'song';
  const rawType = String(item.type || item.rawRef?.type || '').toLowerCase().trim();
  const id = String(item.id || item.playlistId || item.videoId || item.browseId || '');
  const playlistId = String(item.playlistId || item.rawRef?.playlistId || '');
  const browseId = String(item.browseId || item.rawRef?.browseId || '');

  // 1. Playlists (inclui mixes e playlists da comunidade)
  if (
    rawType === 'playlist' ||
    rawType === 'mix' ||
    rawType === 'community_playlist' ||
    (playlistId && !playlistId.startsWith('OLAK5uy_') && !item.videoId) ||
    id.startsWith('PL') ||
    id.startsWith('RD') ||
    id.startsWith('VLPL') ||
    id.startsWith('VLRD')
  ) {
    return 'playlist';
  }

  // 2. Álbuns
  if (
    rawType === 'album' ||
    rawType === 'mb_release' ||
    rawType === 'lastfm_album' ||
    rawType === 'itunes_album' ||
    rawType === 'bandcamp_album' ||
    playlistId.startsWith('OLAK5uy_') ||
    id.startsWith('OLAK5uy_') ||
    browseId.startsWith('MPRE') ||
    browseId.startsWith('MPSP') ||
    browseId.startsWith('MP')
  ) {
    return 'album';
  }

  // 3. Artistas
  if (
    rawType === 'artist' ||
    rawType === 'mb_artist' ||
    rawType === 'lastfm_artist' ||
    browseId.startsWith('UC') ||
    (id.startsWith('UC') && !item.videoId)
  ) {
    return 'artist';
  }

  // 4. Músicas (padrão)
  return 'song';
}

function normalizeUserLibrary(list) {
  const allEntries = [
    ...(list?.songs || []),
    ...(list?.albums || []),
    ...(list?.artists || []),
    ...(list?.playlists || []),
  ];
  const seen = new Set();
  const normalized = empty();

  for (const item of allEntries) {
    if (!item) continue;
    const stableId = String(
      item.id ||
      item.videoId ||
      item.playlistId ||
      item.browseId ||
      item.rawRef?.videoId ||
      item.rawRef?.playlistId ||
      item.title ||
      ''
    ).trim();
    if (!stableId || seen.has(stableId)) continue;
    seen.add(stableId);

    const kind = classifyItemKind(item);
    const cat = categories[kind] || 'songs';
    const itemWithKind = { ...item, type: kind, id: item.id || stableId };
    normalized[cat].push(itemWithKind);
  }

  return normalized;
}

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
  if (!value) return 'songs';
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
  async list(userId) {
    const raw = (await read())[key(userId)] || empty();
    return normalizeUserLibrary(raw);
  },
  async get(userId, kind, id) {
    const lib = await this.list(userId);
    const targetCat = category(kind);
    const targetId = String(id || '').trim();
    const inCat = lib[targetCat]?.find(item => {
      const matchId = String(item.id || '').trim();
      const matchVid = String(item.videoId || '').trim();
      const matchPid = String(item.playlistId || '').trim();
      const matchBid = String(item.browseId || '').trim();
      const matchRawVid = String(item.rawRef?.videoId || '').trim();
      const matchRawPid = String(item.rawRef?.playlistId || '').trim();
      return (
        (matchId && matchId === targetId) ||
        (matchVid && matchVid === targetId) ||
        (matchPid && matchPid === targetId) ||
        (matchBid && matchBid === targetId) ||
        (matchRawVid && matchRawVid === targetId) ||
        (matchRawPid && matchRawPid === targetId)
      );
    });
    if (inCat) return inCat;
    for (const cat of Object.values(categories)) {
      const found = lib[cat]?.find(item => {
        const matchId = String(item.id || '').trim();
        const matchVid = String(item.videoId || '').trim();
        const matchPid = String(item.playlistId || '').trim();
        const matchBid = String(item.browseId || '').trim();
        const matchRawVid = String(item.rawRef?.videoId || '').trim();
        const matchRawPid = String(item.rawRef?.playlistId || '').trim();
        return (
          (matchId && matchId === targetId) ||
          (matchVid && matchVid === targetId) ||
          (matchPid && matchPid === targetId) ||
          (matchBid && matchBid === targetId) ||
          (matchRawVid && matchRawVid === targetId) ||
          (matchRawPid && matchRawPid === targetId)
        );
      });
      if (found) return found;
    }
    return null;
  },
  create(userId, kind, item) {
    return locked(db => {
      const list = normalizeUserLibrary(db[key(userId)] || empty());
      const resolvedKind = classifyItemKind(item) || kind || 'song';
      const field = category(resolvedKind);
      const stableId = String(
        item?.id ||
        item?.videoId ||
        item?.playlistId ||
        item?.browseId ||
        item?.rawRef?.videoId ||
        item?.rawRef?.playlistId ||
        (item?.title ? String(item.title).toLowerCase().replace(/\s+/g, '_') : '') ||
        Date.now()
      ).trim();

      if (!stableId) {
        throw new Error('ID da biblioteca inválido.');
      }

      const allItems = [...list.songs, ...list.albums, ...list.artists, ...list.playlists];
      const existing = allItems.find(entry => {
        const eid = String(entry.id || '').trim();
        const evid = String(entry.videoId || '').trim();
        const epid = String(entry.playlistId || '').trim();
        const ebid = String(entry.browseId || '').trim();
        const erawvid = String(entry.rawRef?.videoId || '').trim();
        const erawpid = String(entry.rawRef?.playlistId || '').trim();
        return (
          (eid && eid === stableId) ||
          (evid && evid === stableId) ||
          (epid && epid === stableId) ||
          (ebid && ebid === stableId) ||
          (erawvid && erawvid === stableId) ||
          (erawpid && erawpid === stableId)
        );
      });

      if (existing) {
        return { changed: false, value: existing };
      }

      const itemToSave = {
        ...item,
        id: item.id || stableId,
        type: resolvedKind,
      };

      list[field] = [...list[field], itemToSave];
      db[userId] = list;
      return { changed: true, value: itemToSave };
    });
  },
  update(userId, kind, id, changes = {}) {
    return locked(db => {
      const list = normalizeUserLibrary(db[key(userId)] || empty());
      let foundCategory = null;
      let index = -1;
      const targetId = String(id || '').trim();

      for (const cat of Object.values(categories)) {
        const idx = list[cat].findIndex(item => {
          const eid = String(item.id || '').trim();
          const evid = String(item.videoId || '').trim();
          const epid = String(item.playlistId || '').trim();
          const ebid = String(item.browseId || '').trim();
          return (
            (eid && eid === targetId) ||
            (evid && evid === targetId) ||
            (epid && epid === targetId) ||
            (ebid && ebid === targetId)
          );
        });
        if (idx >= 0) {
          foundCategory = cat;
          index = idx;
          break;
        }
      }

      if (index < 0 || !foundCategory) return { changed: false, value: null };
      const original = list[foundCategory][index];
      const updated = { ...merge(original, changes), id: original.id, videoId: original.videoId, playlistId: original.playlistId };
      
      const newKind = classifyItemKind(updated);
      const newCategory = category(newKind);

      if (newCategory === foundCategory) {
        list[foundCategory] = list[foundCategory].map((item, i) => (i === index ? updated : item));
      } else {
        list[foundCategory] = list[foundCategory].filter((_, i) => i !== index);
        list[newCategory] = [...list[newCategory], updated];
      }

      db[userId] = list;
      return { changed: true, value: updated };
    });
  },
  delete(userId, kind, id) {
    return locked(db => {
      const list = normalizeUserLibrary(db[key(userId)] || empty());
      let changed = false;
      const targetId = String(id || '').trim();

      for (const cat of Object.values(categories)) {
        const next = list[cat].filter(item => {
          const matchId = String(item.id || '').trim();
          const matchVid = String(item.videoId || '').trim();
          const matchPid = String(item.playlistId || '').trim();
          const matchBid = String(item.browseId || '').trim();
          const matchRawVid = String(item.rawRef?.videoId || '').trim();
          const matchRawPid = String(item.rawRef?.playlistId || '').trim();
          const matchRawBid = String(item.rawRef?.browseId || '').trim();
          const matchTitle = String(item.title || '').trim();

          const isTarget = Boolean(
            (targetId && matchId && matchId === targetId) ||
            (targetId && matchVid && matchVid === targetId) ||
            (targetId && matchPid && matchPid === targetId) ||
            (targetId && matchBid && matchBid === targetId) ||
            (targetId && matchRawVid && matchRawVid === targetId) ||
            (targetId && matchRawPid && matchRawPid === targetId) ||
            (targetId && matchRawBid && matchRawBid === targetId) ||
            (targetId && matchTitle && matchTitle === targetId)
          );
          return !isTarget;
        });

        if (next.length !== list[cat].length) {
          list[cat] = next;
          changed = true;
        }
      }

      if (changed) db[userId] = list;
      return { changed, value: changed };
    });
  },
};
