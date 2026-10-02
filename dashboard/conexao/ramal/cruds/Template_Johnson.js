import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

const root = path.resolve(process.cwd(), 'dashboard/Imagem/template');
const documentFile = path.join(root, 'templates.json');
const inventoryFile = path.join(root, 'inventario.csv');
let pending = Promise.resolve();
const locked = (operation) => {
  const result = pending.then(operation);
  pending = result.catch(() => {});
  return result;
};

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const formatOf = (buffer) => {
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
      buffer.toString('ascii', 12, 16) === 'IHDR') return 'PNG';
  if (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' ||
      buffer.subarray(0, 6).toString('ascii') === 'GIF89a') return 'GIF';
  return null;
};

// No filename from a request or a document may escape the templates directory.
export const templatePhysicalPath = (localPath) => {
  if (typeof localPath !== 'string' || !localPath || localPath.includes('\\') ||
      localPath.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Caminho de template inválido.');
  const resolved = path.resolve(root, localPath);
  if (!resolved.startsWith(root + path.sep) || !/\.(png|gif)$/i.test(resolved)) throw new Error('Caminho de template inválido.');
  return resolved;
};

async function checkedPhysicalPath(localPath) {
  const filename = templatePhysicalPath(localPath);
  const realRoot = await fs.realpath(root);
  const realFile = await fs.realpath(filename);
  if (!realFile.startsWith(realRoot + path.sep) || (await fs.lstat(filename)).isSymbolicLink()) {
    throw new Error('Caminho de template inválido.');
  }
  return filename;
}

function parseCsv(csv) {
  const lines = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (quoted && char === '"' && csv[i + 1] === '"') { field += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(field); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && csv[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(Boolean)) lines.push(row);
      row = [];
    } else field += char;
  }
  if (quoted) throw new Error('Inventário CSV inválido.');
  if (field || row.length) { row.push(field); lines.push(row); }
  const [headers, ...records] = lines;
  return records.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index]])));
}

async function writeDocument(records) {
  const temporary = `${documentFile}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, JSON.stringify(records, null, 2), { flag: 'wx' });
    await fs.rename(temporary, documentFile);
  } catch (error) {
    await fs.unlink(temporary).catch(() => {});
    throw error;
  }
}

async function readDocument() {
  try {
    const records = JSON.parse(await fs.readFile(documentFile, 'utf8'));
    if (!Array.isArray(records)) throw new Error('Johnson Templates inválido.');
    return records;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const inventory = parseCsv(await fs.readFile(inventoryFile, 'utf8'));
  const records = [];
  for (const item of inventory) {
    if (!item.local_path || !item.repository || !item.original_name || !item.format) throw new Error('Inventário incompleto.');
    const filename = await checkedPhysicalPath(item.local_path);
    const contents = await fs.readFile(filename);
    if (formatOf(contents) !== item.format || sha256(contents) !== item.sha256 ||
        path.extname(filename).toLowerCase() !== `.${item.format.toLowerCase()}`) throw new Error(`Asset inválido: ${item.local_path}`);
    const id = `template_${sha256(Buffer.from(`${item.repository}:${item.source_path}`)).slice(0, 20)}`;
    records.push({ id, name: path.parse(item.original_name).name, originalName: item.original_name,
      localPath: item.local_path, url: `/api/templates/assets/${id}`, format: item.format,
      category: item.suggested_category || 'other', role: item.role || '',
      sourceRepository: item.repository, sourcePath: item.source_path,
      sourceCommit: item.source_commit || null, sha256: item.sha256, size: contents.length });
  }
  if (new Set(records.map(record => record.id)).size !== records.length) throw new Error('IDs repetidos no inventário.');
  await writeDocument(records);
  return records;
}

function metadata(changes) {
  if (!changes || typeof changes !== 'object' || Array.isArray(changes) ||
      Object.keys(changes).some(key => !['name', 'category', 'description'].includes(key))) throw new Error('Campos de edição inválidos.');
  const next = {};
  for (const [key, limit] of [['name', 150], ['category', 80], ['description', 1000]]) {
    if (Object.hasOwn(changes, key)) {
      if (typeof changes[key] !== 'string' || (key !== 'description' && !changes[key].trim()) || changes[key].length > limit) throw new Error(`${key} inválido.`);
      next[key] = changes[key].trim();
    }
  }
  return next;
}

export const templateJohnson = {
  list() { return locked(readDocument); },
  get(id) { return locked(async () => (await readDocument()).find(item => item.id === id) || null); },
  async listCategories() {
    try {
      const entries = await fs.readdir(root, { withFileTypes: true });
      const categories = [];
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'uploads') {
          categories.push(entry.name);
        }
      }
      return categories.length ? categories.sort() : ['alerts', 'webcam', 'chat', 'banners', 'tickers', 'events', 'badges', 'overlays', 'widgets', 'animations'];
    } catch {
      return ['alerts', 'webcam', 'chat', 'banners', 'tickers', 'events', 'badges', 'overlays', 'widgets', 'animations'];
    }
  },
  async createCategory(categoryName) {
    if (typeof categoryName !== 'string' || !categoryName.trim()) throw new Error('Nome da categoria/pasta inválido.');
    const cleanCategory = categoryName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    if (!cleanCategory) throw new Error('Nome da categoria/pasta inválido.');
    const targetDir = path.join(root, cleanCategory);
    await fs.mkdir(targetDir, { recursive: true });
    const gitkeep = path.join(targetDir, '.gitkeep');
    try {
      await fs.writeFile(gitkeep, '', { flag: 'wx' });
    } catch {
      // Keep existing .gitkeep if present
    }
    return { category: cleanCategory, categories: await this.listCategories() };
  },
  update(id, changes) {
    return locked(async () => {
      const records = await readDocument();
      const index = records.findIndex(item => item.id === id);
      if (index < 0) return null;
      const updated = { ...records[index], ...metadata(changes) };
      await writeDocument(records.map((item, i) => i === index ? updated : item));
      return updated;
    });
  },
  upload({ filename, fileData, category = 'alerts', name }) {
    return locked(async () => {
      const records = await readDocument();
      const originalName = typeof filename === 'string' ? path.basename(filename) : '';
      const extension = path.extname(originalName).toLowerCase();
      if (!['.png', '.gif'].includes(extension) || typeof fileData !== 'string') {
        throw new Error('este arquivo viola as regras da plataforma, use somente png ou gif!');
      }
      const encoded = fileData.replace(/^data:image\/(?:png|gif);base64,/, '');
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) || encoded.length > 14_000_000) {
        throw new Error('Arquivo inválido ou muito grande.');
      }
      const contents = Buffer.from(encoded, 'base64');
      const format = formatOf(contents);
      if (!format || extension !== `.${format.toLowerCase()}` || !contents.length) {
        throw new Error('este arquivo viola as regras da plataforma, use somente png ou gif!');
      }

      const cleanCategory = (category || 'alerts').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const changes = metadata({ name: name || path.parse(originalName).name, category: cleanCategory });
      const id = `template_${randomUUID()}`;
      const cleanBaseName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const localPath = `${cleanCategory}/${id}_${cleanBaseName}`;
      const target = templatePhysicalPath(localPath);
      const record = { id, ...changes, originalName, localPath, url: `/api/templates/assets/${id}`,
        format, sourceRepository: null, sourcePath: null, sourceCommit: null,
        sha256: sha256(contents), size: contents.length };

      const targetDir = path.dirname(target);
      await fs.mkdir(targetDir, { recursive: true });
      const realTargetDir = await fs.realpath(targetDir);
      const realRoot = await fs.realpath(root);
      if (!realTargetDir.startsWith(realRoot)) {
        throw new Error('Caminho de template inválido.');
      }

      // Ensure .gitkeep exists in category folder
      await fs.writeFile(path.join(targetDir, '.gitkeep'), '', 'utf8').catch(() => {});

      await fs.writeFile(target, contents, { flag: 'wx' });
      try { await writeDocument([...records, record]); }
      catch (error) { await fs.unlink(target).catch(() => {}); throw error; }
      return record;
    });
  },
  delete(id) {
    return locked(async () => {
      const records = await readDocument();
      const item = records.find(record => record.id === id);
      if (!item) return false;
      const filename = await checkedPhysicalPath(item.localPath);
      const contents = await fs.readFile(filename);
      await fs.unlink(filename);
      try { await writeDocument(records.filter(record => record.id !== id)); }
      catch (error) { await fs.writeFile(filename, contents, { flag: 'wx' }).catch(() => {}); throw error; }
      return true;
    });
  },
  async physicalFile(id) {
    const item = await this.get(id);
    if (!item) return null;
    return { record: item, filename: await checkedPhysicalPath(item.localPath) };
  },
};
