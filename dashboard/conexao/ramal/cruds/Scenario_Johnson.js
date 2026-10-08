import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const file = path.resolve(process.cwd(), 'dashboard/conexao/ramal/cruds/json/cenarios.json');
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
      console.warn(`[Scenario_Johnson] Erro de sintaxe detectado em cenarios.json. Preservando arquivo original. Erro: ${error.message}`);
      try {
        await fs.copyFile(file, `${file}.corrupt-${Date.now()}`);
      } catch {}
      throw new Error('Banco de dados de cenários corrompido. Recuperação manual necessária.');
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

export const scenarioJohnson = {
  async list(userId) { return (await read())[key(userId)] || []; },
  async get(userId, id) {
    return (await this.list(userId)).find(item => String(item.id) === String(id)) || null;
  },
  create(userId, item) {
    return locked(async () => {
      const db = await read();
      const items = db[key(userId)] || [];
      if (!item?.id || items.some(entry => String(entry.id) === String(item.id))) throw new Error('ID de cenário inválido ou já utilizado.');
      db[userId] = [...items, item];
      await write(db);
      return item;
    });
  },
  update(userId, id, changes = {}) {
    return locked(async () => {
      const db = await read();
      const items = db[key(userId)] || [];
      const index = items.findIndex(item => String(item.id) === String(id));
      if (index < 0) return null;
      const updated = { ...merge(items[index], changes), id: items[index].id };
      db[userId] = items.map((item, i) => i === index ? updated : item);
      await write(db);
      return updated;
    });
  },
  delete(userId, id) {
    return locked(async () => {
      const db = await read();
      const items = db[key(userId)] || [];
      const next = items.filter(item => String(item.id) !== String(id));
      if (next.length === items.length) return false;
      db[userId] = next;
      await write(db);
      return true;
    });
  },
  replace(userId, items) {
    if (!Array.isArray(items) || items.some(item => !item?.id) || new Set(items.map(item => String(item.id))).size !== items.length) {
      throw new Error('Lista de cenários inválida.');
    }
    return locked(async () => {
      const db = await read();
      db[key(userId)] = items;
      await write(db);
      return items;
    });
  },
  async activate(userId, id, subId) {
    const scenario = await this.get(userId, id);
    if (!scenario) return null;
    const active = scenario.subcenarios?.find(item => item.id === subId);
    return this.update(userId, id, {
      activeSubcenarioId: subId,
      ...(active ? { instances: active.instances || [], background: active.background || {} } : {}),
    });
  },
};
