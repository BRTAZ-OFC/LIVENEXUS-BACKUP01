import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const file = path.resolve(process.cwd(), 'dashboard/configuracao/messages.json');
let pending = Promise.resolve();
const statuses = new Set(['novo', 'lido', 'respondido']);

async function read() {
  try {
    const content = await fs.readFile(file, 'utf8');
    if (!content.trim()) return [];
    return JSON.parse(content);
  }
  catch (error) {
    if (error.code === 'ENOENT') return [];
    if (error instanceof SyntaxError) {
      console.warn(`[Config_MessagesJohnson] Erro de sintaxe detectado em messages.json. Resetando para []. Erro: ${error.message}`);
      // Salva um backup do arquivo corrompido para fins de depuração
      try {
        await fs.copyFile(file, `${file}.corrupt`);
        await fs.writeFile(file, '[]', 'utf8');
      } catch {}
      return [];
    }
    throw error;
  }
}

function write(operation) {
  const task = pending.then(async () => {
    const items = await read();
    const result = operation(items);
    if (result.changed) {
      const temporary = `${file}.${randomUUID()}.tmp`;
      try {
        await fs.writeFile(temporary, JSON.stringify(result.items, null, 2), 'utf8');
        await fs.rename(temporary, file);
      } catch (error) {
        await fs.rm(temporary, { force: true });
        throw error;
      }
    }
    return result.value;
  });
  pending = task.catch(() => {});
  return task;
}

export const messagesJohnson = {
  async list(limit = 500) {
    return (await read()).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, limit);
  },
  async get(id) { return (await read()).find(item => item.id === id) || null; },
  create(data = {}) {
    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim();
    const message = String(data.message || '').trim();
    const category = String(data.category || 'Sugestão');
    if (!name || name.length > 80 || !email || email.length > 200 || !message || message.length > 2000 || category.length > 80) {
      throw new Error('Mensagem inválida.');
    }
    return write(items => {
      const item = { id: `contact_${randomUUID()}`, name, email, category, message, status: 'novo', created_date: new Date().toISOString() };
      return { changed: true, items: [item, ...items], value: item };
    });
  },
  update(id, changes = {}) {
    return write(items => {
      const index = items.findIndex(item => item.id === id);
      if (index < 0) return { changed: false, value: null };
      const updated = { ...items[index] };
      for (const [field, limit] of Object.entries({ name: 80, email: 200, category: 80, message: 2000 })) {
        if (changes[field] === undefined) continue;
        const value = String(changes[field]).trim();
        if (!value || value.length > limit) throw new Error('Mensagem inválida.');
        updated[field] = value;
      }
      if (changes.status !== undefined) {
        if (!statuses.has(changes.status)) throw new Error('Status inválido.');
        updated.status = changes.status;
      }
      updated.updated_date = new Date().toISOString();
      return { changed: true, items: items.map((item, i) => i === index ? updated : item), value: updated };
    });
  },
  delete(id) {
    return write(items => {
      const next = items.filter(item => item.id !== id);
      return { changed: next.length !== items.length, items: next, value: next.length !== items.length };
    });
  },
};
