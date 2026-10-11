import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pasta de destino especificada: /dashboard/Imagem/
const UPLOAD_DIR = path.resolve(__dirname, '../../Imagem');
const GALLERY_JSON_PATH = path.resolve(process.cwd(), 'dashboard/conexao/ramal/cruds/json/galeria.json');

const ALLOWED_EXTENSIONS = new Set(['.png', '.gif', '.jpg', '.jpeg', '.webp']);

// Helper para ler galeria.json e validar integridade (remove registros órfãos sem arquivo físico)
async function readGalleryJson(validateIntegrity = true) {
  try {
    if (!fs.existsSync(GALLERY_JSON_PATH)) {
      return [];
    }
    const data = await fs.promises.readFile(GALLERY_JSON_PATH, 'utf-8');
    let gallery = JSON.parse(data || '[]');

    if (!Array.isArray(gallery)) {
      gallery = [];
    }

    // Validação de integridade automática: remover registros apontando para arquivos inexistentes
    if (validateIntegrity && fs.existsSync(UPLOAD_DIR)) {
      let changed = false;
      const validGallery = gallery.filter(item => {
        if (!item || !item.filename) return false;
        const filePath = path.join(UPLOAD_DIR, item.filename);
        const exists = fs.existsSync(filePath);
        if (!exists) {
          changed = true;
          return false;
        }
        return true;
      });

      if (changed) {
        await writeGalleryJson(validGallery);
        return validGallery;
      }
    }

    return gallery;
  } catch (err) {
    console.error('Error reading galeria.json:', err);
    return [];
  }
}

// Helper para gravar galeria.json de forma segura
async function writeGalleryJson(data) {
  try {
    await fs.promises.writeFile(GALLERY_JSON_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing galeria.json:', err);
  }
}

// Helper para limpar órfãos
async function cleanupOrphans() {
  const gallery = await readGalleryJson(false);
  const validFilenames = new Set(gallery.map(item => item.filename));
  if (!fs.existsSync(UPLOAD_DIR)) return [];
  const files = await fs.promises.readdir(UPLOAD_DIR);
  const removed = [];

  for (const file of files) {
    if (file === '.gitkeep' || file === 'galeria.json') continue;
    if (!validFilenames.has(file)) {
      const filePath = path.join(UPLOAD_DIR, file);
      await fs.promises.unlink(filePath);
      removed.push(file);
    }
  }
  return removed;
}

export async function handleImageUploadRequest(req, res, next) {
  // Garante que o diretório existe
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const urlObj = new URL(req.url, 'http://localhost:3000');
  const pathname = decodeURIComponent(urlObj.pathname);

  // Servir imagens com o prefixo real /dashboard/Imagem/
  if (pathname.startsWith('/dashboard/Imagem/')) {
    const file = pathname.substring('/dashboard/Imagem/'.length);
    const ext = path.extname(file).toLowerCase();
    if (!file || file === 'galeria.json' || !ALLOWED_EXTENSIONS.has(ext)) {
      if (typeof next === 'function') return next();
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 404;
      return res.end(JSON.stringify({ ok: false, error: 'Arquivo inválido para visualização direta.' }));
    }

    const cleanFile = path.basename(file).replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(UPLOAD_DIR, cleanFile);

    if (!fs.existsSync(filePath)) {
      if (typeof next === 'function') return next();
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 404;
      return res.end(JSON.stringify({ ok: false, error: 'Arquivo físico não encontrado.' }));
    }

    const cleanExt = path.extname(cleanFile).toLowerCase();
    let mime = 'application/octet-stream';
    if (cleanExt === '.png') mime = 'image/png';
    else if (cleanExt === '.jpg' || cleanExt === '.jpeg') mime = 'image/jpeg';
    else if (cleanExt === '.webp') mime = 'image/webp';
    else if (cleanExt === '.gif') mime = 'image/gif';

    res.setHeader('Content-Type', mime);
    res.statusCode = 200;
    const fileStream = fs.createReadStream(filePath);
    return fileStream.pipe(res);
  }

  // GET: Listar arquivos e galeria.json com garantia de sincronia
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    try {
      const action = urlObj.searchParams.get('action');
      const gallery = await readGalleryJson(true);

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
        if (ALLOWED_EXTENSIONS.has(ext)) {
          const filePath = path.join(UPLOAD_DIR, file);
          const stat = await fs.promises.stat(filePath);
          imageFiles.push({
            name: file,
            size: stat.size,
            updatedAt: stat.mtime.toISOString(),
          });
        }
      }

      res.statusCode = 200;
      return res.end(JSON.stringify({ ok: true, files: imageFiles, gallery, destination: '/dashboard/Imagem/' }));
    } catch (err) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ ok: false, error: err.message || 'Erro ao processar requisição GET' }));
    }
  }

  // POST: Upload ou Exclusão sincronizada
  if (req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');
    try {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks).toString('utf-8');
      
      let parsedBody;
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        res.statusCode = 400;
        return res.end(JSON.stringify({ ok: false, error: 'Corpo da requisição inválido.' }));
      }

      // EXCLUSÃO SINCRONIZADA: Remove do galeria.json E do diretório físico /dashboard/Imagem/
      if (parsedBody.action === 'delete-image' || parsedBody.action === 'delete-registration') {
        const { id, filename } = parsedBody;
        if (!id && !filename) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ ok: false, error: 'ID ou nome do arquivo não informado.' }));
        }

        const gallery = await readGalleryJson(false);
        const targetRecord = gallery.find(item => (id && item.id === id) || (filename && item.filename === filename));
        
        const targetFilename = targetRecord?.filename || filename;

        // 1. Remover arquivo físico correspondente de /dashboard/Imagem/
        if (targetFilename) {
          const cleanFile = path.basename(targetFilename).replace(/[^a-zA-Z0-9._-]/g, '_');
          const physicalPath = path.join(UPLOAD_DIR, cleanFile);
          if (fs.existsSync(physicalPath)) {
            try {
              await fs.promises.unlink(physicalPath);
            } catch (unlinkErr) {
              console.error(`Erro ao apagar arquivo físico ${cleanFile}:`, unlinkErr);
            }
          }
        }

        // 2. Remover registro do galeria.json
        const updatedGallery = gallery.filter(item => {
          if (id && item.id === id) return false;
          if (targetFilename && item.filename === targetFilename) return false;
          return true;
        });

        await writeGalleryJson(updatedGallery);
        await cleanupOrphans();

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
        const physicalPath = path.join(UPLOAD_DIR, cleanFile);
        if (fs.existsSync(physicalPath)) {
          await fs.promises.unlink(physicalPath);
        }

        const gallery = await readGalleryJson(false);
        const updatedGallery = gallery.filter(item => item.filename !== cleanFile);
        await writeGalleryJson(updatedGallery);
        await cleanupOrphans();

        res.statusCode = 200;
        return res.end(JSON.stringify({
          ok: true,
          message: `Arquivo órfão ${cleanFile} removido com sucesso!`,
          deletedFile: cleanFile,
          gallery: updatedGallery
        }));
      }

      // LIMPEZA GERAL DE ARQUIVOS ÓRFÃOS (GARANTIA DE INTEGRIDADE)
      if (parsedBody.action === 'cleanup-orphans') {
        const removed = await cleanupOrphans();
        const gallery = await readGalleryJson(false);

        res.statusCode = 200;
        return res.end(JSON.stringify({
          ok: true,
          message: 'Limpeza de órfãos executada com sucesso!',
          removedFiles: removed,
          gallery
        }));
      }

      // Caso padrão: upload de imagem
      const { filename, fileData } = parsedBody;

      if (!filename || !fileData) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ ok: false, error: 'Nome do arquivo ou conteúdo da imagem não informado.' }));
      }

      // Sanitizar nome do arquivo e verificar extensão permitida
      const cleanBaseName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
      const ext = path.extname(cleanBaseName).toLowerCase();

      if (!ALLOWED_EXTENSIONS.has(ext)) {
        res.statusCode = 400;
        return res.end(JSON.stringify({
          ok: false,
          error: 'este arquivo viola as regras da plataforma, use somente png ou gif!'
        }));
      }

      // Extrair base64 removendo eventual data URI header (ex: data:image/png;base64,...)
      const base64Data = fileData.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
      const fileBuffer = Buffer.from(base64Data, 'base64');

      if (fileBuffer.length === 0) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ ok: false, error: 'Arquivo vazio ou base64 corrompido.' }));
      }

      const targetPath = path.join(UPLOAD_DIR, cleanBaseName);

      // Salvar fisicamente no diretório
      await fs.promises.writeFile(targetPath, fileBuffer);

      // Registrar no galeria.json
      const gallery = await readGalleryJson(false);
      
      const recordId = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const cleanReferenceUrl = `/dashboard/Imagem/${cleanBaseName}`;
      
      // Se já existia um registro com esse mesmo filename, atualizar em vez de duplicar
      const filteredGallery = gallery.filter(item => item.filename !== cleanBaseName);

      const newRecord = {
        id: recordId,
        filename: cleanBaseName,
        url: cleanReferenceUrl,
        size: fileBuffer.length,
        uploadedAt: new Date().toISOString()
      };

      filteredGallery.push(newRecord);
      await writeGalleryJson(filteredGallery);
      await cleanupOrphans();

      res.statusCode = 200;
      return res.end(JSON.stringify({
        ok: true,
        message: `Imagem salva e registrada com sucesso em galeria.json!`,
        filename: cleanBaseName,
        destination: `/dashboard/Imagem/${cleanBaseName}`,
        size: fileBuffer.length,
        uploadedAt: newRecord.uploadedAt,
        record: newRecord,
        gallery: filteredGallery
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

