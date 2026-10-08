import fs from 'node:fs/promises';
import path from 'node:path';

const safeCwd = (typeof process !== 'undefined' && typeof process.cwd === 'function') ? process.cwd() : '';
const file = path.resolve(safeCwd, 'dashboard/conexao/ramal/cruds/json/auth_activation.json');
let pending = Promise.resolve();

const read = async () => {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return {}; throw error; }
};

const write = (db) => fs.writeFile(file, JSON.stringify(db, null, 2), 'utf8');

const locked = (fn) => {
  const task = pending.then(fn);
  pending = task.catch(() => {});
  return task;
};

export const authJohnson = {
  // Cria ou atualiza um código de ativação para um e-mail
  async createActivation(email, code, expiresAt) {
    return locked(async () => {
      const db = await read();
      db[email] = { code, expiresAt, created_at: new Date().toISOString() };
      await write(db);
      return db[email];
    });
  },

  // Busca e valida um código de ativação
  async getActivation(email) {
    return locked(async () => {
      const db = await read();
      const entry = db[email];
      console.log(`[AuthJohnson] getActivation for ${email}:`, JSON.stringify(entry));
      
      if (!entry) return null;
      
      // Verifica expiração
      const now = new Date();
      const expiry = new Date(entry.expiresAt);
      if (expiry < now) {
        console.log(`[AuthJohnson] Code EXPIRED for ${email}. Expiry: ${entry.expiresAt}, Now: ${now.toISOString()}`);
        delete db[email];
        await write(db);
        return null;
      }
      
      return entry;
    });
  },

  // Deleta um código após o uso
  async deleteActivation(email) {
    return locked(async () => {
      const db = await read();
      if (db[email]) {
        delete db[email];
        await write(db);
        return true;
      }
      return false;
    });
  }
};
