import fs from 'node:fs/promises';
import path from 'node:path';

const getPaths = (id) => ({
    schema: path.resolve(process.cwd(), 'dashboard/conexao/ramal/cruds/json/schemas.json'),
    data: path.resolve(process.cwd(), `dashboard/conexao/ramal/cruds/json/${id}.json`)
});

export const createGenericJohnson = (id) => ({
  async list(userId) {
    const data = JSON.parse(await fs.readFile(getPaths(id).data, 'utf8').catch(() => '{}'));
    return data[userId] || [];
  },
  async get(userId, recordId) {
    const list = await this.list(userId);
    return list.find(item => String(item.id) === String(recordId)) || null;
  }
  // Operations (create, update, delete) can be added as FASE 2 progresses
});
