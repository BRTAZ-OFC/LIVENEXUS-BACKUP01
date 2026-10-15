import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { getCloudflareD1 } from './dashboard/api/auth/cloudflareD1.js';
import { ensureImagePersistence } from './dashboard/conexao/imageUploadHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

// CORS e cabeçalhos universais para requisições à API
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// ============================================================================
// 1. RESOLUÇÃO DE SESSÃO E IDENTIDADE DOCUMENTAL (/api/* e /dashboard/Imagem/*)
// Popula req.documentUserId e req.documentUserRole via Cloudflare D1
// ============================================================================
app.use(async (req, res, next) => {
  const pathname = req.path || req.url.split('?')[0];
  if (!pathname.startsWith('/api/') && !pathname.startsWith('/dashboard/Imagem/')) {
    return next();
  }

  try {
    const db = getCloudflareD1();
    const env = { ...process.env, DB: db || null };
    req.env = env;

    const { resolveSessionId, getSession } = await import('./dashboard/api/auth/_lib.js');
    const requestUrl = `http://${req.headers.host || 'localhost:3000'}${req.url}`;
    const request = new Request(requestUrl, { method: req.method, headers: req.headers });
    const sessionId = resolveSessionId(request, env);
    const session = env.DB && sessionId ? await getSession(env, sessionId) : null;
    req.documentUserId = session?.id || null;
    req.documentUserRole = session?.role || null;
  } catch (err) {
    req.documentUserId = null;
    req.documentUserRole = null;
  }
  next();
});

// ============================================================================
// 2. IMAGE UPLOAD & VISUALIZAÇÃO DIRETA (/api/admin/lab/image-upload e /dashboard/Imagem/)
// ============================================================================
const shouldSkipImageUpload = (req) => {
  const urlPath = req.url.split('?')[0];
  if (/\.(jsx?|tsx?|json|css)$/i.test(urlPath)) return true;
  if (req.url.includes('?import') || req.url.includes('&import')) return true;
  return false;
};


app.use(async (req, res, next) => {
  if (shouldSkipImageUpload(req)) return next();
  const urlPath = req.url.split('?')[0];
  if (!urlPath.startsWith('/api/admin/lab/image-upload') && !urlPath.startsWith('/dashboard/Imagem/') && !urlPath.startsWith('/api/admin/general-gallery')) {
    return next();
  }
  try {
    const { handleImageUploadRequest } = await import('./dashboard/conexao/imageUploadHandler.js');
    await handleImageUploadRequest(req, res, next);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
});

// ============================================================================
// 3. ROTAS DE AUTENTICAÇÃO (/api/auth/*)
// ============================================================================
const authRoutes = {
  '/api/auth/login': './dashboard/api/auth/login.js',
  '/api/auth/register': './dashboard/api/auth/register.js',
  '/api/auth/me': './dashboard/api/auth/me.js',
  '/api/auth/update-me': './dashboard/api/auth/update-me.js',
  '/api/auth/logout': './dashboard/api/auth/logout.js',
  '/api/auth/delete-account': './dashboard/api/auth/delete-account.js',
  '/api/auth/verify-otp': './dashboard/api/auth/verify-otp.js',
  '/api/auth/resend-otp': './dashboard/api/auth/resend-otp.js',
};

app.all(/^\/api\/auth\/.*/, async (req, res) => {
  const pathname = req.path || req.url.split('?')[0];
  const handlerRelPath = authRoutes[pathname];
  if (!handlerRelPath) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: 'Rota de autenticação não encontrada.' }));
  }

  try {
    const route = await import(pathToFileURL(path.resolve(__dirname, handlerRelPath)).href);
    const method = req.method[0] + req.method.slice(1).toLowerCase();
    const handler = route[`onRequest${method}`];
    if (!handler) {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Método não permitido.' }));
    }

    const requestUrl = `http://${req.headers.host || 'localhost:3000'}${req.url}`;
    const chunks = [];
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      for await (const chunk of req) chunks.push(chunk);
    }
    const routeRequest = new Request(requestUrl, {
      method: req.method,
      headers: req.headers,
      ...(chunks.length ? { body: Buffer.concat(chunks) } : {}),
    });

    const env = req.env || { ...process.env, DB: getCloudflareD1() || null };
    const response = await handler({ request: routeRequest, env });
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (typeof response.headers.getSetCookie === 'function') {
      const cookies = response.headers.getSetCookie();
      if (cookies && cookies.length > 0) {
        res.setHeader('Set-Cookie', cookies);
      }
    }
    return res.end(Buffer.from(await response.arrayBuffer()));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: err.message || String(err) }));
  }
});

// ============================================================================
// 4. YOUTUBE MUSIC BRIDGE (/api/ytmusic)
// ============================================================================
app.all(/^\/api\/ytmusic(\/.*)?$/, async (req, res) => {
  try {
    const { handleRequest } = await import('./dashboard/conexao/Connection_music-bridge.js');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers.host || 'localhost:3000';
    const fullUrl = `${protocol}://${host}${req.url}`;

    let body = null;
    if (req.method === 'POST' || req.method === 'PUT') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = Buffer.concat(chunks).toString('utf-8');
    }

    const fetchReq = new Request(fullUrl, {
      method: req.method,
      headers: req.headers,
      body: body ? body : undefined,
    });

    const webRes = await handleRequest(fetchReq);
    res.statusCode = webRes.status;
    webRes.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });
    const text = await webRes.text();
    res.end(text);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
});

// ============================================================================
// 5. CLOUDFLARE WORKER STATS (/api/cloudflare-stats)
// ============================================================================
app.all(/^\/api\/cloudflare-stats(\/.*)?$/, async (req, res) => {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const workerName = process.env.CLOUDFLARE_WORKER_NAME || '';

  if (!token || !accountId) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ configured: false, reason: 'Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID' }));
  }

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const query = `
      query {
        viewer {
          accounts(filter: {accountTag: "${accountId}"}) {
            workersInvocationsAdaptive(
              limit: 100,
              filter: {
                date: "${todayStr}"
                ${workerName ? `, scriptName: "${workerName}"` : ''}
              }
            ) {
              sum {
                requests
              }
            }
          }
        }
      }
    `;

    const cfRes = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const cfData = await cfRes.json();
    const requestsToday = cfData?.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive?.[0]?.sum?.requests || 0;
    const limit = 100000;
    const usagePercent = Number(((requestsToday / limit) * 100).toFixed(2));

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      configured: true,
      requestsToday,
      limit,
      usagePercent,
    }));
  } catch (err) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ configured: false, error: err.message || String(err) }));
  }
});

// ============================================================================
// 6. YOUTUBE TEST 1 LAB BOOTSTRAP (/api/admin/lab/youtube-test1/bootstrap)
// ============================================================================
app.all(/^\/api\/admin\/lab\/youtube-test1\/bootstrap(\/.*)?$/, async (req, res) => {
  try {
    let identifier = '';
    const urlObj = new URL(req.url, 'http://localhost:3000');
    identifier = urlObj.searchParams.get('identifier') || '';

    if (!identifier && (req.method === 'POST' || req.method === 'PUT')) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const bodyStr = Buffer.concat(chunks).toString('utf-8');
      try {
        const bodyJson = JSON.parse(bodyStr);
        identifier = bodyJson.identifier || '';
      } catch {
        identifier = bodyStr;
      }
    }

    const { resolveYouTubeLiveBootstrap } = await import('./dashboard/conexao/Admin_youtubeTest1Bootstrap.js');
    const result = await resolveYouTubeLiveBootstrap(identifier);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
});

// ============================================================================
// 6.5. GENERAL GALLERY (/api/gallery/general)
// ============================================================================
app.all('/api/gallery/general', async (req, res) => {
  try {
    const { galleryGeneralJohnson } = await import('./dashboard/conexao/ramal/cruds/Gallery_Johnson.js');
    const gallery = await galleryGeneralJohnson.list();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: true, gallery }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
});

// ============================================================================
// 7. USER GALLERY LAB (/api/admin/lab/user-gallery)
// ============================================================================
app.all(/^\/api\/admin\/lab\/user-gallery(\/.*)?$/, async (req, res) => {
  try {
    const { handleUserGalleryRequest } = await import('./dashboard/conexao/userGalleryHandler.js');
    await handleUserGalleryRequest(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
});

// ============================================================================
// 8. TEMPLATES (/api/templates)
// ============================================================================
app.all(/^\/api\/templates(\/.*)?$/, async (req, res) => {
  try {
    const { handleTemplateRequest } = await import('./dashboard/Imagem/template/Template_Handler.js');
    await handleTemplateRequest(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
});

// ============================================================================
// 9. CENÁRIOS (/api/cenarios)
// ============================================================================
app.all(/^\/api\/cenarios(\/.*)?$/, async (req, res) => {
  try {
    const { handleCenariosRequest } = await import('./dashboard/painel-admin/db/cenariosHandler.js');
    await handleCenariosRequest(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
});

// ============================================================================
// 10. DOMÍNIOS DOCUMENTAIS E ROTAS ADMINISTRATIVAS
// ============================================================================
app.all('/api/admin/lab/rtc/signal', async (req, res) => {
  try {
    const { handleSignalingRequest } = await import('./dashboard/conexao/rtc/signalingHandler.js');
    return handleSignalingRequest(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
});

app.all('/api/rtc-identity', async (req, res) => {
  try {
    const { getAuthorizedUserId } = await import('./dashboard/api/auth/accessValidator.js');
    const userId = getAuthorizedUserId(req);
    if (!userId) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok: false, error: 'Identidade real da sessão não resolvida.' }));
    }
    const { rtcIdentityJohnson } = await import('./dashboard/conexao/ramal/cruds/RtcIdentity_Johnson.js');
    const rtcId = await rtcIdentityJohnson.getOrCreateRtcId(userId);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: true, rtcId, userId }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
});

app.all('/api/admin/database-inspect', async (req, res) => {
  try {
    const { handleDatabaseInspectRequest } = await import('./dashboard/painel-admin/db/databaseInspectHandler.js');
    return handleDatabaseInspectRequest(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
});

app.all('/api/admin/database-admin', async (req, res) => {
  try {
    const { handleDatabaseAdminRequest } = await import('./dashboard/painel-admin/db/databaseAdminHandler.js');
    return handleDatabaseAdminRequest(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
});

app.all('/api/admin/database-record-admin', async (req, res) => {
  try {
    const { handleDatabaseRecordAdminRequest } = await import('./dashboard/painel-admin/db/databaseRecordAdminHandler.js');
    return handleDatabaseRecordAdminRequest(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
});

app.all('/api/admin/database-create', async (req, res) => {
  try {
    const { handleDatabaseCreateRequest } = await import('./dashboard/painel-admin/db/databaseCreateHandler.js');
    return handleDatabaseCreateRequest(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
});

app.all('/api/admin/document-users', async (req, res) => {
  try {
    const { handleAdminDocumentUsersRequest } = await import('./dashboard/painel-admin/db/adminDocumentUsersHandler.js');
    return handleAdminDocumentUsersRequest(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
});

app.all(/^\/api\/overlays(\/.*)?$/, async (req, res) => {
  try {
    const { handleOverlayRequest } = await import('./dashboard/overlays/Overlay_Handler.js');
    return handleOverlayRequest(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
});

app.all(/^\/api\/library(\/.*)?$/, async (req, res) => {
  try {
    const { handleLibraryRequest } = await import('./dashboard/biblioteca/Library_Handler.js');
    return handleLibraryRequest(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
});

app.all(/^\/api\/contacts(\/.*)?$/, async (req, res) => {
  try {
    const { handleMessagesRequest } = await import('./dashboard/configuracao/Config_MessagesHandler.js');
    return handleMessagesRequest(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
});

app.all(/^\/api\/live-sessions(\/.*)?$/, async (req, res) => {
  try {
    const { handleVodsRequest } = await import('./dashboard/configuracao/Config_VodsHandler.js');
    return handleVodsRequest(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
});

app.all(/^\/api\/reviews(\/.*)?$/, async (req, res) => {
  try {
    const { handleReviewsRequest } = await import('./dashboard/painel-admin/Review_Handler.js');
    return handleReviewsRequest(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
});

app.all(/^\/api\/plataformas(\/.*)?$/, async (req, res) => {
  try {
    const { handlePlataformasRequest } = await import('./dashboard/conexao/ramal/Plataformas_Handler.js');
    return handlePlataformasRequest(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: false, error: err.message || String(err) }));
  }
});

app.all(/^\/api\/channel-verify(\/.*)?$/, async (req, res) => {
  try {
    const pathname = req.url.split('?')[0];
    const subpath = pathname.replace(/^\/api\/channel-verify/, '') || '/';
    const urlStr = `http://${req.headers.host || 'localhost:3000'}${subpath}${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`;
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bodyBuf = chunks.length ? Buffer.concat(chunks) : null;
    const fetchReq = new Request(urlStr, {
      method: req.method,
      headers: req.headers,
      body: (req.method === 'POST' || req.method === 'PUT') && bodyBuf ? bodyBuf : undefined,
    });
    const mod = await import('./dashboard/conexao/Connection_channel-verify.js');
    const env = {
      KV: null,
      PROOF_SECRET: process.env.PROOF_SECRET || 'lnx_proof_secret_local',
      YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',
    };
    const workerRes = await mod.default.fetch(fetchReq, env);
    res.statusCode = workerRes.status;
    workerRes.headers.forEach((val, key) => res.setHeader(key, val));
    const resText = await workerRes.text();
    return res.end(resText);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: err.message || 'Erro no verificador local.' }));
  }
});

// ============================================================================
// 11. BLOQUEIO DE FALLBACK PARA /api/* E /dashboard/Imagem/* (RETORNA JSON 404, NUNCA HTML)
// ============================================================================
app.all(/^\/api(\/.*)?$/, (req, res) => {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: false, error: 'Endpoint da API não encontrado.' }));
});

app.all(/^\/dashboard\/Imagem(\/.*)?$/, (req, res) => {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: false, error: 'Imagem não encontrada.' }));
});

// ============================================================================
// 12. ARQUIVOS ESTÁTICOS E SPA FALLBACK (COMPATÍVEL COM EXPRESS 5)
// ============================================================================
app.use(express.static(path.join(__dirname, 'dist')));

const distIndexPath = path.join(__dirname, 'dist', 'index.html');
app.get('/{*splat}', (req, res) => {
  if (fs.existsSync(distIndexPath)) {
    return res.sendFile(distIndexPath);
  }
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>LiveNexus Server</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b0f19; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <div style="background: #111827; border: 1px solid #1f2937; padding: 2rem; border-radius: 12px; max-width: 480px; text-align: center;">
          <h2 style="color: #6366f1; margin-top: 0;">LiveNexus Server Ativo</h2>
          <p style="color: #9ca3af; font-size: 0.95rem;">O servidor Node.js está rodando perfeitamente. Para visualizar a interface completa do frontend, execute <code>npm run build</code>.</p>
        </div>
      </body>
    </html>
  `);
});

// ============================================================================
// 13. INICIALIZAÇÃO DO SERVIDOR (0.0.0.0 e process.env.PORT)
// ============================================================================
app.listen(port, '0.0.0.0', () => {
  console.log(`Production server running on port ${port}`);
  ensureImagePersistence().catch((err) => {
    console.warn('[Startup] Erro ao sincronizar persistência de imagens:', err?.message || err);
  });
});
