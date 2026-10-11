import fs from 'node:fs/promises';
import path from 'node:path';
import { getCloudflareD1 } from '../../api/auth/cloudflareD1.js';

export async function handleAdminDocumentUsersRequest(req, res) {
  res.setHeader('Content-Type', 'application/json');

  // Segurança: Apenas administradores podem acessar a Central de Dados global
  const isAdmin = String(req.documentUserRole || '').toLowerCase() === 'admin';
  if (!isAdmin) {
    res.statusCode = 403;
    return res.end(JSON.stringify({ ok: false, error: 'Acesso negado. Esta é uma área administrativa.' }));
  }

  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: 'Método não permitido.' }));
  }

  try {
    const cwd = process.cwd();
    const cenariosFile = path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/cenarios.json');
    const overlaysFile = path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/overlays.json');
    const bibliotecaFile = path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/biblioteca.json');
    const galleryDir = path.resolve(cwd, 'dashboard/conexao/ramal/cruds/json/user_galleries');

    // 1. Ler arquivos JSON documentais
    const [cenariosDb, overlaysDb, bibliotecaDb, galleryFiles] = await Promise.all([
      fs.readFile(cenariosFile, 'utf8').then(JSON.parse).catch(() => ({})),
      fs.readFile(overlaysFile, 'utf8').then(JSON.parse).catch(() => ({})),
      fs.readFile(bibliotecaFile, 'utf8').then(JSON.parse).catch(() => ({})),
      fs.readdir(galleryDir).catch(() => []),
    ]);

    // 2. Buscar usuários reais diretamente do Cloudflare D1
    const d1 = getCloudflareD1();
    let d1Users = [];
    if (d1) {
      try {
        const queryRes = await d1.prepare('SELECT id, email, full_name, role, created_at FROM users').all();
        d1Users = queryRes.results || [];
      } catch (err) {
        console.error('[adminDocumentUsersHandler] Erro ao buscar usuários no Cloudflare D1:', err);
      }
    }

    // Mapa de usuários baseado única e exclusivamente no Cloudflare D1 real
    const userMap = new Map();

    for (const u of d1Users) {
      const displayName = u.full_name || u.email || 'Usuário';
      userMap.set(u.id, {
        id: u.id,
        name: displayName,
        email: u.email,
        role: u.role,
        source: 'cloudflare_d1',
      });
    }

    // Montar resposta unificada com documentos
    const users = [];
    for (const [id, userObj] of userMap.entries()) {
      let gallery = [];
      try {
        const userGalleryPath = path.resolve(galleryDir, `${id}.json`);
        const gData = await fs.readFile(userGalleryPath, 'utf8');
        gallery = JSON.parse(gData || '[]');
      } catch {
        gallery = [];
      }

      const scenarios = cenariosDb[id] || [];
      const overlays = overlaysDb[id] || [];
      const library = bibliotecaDb[id] || { songs: [], albums: [], artists: [], playlists: [] };

      users.push({
        ...userObj,
        scenarios,
        overlays,
        gallery,
        library,
        totalItems: {
          scenarios: scenarios.length,
          overlays: overlays.length,
          gallery: gallery.length,
          library: (library.songs?.length || 0) + (library.albums?.length || 0) + (library.playlists?.length || 0) + (library.artists?.length || 0),
        }
      });
    }

    res.statusCode = 200;
    return res.end(JSON.stringify({ ok: true, users }));
  } catch (error) {
    console.error('Erro em handleAdminDocumentUsersRequest:', error);
    res.statusCode = 500;
    return res.end(JSON.stringify({ ok: false, error: error.message || 'Erro ao carregar usuários.' }));
  }
}
