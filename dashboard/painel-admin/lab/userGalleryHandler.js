import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { galleryJohnson } from '../../conexao/ramal/cruds/Gallery_Johnson.js';
import { getAuthorizedUserId } from '../../api/auth/accessValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GALLERY_DIR = path.resolve(__dirname, '../../Imagem');

export async function handleUserGalleryRequest(req, res) {
  res.setHeader('Content-Type', 'application/json');

  const userId = getAuthorizedUserId(req);
  if (!userId) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ ok: false, error: 'Usuário não identificado ou sessão expirada.' }));
  }

  const urlObj = new URL(req.url, 'http://localhost:3000');
  const id = urlObj.searchParams.get('id');

  try {
    if (req.method === 'GET') {
      if (id) {
        const record = await galleryJohnson.get(userId, id);
        if (!record) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ ok: false, error: 'Imagem não encontrada.' }));
        }
        res.statusCode = 200;
        return res.end(JSON.stringify({ ok: true, record }));
      }
      const gallery = await galleryJohnson.list(userId);
      res.statusCode = 200;
      return res.end(JSON.stringify({ ok: true, gallery }));
    }

    if (req.method === 'PATCH') {
      if (!id) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ ok: false, error: 'ID da imagem não fornecido.' }));
      }
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const payload = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf-8')) : {};
      const changes = payload.changes || payload;

      const record = await galleryJohnson.update(userId, id, changes);
      if (!record) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ ok: false, error: 'Imagem não encontrada.' }));
      }
      res.statusCode = 200;
      return res.end(JSON.stringify({ ok: true, record }));
    }

    if (req.method === 'DELETE') {
      if (!id) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ ok: false, error: 'Imagem não identificada.' }));
      }
      const item = await galleryJohnson.get(userId, id);
      const deleted = await galleryJohnson.delete(userId, id);
      if (deleted && item?.filename) {
        try {
          const physicalPath = path.join(GALLERY_DIR, item.filename);
          if (fs.existsSync(physicalPath)) await fs.promises.unlink(physicalPath);
        } catch (fileErr) {
          console.warn('Não foi possível remover arquivo físico:', fileErr.message);
        }
      }
      res.statusCode = deleted ? 200 : 404;
      return res.end(JSON.stringify({ ok: deleted, ...(!deleted && { error: 'Imagem não encontrada.' }) }));
    }

    if (req.method === 'POST') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf-8')) : {};

      if (body.action === 'upload') {
        const { filename, fileData } = body;
        const cleanBaseName = path.basename(filename || `img_${Date.now()}.png`).replace(/[^a-zA-Z0-9._-]/g, '_');
        const ext = path.extname(cleanBaseName).toLowerCase();
        const isPngOrGif = (ext === '.png' || ext === '.gif') && (fileData && /^data:image\/(png|gif);base64,/.test(fileData));
        if (!isPngOrGif) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ ok: false, error: 'este arquivo viola as regras da plataforma, use somente png ou gif!' }));
        }
        const fileBuffer = Buffer.from(fileData.replace(/^data:image\/.*;base64,/, ''), 'base64');
        const targetPath = path.join(GALLERY_DIR, cleanBaseName);

        await fs.promises.writeFile(targetPath, fileBuffer);

        const record = await galleryJohnson.create(userId, {
          id: 'img_' + Date.now(),
          filename: cleanBaseName,
          title: cleanBaseName.replace(/\.[^/.]+$/, ''),
          url: `/dashboard/Imagem/${cleanBaseName}`,
          size: fileBuffer.length
        });

        res.statusCode = 200;
        return res.end(JSON.stringify({ ok: true, record }));
      }

      if (body.action === 'delete') {
        const targetId = body.id || id;
        const item = targetId ? await galleryJohnson.get(userId, targetId) : null;
        const filename = body.filename || item?.filename;
        const deleted = targetId ? await galleryJohnson.delete(userId, targetId) : false;

        if (filename) {
          try {
            const physicalPath = path.join(GALLERY_DIR, filename);
            if (fs.existsSync(physicalPath)) await fs.promises.unlink(physicalPath);
          } catch {}
        }

        res.statusCode = 200;
        return res.end(JSON.stringify({ ok: true }));
      }

      if (body.record) {
        const record = await galleryJohnson.create(userId, body.record);
        res.statusCode = 200;
        return res.end(JSON.stringify({ ok: true, record }));
      }

      const record = await galleryJohnson.create(userId, body);
      res.statusCode = 200;
      return res.end(JSON.stringify({ ok: true, record }));
    }

    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: 'Método não permitido.' }));
  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
}
