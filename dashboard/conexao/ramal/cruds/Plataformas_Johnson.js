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
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Formato de dados inválido em conect-plataform.json');
    }
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') return {};
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

const locked = (fn) => {
  const task = pending.then(fn);
  pending = task.catch(() => {});
  return task;
};

export const PlataformasJohnson = {
  async list(userId) {
    const db = await read();
    const uKey = key(userId);
    const records = db[uKey];
    if (!records) return [];
    if (Array.isArray(records)) {
      if (records.length === 0) return [];
      // Ensure exactly one consolidated record per user
      return [records[0]];
    }
    return [records];
  },

  async get(userId, id) {
    const list = await this.list(userId);
    if (list.length === 0) return null;
    if (id && String(list[0].id) !== String(id)) return null;
    return list[0];
  },

  create(userId, data = {}) {
    return locked(async () => {
      const db = await read();
      const uKey = key(userId);
      let records = db[uKey] || [];
      if (!Array.isArray(records)) records = [];

      let record = records[0] || {
        id: randomUUID(),
        user_id: userId,
        youtube: null,
        youtube_code: null,
        twitch: null,
        twitch_code: null,
        kick: null,
        kick_code: null
      };

      record.user_id = userId;
      if (!record.id) record.id = randomUUID();

      const platform = (data.platform || '').toLowerCase();
      const channelVal = data.channel_name || data.channel_id || data.channel_handle || data.channel || '';
      const codeVal = data.verification_code || data.bio_link_code || data.code || '';

      if (platform === 'twitch') {
        if (channelVal) record.twitch = channelVal;
        if (codeVal) record.twitch_code = codeVal;
        if (data.status) record.twitch_status = data.status;
      } else if (platform === 'youtube' || platform === 'yt') {
        if (channelVal) record.youtube = channelVal;
        if (codeVal) record.youtube_code = codeVal;
        if (data.status) record.youtube_status = data.status;
      } else if (platform === 'kick') {
        if (channelVal) record.kick = channelVal;
        if (codeVal) record.kick_code = codeVal;
        if (data.status) record.kick_status = data.status;
      } else {
        if (data.twitch !== undefined) record.twitch = data.twitch;
        if (data.twitch_code !== undefined) record.twitch_code = data.twitch_code;
        if (data.youtube !== undefined) record.youtube = data.youtube;
        if (data.youtube_code !== undefined) record.youtube_code = data.youtube_code;
        if (data.kick !== undefined) record.kick = data.kick;
        if (data.kick_code !== undefined) record.kick_code = data.kick_code;
      }

      db[uKey] = [record];
      await write(db);
      return record;
    });
  },

  update(userId, id, changes = {}) {
    return locked(async () => {
      const db = await read();
      const uKey = key(userId);
      const records = db[uKey];
      if (!Array.isArray(records) || records.length === 0) {
        // If updating when none exists, create/upsert
        return this.create(userId, changes);
      }

      let record = records[0];
      if (id && String(record.id) !== String(id)) {
        record.id = id;
      }

      const platform = (changes.platform || '').toLowerCase();
      const channelVal = changes.channel_name || changes.channel_id || changes.channel_handle || changes.channel;
      const codeVal = changes.verification_code || changes.bio_link_code || changes.code;

      if (platform === 'twitch') {
        if (channelVal !== undefined) record.twitch = channelVal;
        if (codeVal !== undefined) record.twitch_code = codeVal;
        if (changes.status) record.twitch_status = changes.status;
      } else if (platform === 'youtube' || platform === 'yt') {
        if (channelVal !== undefined) record.youtube = channelVal;
        if (codeVal !== undefined) record.youtube_code = codeVal;
        if (changes.status) record.youtube_status = changes.status;
      } else if (platform === 'kick') {
        if (channelVal !== undefined) record.kick = channelVal;
        if (codeVal !== undefined) record.kick_code = codeVal;
        if (changes.status) record.kick_status = changes.status;
      }

      for (const [k, v] of Object.entries(changes)) {
        if (['id', 'user_id', 'platform', 'channel_name', 'channel_id', 'channel_handle', 'verification_code', 'bio_link_code'].includes(k)) continue;
        if (v !== undefined) {
          record[k] = v;
        }
      }

      record.user_id = userId;
      db[uKey] = [record];
      await write(db);
      return record;
    });
  },

  delete(userId, id) {
    return locked(async () => {
      const db = await read();
      const uKey = key(userId);
      const records = db[uKey];
      if (!Array.isArray(records) || records.length === 0) return false;

      delete db[uKey];
      await write(db);
      return true;
    });
  },

  replace(userId, items) {
    return locked(async () => {
      const db = await read();
      const uKey = key(userId);
      const single = Array.isArray(items) ? (items[0] || null) : items;
      if (!single) {
        delete db[uKey];
      } else {
        db[uKey] = [{
          id: single.id || randomUUID(),
          user_id: userId,
          youtube: single.youtube ?? null,
          youtube_code: single.youtube_code ?? null,
          twitch: single.twitch ?? null,
          twitch_code: single.twitch_code ?? null,
          kick: single.kick ?? null,
          kick_code: single.kick_code ?? null,
          ...single,
          user_id: userId
        }];
      }
      await write(db);
      return db[uKey] || [];
    });
  }
};
