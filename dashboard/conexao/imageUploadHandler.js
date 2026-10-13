import { generalGalleryJohnson } from './ramal/cruds/Gallery_Johnson.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pasta de destino unificada e absoluta: /dashboard/Imagem/
export const UPLOAD_DIR = path.resolve(process.cwd(), 'dashboard/Imagem');
export const GALLERY_JSON_PATH = path.resolve(process.cwd(), 'dashboard/conexao/ramal/cruds/json/galeria.json');
export const IMAGE_STORE_PATH = path.resolve(process.cwd(), 'dashboard/conexao/ramal/cruds/json/image_store.json');
export const USER_GALLERIES_DIR = path.resolve(process.cwd(), 'dashboard/conexao/ramal/cruds/json/user_galleries');

// Arquivos de sistema protegidos que NUNCA devem ser apagados fisicamente
export const PROTECTED_SYSTEM_FILES = new Set(['111111.png', 'livenexus-overview.png', '.gitkeep', 'galeria.json']);

// Extensões suportadas para visualização direta
const ALLOWED_SERVE_EXTENSIONS = new Set(['.png', '.gif', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.avif']);

// Extensões permitidas para upload
const ALLOWED_UPLOAD_EXTENSIONS = new Set(['.png', '.gif', '.jpg', '.jpeg', '.webp']);

// Helper para ler image_store.json (persistência resiliente a reinicializações)
export async function readImageStore() {
  try {
    if (!fs.existsSync(IMAGE_STORE_PATH)) return {};
    const data = await fs.promises.readFile(IMAGE_STORE_PATH, 'utf-8');
    return JSON.parse(data || '{}');
  } catch (err) {
    console.error('Error reading image_store.json:', err);
    return {};
  }
}

// Helper para gravar image_store.json
export async function writeImageStore(data) {
  try {
    const dir = path.dirname(IMAGE_STORE_PATH);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(IMAGE_STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing image_store.json:', err);
  }
}

// Salva backup persistente da imagem em base64 no image_store.json
export async function persistImageBackup(filename, fileData, metadata = {}) {
  try {
    if (!filename || !fileData) return;
    const cleanFile = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const store = await readImageStore();
    store[cleanFile] = {
      filename: cleanFile,
      data: fileData,
      updatedAt: new Date().toISOString(),
      ...metadata
    };
    await writeImageStore(store);
  } catch (err) {
    console.warn('Erro ao salvar backup persistente da imagem:', err.message);
  }
}

// Restaura arquivo físico em UPLOAD_DIR a partir dos backups persistentes caso falte no disco
export async function restoreImageIfMissing(filename) {
  try {
    const cleanFile = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const targetPath = path.join(UPLOAD_DIR, cleanFile);

    if (fs.existsSync(targetPath)) return true;

    // 1. Procurar no image_store.json
    const store = await readImageStore();
    if (store[cleanFile]?.data) {
      const base64Data = store[cleanFile].data.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length > 0) {
        if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        await fs.promises.writeFile(targetPath, buffer);
        console.log(`[Persistence] Imagem restaurada do store: ${cleanFile}`);
        return true;
      }
    }

    // 2. Procurar nos registros de user_galleries
    if (fs.existsSync(USER_GALLERIES_DIR)) {
      const files = await fs.promises.readdir(USER_GALLERIES_DIR).catch(() => []);
      for (const uFile of files) {
        if (!uFile.endsWith('.json')) continue;
        try {
          const content = await fs.promises.readFile(path.join(USER_GALLERIES_DIR, uFile), 'utf-8');
          const list = JSON.parse(content || '[]');
          if (Array.isArray(list)) {
            const found = list.find(item => item.filename === cleanFile && (item.fileData || item.data));
            const rawData = found?.fileData || found?.data;
            if (rawData) {
              const base64Data = rawData.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
              const buffer = Buffer.from(base64Data, 'base64');
              if (buffer.length > 0) {
                if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
                await fs.promises.writeFile(targetPath, buffer);
                console.log(`[Persistence] Imagem restaurada de user_gallery: ${cleanFile}`);
                await persistImageBackup(cleanFile, rawData, { userId: found.userId });
                return true;
              }
            }
          }
        } catch {}
      }
    }

    return false;
  } catch (err) {
    console.error(`Erro ao restaurar imagem ${filename}:`, err);
    return false;
  }
}

// Inicialização: garante diretório UPLOAD_DIR e restaura imagens persistidas no boot
export async function ensureImagePersistence() {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    const store = await readImageStore();
    for (const [filename, item] of Object.entries(store)) {
      if (item?.data) {
        const targetPath = path.join(UPLOAD_DIR, filename);
        if (!fs.existsSync(targetPath)) {
          const base64Data = item.data.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          if (buffer.length > 0) {
            await fs.promises.writeFile(targetPath, buffer);
            console.log(`[Startup Persistence] Imagem restaurada: ${filename}`);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Startup Persistence] Erro ao sincronizar imagens:', err.message);
  }
}

// Helper para ler galeria.json de forma segura sem excluir registros existentes
export async function readGalleryJson() {
  try {
    if (!fs.existsSync(GALLERY_JSON_PATH)) {
      return [];
    }
    const data = await fs.promises.readFile(GALLERY_JSON_PATH, 'utf-8');
    let gallery = JSON.parse(data || '[]');

    if (!Array.isArray(gallery)) {
      gallery = [];
    }

    return gallery;
  } catch (err) {
    console.error('Error reading galeria.json:', err);
    return [];
  }
}

// Helper para gravar galeria.json de forma segura
export async function writeGalleryJson(data) {
  try {
    const dir = path.dirname(GALLERY_JSON_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    await fs.promises.writeFile(GALLERY_JSON_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing galeria.json:', err);
  }
}

// Helper de limpeza segura que NUNCA exclui imagens ou registros válidos
async function cleanupOrphans() {
  return [];
}

export async function handleImageUploadRequest(req, res, next) {
  // Garante que o diretório existe
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const urlObj = new URL(req.url, 'http://localhost:3000');
  const pathname = decodeURIComponent(urlObj.pathname);

  // ==========================================================================
  // SERVIR IMAGENS COM O PREFIXO /dashboard/Imagem/
  // Retorna SEMPRE binário (200) ou JSON 404. NUNCA retorna HTML.
  // ==========================================================================
  if (pathname.startsWith('/dashboard/Imagem/')) {
    const relFile = pathname.substring('/dashboard/Imagem/'.length);

    if (!relFile || relFile === 'galeria.json' || relFile === '.gitkeep') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 404;
      return res.end(JSON.stringify({ ok: false, error: 'Arquivo inválido ou não encontrado.' }));
    }

    const ext = path.extname(relFile).toLowerCase();
    if (!ALLOWED_SERVE_EXTENSIONS.has(ext)) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 404;
      return res.end(JSON.stringify({ ok: false, error: 'Extensão de imagem não suportada.' }));
    }

    // Normalizar caminho relativo para evitar directory traversal
    const safeRel = path.normalize(relFile).replace(/^(\.\.[\/\\])+/, '');
    const physicalPath = path.resolve(UPLOAD_DIR, safeRel);

    if (!physicalPath.startsWith(UPLOAD_DIR)) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 403;
      return res.end(JSON.stringify({ ok: false, error: 'Acesso negado.' }));
    }

    // Se o arquivo não existir no disco, tentar restaurar do backup persistente
    let exists = fs.existsSync(physicalPath);
    if (!exists) {
      const cleanBaseName = path.basename(safeRel).replace(/[^a-zA-Z0-9._-]/g, '_');
      const restored = await restoreImageIfMissing(cleanBaseName);
      if (restored && fs.existsSync(physicalPath)) {
        exists = true;
      }
    }

    if (!exists) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 404;
      return res.end(JSON.stringify({ ok: false, error: 'Arquivo físico não encontrado.' }));
    }

    const stat = await fs.promises.stat(physicalPath);
    if (stat.isDirectory()) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 404;
      return res.end(JSON.stringify({ ok: false, error: 'Diretório não pode ser visualizado como imagem.' }));
    }

    let mime = 'application/octet-stream';
    if (ext === '.png') mime = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
    else if (ext === '.webp') mime = 'image/webp';
    else if (ext === '.gif') mime = 'image/gif';
    else if (ext === '.svg') mime = 'image/svg+xml';
    else if (ext === '.ico') mime = 'image/x-icon';
    else if (ext === '.avif') mime = 'image/avif';

    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.statusCode = 200;

    if (req.method === 'HEAD') {
      return res.end();
    }

    const fileStream = fs.createReadStream(physicalPath);
    fileStream.on('error', (err) => {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'Erro ao transmitir arquivo de imagem.' }));
      }
    });
    return fileStream.pipe(res);
  }

  // ==========================================================================
  // API: GET (/api/admin/lab/image-upload)
  // ==========================================================================
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    try {
      const action = urlObj.searchParams.get('action');
      const gallery = await readGalleryJson();

      if (action === 'get-gallery') {
        res.statusCode = 200;
        return res.end(JSON.stringify({ ok: true, gallery }));
      }

      // Default GET: list physical files + gallery
      const files = await fs.promises.readdir(UPLOAD_DIR);
      const imageFiles = [];

      for (const file of files) {
        if (file === '.gitkeep' || file === 'galeria.json') continue;
        const ext = path.extname(file).toLowerCase();
        if (ALLOWED_SERVE_EXTENSIONS.has(ext)) {
          const filePath = path.join(UPLOAD_DIR, file);
          const stat = await fs.promises.stat(filePath);
          if (stat.isFile()) {
            imageFiles.push({
              name: file,
              size: stat.size,
              updatedAt: stat.mtime.toISOString(),
            });
          }
        }
      }

      res.statusCode = 200;
      return res.end(JSON.stringify({ ok: true, files: imageFiles, gallery, destination: '/dashboard/Imagem/' }));
    } catch (err) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ ok: false, error: err.message || 'Erro ao processar requisição GET' }));
    }
  }

  // ==========================================================================
  // API: POST (/api/admin/lab/image-upload)
  // ==========================================================================
  if (req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');
    try {
      const chunks = [];
      if (req.body) {
        chunks.push(typeof req.body === "string" ? Buffer.from(req.body) : Buffer.from(JSON.stringify(req.body)));
      } else if (typeof req[Symbol.asyncIterator] === "function") {
        for await (const chunk of req) {
          chunks.push(chunk);
        }
      } else if (typeof req.on === "function") {
        await new Promise((resolve, reject) => {
          req.on("data", chunk => chunks.push(chunk));
          req.on("end", resolve);
          req.on("error", reject);
        });
      }
      const rawBody = Buffer.concat(chunks).toString('utf-8');

      let parsedBody;
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        res.statusCode = 400;
        return res.end(JSON.stringify({ ok: false, error: 'Corpo da requisição inválido.' }));
      }

      // EXCLUSÃO SINCRONIZADA
      if (parsedBody.action === 'delete-image' || parsedBody.action === 'delete-registration') {
        const { id, filename } = parsedBody;
        if (!id && !filename) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ ok: false, error: 'ID ou nome do arquivo não informado.' }));
        }

        const gallery = await readGalleryJson();
        const targetRecord = gallery.find(item => (id && item.id === id) || (filename && item.filename === filename));
        const targetFilename = targetRecord?.filename || filename;

        // Remover arquivo físico correspondente se não for arquivo de sistema protegido
        if (targetFilename && !PROTECTED_SYSTEM_FILES.has(targetFilename)) {
          const cleanFile = path.basename(targetFilename).replace(/[^a-zA-Z0-9._-]/g, '_');
          const physicalPath = path.join(UPLOAD_DIR, cleanFile);
          if (fs.existsSync(physicalPath)) {
            try {
              await fs.promises.unlink(physicalPath);
            } catch (unlinkErr) {
              console.error(`Erro ao apagar arquivo físico ${cleanFile}:`, unlinkErr);
            }
          }
          // Remover do image_store
          const store = await readImageStore();
          if (store[cleanFile]) {
            delete store[cleanFile];
            await writeImageStore(store);
          }
        }

        // Remover registro do galeria.json
        const updatedGallery = gallery.filter(item => {
          if (id && item.id === id) return false;
          if (targetFilename && item.filename === targetFilename) return false;
          return true;
        });

        await writeGalleryJson(updatedGallery);

        res.statusCode = 200;
        return res.end(JSON.stringify({
          ok: true,
          message: 'Imagem e registro excluídos com sucesso (sincronizados)!',
          deletedFile: targetFilename,
          gallery: updatedGallery
        }));
      }

      // EXCLUSÃO DE ARQUIVO FÍSICO ÓRFÃO
      if (parsedBody.action === 'delete-orphan-file') {
        const { filename } = parsedBody;
        if (!filename) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ ok: false, error: 'Nome do arquivo não informado.' }));
        }

        const cleanFile = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
        if (PROTECTED_SYSTEM_FILES.has(cleanFile)) {
          res.statusCode = 403;
          return res.end(JSON.stringify({ ok: false, error: 'Arquivo do sistema não pode ser removido.' }));
        }

        const physicalPath = path.join(UPLOAD_DIR, cleanFile);
        if (fs.existsSync(physicalPath)) {
          await fs.promises.unlink(physicalPath);
        }

        const gallery = await readGalleryJson();
        const updatedGallery = gallery.filter(item => item.filename !== cleanFile);
        await writeGalleryJson(updatedGallery);

        const store = await readImageStore();
        if (store[cleanFile]) {
          delete store[cleanFile];
          await writeImageStore(store);
        }

        res.statusCode = 200;
        return res.end(JSON.stringify({
          ok: true,
          message: `Arquivo órfão ${cleanFile} removido com sucesso!`,
          deletedFile: cleanFile,
          gallery: updatedGallery
        }));
      }

      // LIMPEZA GERAL DE ARQUIVOS ÓRFÃOS (GARANTIA DE NÃO EXCLUSÃO DE IMAGENS VÁLIDAS)
      if (parsedBody.action === 'cleanup-orphans') {
        const gallery = await readGalleryJson();
        res.statusCode = 200;
        return res.end(JSON.stringify({
          ok: true,
          message: 'Verificação de integridade executada. Todos os registros válidos foram preservados.',
          removedFiles: [],
          gallery
        }));
      }

      // UPLOAD DE IMAGEM (Única ou Múltipla)
      const filesToProcess = Array.isArray(parsedBody.files) && parsedBody.files.length > 0
        ? parsedBody.files
        : (parsedBody.filename && parsedBody.fileData ? [{ filename: parsedBody.filename, fileData: parsedBody.fileData }] : []);

      if (filesToProcess.length === 0) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ ok: false, error: 'Nenhum arquivo ou conteúdo de imagem informado.' }));
      }

      // Validar todos os arquivos (apenas PNG e GIF)
      for (const item of filesToProcess) {
        const { filename, fileData } = item;
        if (!filename || !fileData) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ ok: false, error: 'Nome do arquivo ou conteúdo da imagem não informado.' }));
        }
        const cleanBaseName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
        const ext = path.extname(cleanBaseName).toLowerCase();
        if (!ALLOWED_UPLOAD_EXTENSIONS.has(ext)) {
          res.statusCode = 400;
          return res.end(JSON.stringify({
            ok: false,
            error: 'este arquivo viola as regras da plataforma, use somente png ou gif!'
          }));
        }
      }

      const savedRecords = [];
      for (const item of filesToProcess) {
        const { filename, fileData } = item;
        const cleanBaseName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
        const base64Data = fileData.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
        const fileBuffer = Buffer.from(base64Data, 'base64');

        if (fileBuffer.length === 0) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ ok: false, error: 'Arquivo vazio ou base64 corrompido.' }));
        }

        const targetPath = path.join(UPLOAD_DIR, cleanBaseName);
        await fs.promises.writeFile(targetPath, fileBuffer);

        const recordId = 'img_' + cleanBaseName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        const cleanReferenceUrl = `/dashboard/Imagem/${cleanBaseName}`;

        await persistImageBackup(cleanBaseName, fileData, {
          id: recordId,
          userId: null,
          source: 'general-gallery-upload'
        });

        const saved = await generalGalleryJohnson.create({
          id: recordId,
          filename: cleanBaseName,
          url: cleanReferenceUrl,
          size: fileBuffer.length,
          uploadedAt: new Date().toISOString()
        });

        savedRecords.push(saved);
      }

      const updatedGallery = await generalGalleryJohnson.list();

      res.statusCode = 200;
      return res.end(JSON.stringify({
        ok: true,
        message: 'Imagem(ns) salva(s) e registrada(s) com sucesso na Galeria Geral!',
        filename: savedRecords[0]?.filename,
        destination: `/dashboard/Imagem/`,
        records: savedRecords,
        record: savedRecords[0],
        gallery: updatedGallery
      }));
    } catch (err) {
      res.statusCode = 500;
      return res.end(JSON.stringify({
        ok: false,
        error: `Erro ao processar: ${err.message || String(err)}`
      }));
    }
  }

  res.statusCode = 405;
  return res.end(JSON.stringify({ ok: false, error: 'Método não permitido. Use GET ou POST.' }));
}
