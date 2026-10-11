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

const consolidateUserRecords = (records, userId) => {
  if (!Array.isArray(records) || records.length === 0) return null;
  
  let recordId = null;
  let ytChannel = null;
  let ytCode = null;
  let twChannel = null;
  let twCode = null;
  let kcChannel = null;
  let kcCode = null;
  const extras = {};

  for (const r of records) {
    if (!r || typeof r !== 'object') continue;

    if (r.id) {
      if (recordId && String(recordId) !== String(r.id)) {
        throw new Error(`Conflito de identificador (id) detectado para o usuário ${userId}`);
      }
      recordId = r.id;
    }

    const rYt = r.youtube || (((r.platform || '').toLowerCase() === 'youtube' || (r.platform || '').toLowerCase() === 'yt') ? (r.channel_name || r.channel_id || r.channel_handle || r.channel) : null);
    const rYtCode = r.youtube_code || (((r.platform || '').toLowerCase() === 'youtube' || (r.platform || '').toLowerCase() === 'yt') ? (r.verification_code || r.bio_link_code || r.code) : null);

    if (rYt) {
      if (ytChannel && ytChannel !== rYt) {
        throw new Error(`Conflito detectado: múltiplos valores para o canal YouTube do usuário ${userId}`);
      }
      ytChannel = rYt;
    }
    if (rYtCode) {
      if (ytCode && ytCode !== rYtCode) {
        throw new Error(`Conflito detectado: múltiplos valores para o código YouTube do usuário ${userId}`);
      }
      ytCode = rYtCode;
    }

    const rTw = r.twitch || ((r.platform || '').toLowerCase() === 'twitch' ? (r.channel_name || r.channel_id || r.channel_handle || r.channel) : null);
    const rTwCode = r.twitch_code || ((r.platform || '').toLowerCase() === 'twitch' ? (r.verification_code || r.bio_link_code || r.code) : null);

    if (rTw) {
      if (twChannel && twChannel !== rTw) {
        throw new Error(`Conflito detectado: múltiplos valores para o canal Twitch do usuário ${userId}`);
      }
      twChannel = rTw;
    }
    if (rTwCode) {
      if (twCode && twCode !== rTwCode) {
        throw new Error(`Conflito detectado: múltiplos valores para o código Twitch do usuário ${userId}`);
      }
      twCode = rTwCode;
    }

    const rKc = r.kick || ((r.platform || '').toLowerCase() === 'kick' ? (r.channel_name || r.channel_id || r.channel_handle || r.channel) : null);
    const rKcCode = r.kick_code || ((r.platform || '').toLowerCase() === 'kick' ? (r.verification_code || r.bio_link_code || r.code) : null);

    if (rKc) {
      if (kcChannel && kcChannel !== rKc) {
        throw new Error(`Conflito detectado: múltiplos valores para o canal Kick do usuário ${userId}`);
      }
      kcChannel = rKc;
    }
    if (rKcCode) {
      if (kcCode && kcCode !== rKcCode) {
        throw new Error(`Conflito detectado: múltiplos valores para o código Kick do usuário ${userId}`);
      }
      kcCode = rKcCode;
    }

    for (const [k, v] of Object.entries(r)) {
      if (['id', 'user_id', 'youtube', 'youtube_code', 'twitch', 'twitch_code', 'kick', 'kick_code', 'platform', 'channel_name', 'channel_id', 'channel_handle', 'channel', 'verification_code', 'bio_link_code', 'code'].includes(k)) continue;
      if (v !== undefined && v !== null) {
        if (extras[k] !== undefined && extras[k] !== v) {
          throw new Error(`Conflito detectado no campo ${k} para o usuário ${userId}`);
        }
        extras[k] = v;
      }
    }
  }

  return {
    id: recordId || randomUUID(),
    user_id: userId,
    youtube: ytChannel,
    youtube_code: ytCode,
    twitch: twChannel,
    twitch_code: twCode,
    kick: kcChannel,
    kick_code: kcCode,
    ...extras
  };
};

const upsertRecord = (records, userId, data = {}) => {
  let record = consolidateUserRecords(records, userId) || {
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

  for (const [k, v] of Object.entries(data)) {
    if (['id', 'user_id', 'platform', 'channel_name', 'channel_id', 'channel_handle', 'verification_code', 'bio_link_code'].includes(k)) continue;
    if (v !== undefined) {
      record[k] = v;
    }
  }

  return record;
};

export const PlataformasJohnson = {
  async list(userId) {
    const db = await read();
    const uKey = key(userId);
    const records = db[uKey];
    if (!records) return [];
    if (Array.isArray(records)) {
      if (records.length === 0) return [];
      const consolidated = consolidateUserRecords(records, userId);
      return consolidated ? [consolidated] : [];
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
      const records = db[uKey] || [];
      const record = upsertRecord(records, userId, data);
      db[uKey] = [record];
      await write(db);
      return record;
    });
  },

  update(userId, id, changes = {}) {
    return locked(async () => {
      const db = await read();
      const uKey = key(userId);
      const records = db[uKey] || [];
      const consolidated = consolidateUserRecords(records, userId);

      if (id && consolidated && consolidated.id && String(consolidated.id) !== String(id)) {
        throw new Error('Não é permitido alterar o identificador (id) principal do registro.');
      }
      if (changes.id && consolidated && consolidated.id && String(changes.id) !== String(consolidated.id)) {
        delete changes.id;
      }

      const record = upsertRecord(records, userId, changes);
      if (consolidated && consolidated.id) {
        record.id = consolidated.id;
      } else if (id) {
        record.id = id;
      }
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
      // Validate/consolidate before replacing (will throw if conflicts exist)
      const single = Array.isArray(items) ? consolidateUserRecords(items, userId) : items;
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
