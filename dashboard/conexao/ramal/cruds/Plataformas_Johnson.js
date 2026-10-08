import fs from 'node:fs/promises';
import path from 'node:path';

const file = path.resolve(process.cwd(), 'dashboard/conexao/ramal/cruds/json/conect-plataform.json');

async function read() {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}

async function write(operation) {
  const items = await read();
  const result = operation(items);
  await fs.writeFile(file, JSON.stringify(result, null, 2));
  return result;
}

export const PlataformasJohnson = {
  list: async () => await read(),
  create: async (data) => await write((items) => [...items, { ...data, id: data.id || crypto.randomUUID(), created_at: new Date().toISOString() }]),
  update: async (id, data) => await write((items) => items.map(i => i.id === id ? { ...i, ...data } : i)),
  delete: async (id) => await write((items) => items.filter(i => i.id !== id))
};
