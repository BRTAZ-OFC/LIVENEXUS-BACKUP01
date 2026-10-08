import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const file = path.resolve(process.cwd(), 'dashboard/conexao/ramal/cruds/json/reviews.json');
let pending = Promise.resolve();

async function read() {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
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

const publicReview = ({ id, name, message, rating, created_date }) => ({ id, name, message, rating, created_date });

function allowedFields(data, partial = false) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Avaliação inválida.');
  const result = {};
  for (const [field, length] of Object.entries({ name: 80, email: 200, message: 1000 })) {
    if (partial && data[field] === undefined) continue;
    const value = String(data[field] || '').trim();
    if (!value || value.length > length) throw new Error('Avaliação inválida.');
    result[field] = value;
  }
  if (!partial || data.rating !== undefined) {
    if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) throw new Error('Nota inválida.');
    result.rating = data.rating;
  }
  return result;
}

export const reviewsJohnson = {
  async list(limit = 500, admin = false) {
    const items = (await read()).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, Math.max(0, Math.min(limit, 500)));
    return admin ? items : items.map(publicReview);
  },
  async get(id, admin = false) {
    const review = (await read()).find(item => item.id === id);
    return review ? (admin ? review : publicReview(review)) : null;
  },
  create(data) {
    const values = allowedFields(data);
    return write(items => {
      const item = { ...values, id: `rev_${randomUUID()}`, created_date: new Date().toISOString() };
      return { changed: true, items: [item, ...items], value: publicReview(item) };
    });
  },
  update(id, changes) {
    const values = allowedFields(changes, true);
    return write(items => {
      const index = items.findIndex(item => item.id === id);
      if (index < 0) return { changed: false, value: null };
      const updated = { ...items[index], ...values, updated_date: new Date().toISOString() };
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
