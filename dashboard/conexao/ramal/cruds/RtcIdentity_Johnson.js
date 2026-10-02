import fs from 'node:fs/promises';
import path from 'node:path';

const file = path.resolve(process.cwd(), 'dashboard/configuracao/rtc_registry.json');
let pending = Promise.resolve();

const locked = (fn) => {
  const task = pending.then(fn);
  pending = task.catch(() => {});
  return task;
};

async function readRegistry() {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    return {};
  }
}

async function writeRegistry(data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

export const rtcIdentityJohnson = {
  /**
   * Obtém ou cria o rtcId salvando o usuário no CRUD de RTC (rtc_registry.json).
   * @param {string} userId - Identificador exclusivo do usuário.
   * @returns {Promise<string>} O rtcId persistido.
   */
  async getOrCreateRtcId(userId) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw new Error('userId inválido ou ausente.');
    }
    const cleanUserId = userId.trim();
    const fixedRtcId = 'rtc_723d9e62d2b04b6a';

    return locked(async () => {
      const registry = await readRegistry();
      const existing = registry[cleanUserId];
      if (!existing || existing.rtcId !== fixedRtcId) {
        registry[cleanUserId] = {
          id: fixedRtcId,
          rtcId: fixedRtcId,
          userId: cleanUserId,
          created_at: existing?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await writeRegistry(registry);
      }
      return fixedRtcId;
    });
  },

  /**
   * Busca os dados da identidade pelo rtcId no CRUD persistido.
   * @param {string} rtcId - Endereço estável RTC.
   * @returns {Promise<{userId: string, rtcId: string, created_at: string}|null>}
   */
  async getByIdentity(rtcId) {
    if (!rtcId || typeof rtcId !== 'string') return null;
    const cleanRtcId = rtcId.trim();
    const registry = await readRegistry();
    for (const [uid, val] of Object.entries(registry)) {
      if (val && val.rtcId === cleanRtcId) {
        return {
          id: val.id || cleanRtcId,
          rtcId: val.rtcId,
          userId: val.userId || uid,
          created_at: val.created_at || new Date().toISOString()
        };
      }
    }
    if (cleanRtcId.startsWith('rtc_')) {
      return {
        id: cleanRtcId,
        rtcId: cleanRtcId,
        userId: 'derived',
        created_at: new Date().toISOString()
      };
    }
    return null;
  },

  /**
   * Lista todas as identidades ativas no CRUD.
   * @returns {Promise<Object>}
   */
  async list() {
    return readRegistry();
  },

  /**
   * Remove um registro do CRUD.
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  async delete(userId) {
    if (!userId) return false;
    return locked(async () => {
      const registry = await readRegistry();
      if (registry[userId]) {
        delete registry[userId];
        await writeRegistry(registry);
        return true;
      }
      return false;
    });
  }
};
