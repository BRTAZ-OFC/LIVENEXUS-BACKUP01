import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import { pathToFileURL } from 'node:url'

function ytMusicPlugin() {
  return {
    name: 'ytmusic-bridge-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/ytmusic')) {
          return next();
        }
        try {
          const { handleRequest } = await import('./dashboard/conexao/Connection_music-bridge.js');
          const protocol = req.headers['x-forwarded-proto'] || 'http';
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
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/ytmusic')) {
          return next();
        }
        try {
          const { handleRequest } = await import('./dashboard/conexao/Connection_music-bridge.js');
          const protocol = req.headers['x-forwarded-proto'] || 'http';
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
    },
  };
}

function cloudflareStatsPlugin() {
  return {
    name: 'cloudflare-stats-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/cloudflare-stats')) {
          return next();
        }
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
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/cloudflare-stats')) {
          return next();
        }
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
    },
  };
}

function youtubeTest1Plugin() {
  return {
    name: 'youtube-test1-lab-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/admin/lab/youtube-test1/bootstrap')) {
          return next();
        }
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
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/admin/lab/youtube-test1/bootstrap')) {
          return next();
        }
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
    },
  };
}

function imageUploadPlugin() {
  const shouldSkip = (req) => {
    const urlPath = req.url.split('?')[0];
    if (urlPath.startsWith('/dashboard/Imagem/template/')) return true;
    if (/\.(jsx?|tsx?|json|css|svg)$/i.test(urlPath)) return true;
    if (req.url.includes('?import') || req.url.includes('&import')) return true;
    return false;
  };
  return {
    name: 'image-upload-lab-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (shouldSkip(req)) return next();
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
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (shouldSkip(req)) return next();
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
    },
  };
}

function userGalleryPlugin() {
  async function handleGallery(req, res, next) {
    if (!req.url.startsWith('/api/admin/lab/user-gallery')) return next();
    const { handleUserGalleryRequest } = await import('./dashboard/conexao/userGalleryHandler.js');
    await handleUserGalleryRequest(req, res);
  }
  return {
    name: 'user-gallery-plugin',
    configureServer(server) {
      server.middlewares.use(handleGallery);
    },
    configurePreviewServer(server) { server.middlewares.use(handleGallery); },
  };
}

function templatesPlugin() {
  const handle = async (req, res, next) => {
    if (!req.url.split('?')[0].startsWith('/api/templates')) return next();
    const { handleTemplateRequest } = await import('./dashboard/Imagem/template/Template_Handler.js');
    await handleTemplateRequest(req, res);
  };
  return {
    name: 'templates-plugin',
    configureServer(server) { server.middlewares.use(handle); },
    configurePreviewServer(server) { server.middlewares.use(handle); },
  };
}

function documentaryDomainsPlugin() {
  async function handle(req, res, next) {
    const pathname = req.url.split('?')[0];
    if (pathname === '/api/admin/lab/rtc/signal') {
      const { handleSignalingRequest } = await import('./dashboard/conexao/rtc/signalingHandler.js');
      return handleSignalingRequest(req, res);
    }
    if (pathname === '/api/rtc-identity') {
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
    }
    if (pathname === '/api/gallery/general') {
      const { galleryGeneralJohnson } = await import('./dashboard/conexao/ramal/cruds/Gallery_Johnson.js');
      const gallery = await galleryGeneralJohnson.list();
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok: true, gallery }));
    }
    if (pathname === '/api/admin/database-inspect') {
      const { handleDatabaseInspectRequest } = await import('./dashboard/painel-admin/db/databaseInspectHandler.js');
      return handleDatabaseInspectRequest(req, res);
    }
    if (pathname === '/api/admin/database-admin') {
      const { handleDatabaseAdminRequest } = await import('./dashboard/painel-admin/db/databaseAdminHandler.js');
      return handleDatabaseAdminRequest(req, res);
    }
    if (pathname === '/api/admin/database-record-admin') {
      const { handleDatabaseRecordAdminRequest } = await import('./dashboard/painel-admin/db/databaseRecordAdminHandler.js');
      return handleDatabaseRecordAdminRequest(req, res);
    }
    if (pathname === '/api/admin/database-create') {
      const { handleDatabaseCreateRequest } = await import('./dashboard/painel-admin/db/databaseCreateHandler.js');
      return handleDatabaseCreateRequest(req, res);
    }
    if (pathname === '/api/admin/document-users') {
      const { handleAdminDocumentUsersRequest } = await import('./dashboard/painel-admin/db/adminDocumentUsersHandler.js');
      return handleAdminDocumentUsersRequest(req, res);
    }
    if (pathname === '/api/overlays') {
      const { handleOverlayRequest } = await import('./dashboard/overlays/Overlay_Handler.js');
      return handleOverlayRequest(req, res);
    }
    if (pathname === '/api/library') {
      const { handleLibraryRequest } = await import('./dashboard/biblioteca/Library_Handler.js');
      return handleLibraryRequest(req, res);
    }
    if (pathname === '/api/contacts') {
      const { handleMessagesRequest } = await import('./dashboard/configuracao/Config_MessagesHandler.js');
      return handleMessagesRequest(req, res);
    }
    if (pathname === '/api/live-sessions') {
      const { handleVodsRequest } = await import('./dashboard/configuracao/Config_VodsHandler.js');
      return handleVodsRequest(req, res);
    }
    if (pathname === '/api/reviews') {
      const { handleReviewsRequest } = await import('./dashboard/painel-admin/Review_Handler.js');
      return handleReviewsRequest(req, res);
    }
    if (pathname === '/api/plataformas') {
      const { handlePlataformasRequest } = await import('./dashboard/conexao/ramal/Plataformas_Handler.js');
      return handlePlataformasRequest(req, res);
    }
    if (pathname.startsWith('/api/channel-verify')) {
      try {
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
    }
    next();
  }
  return {
    name: 'documentary-domains-plugin',
    configureServer(server) { server.middlewares.use(handle); },
    configurePreviewServer(server) { server.middlewares.use(handle); },
  };
}

function cenariosPlugin() {
  return {
    name: 'cenarios-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/cenarios')) return next();
        const { handleCenariosRequest } = await import('./dashboard/painel-admin/db/cenariosHandler.js');
        await handleCenariosRequest(req, res);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/cenarios')) return next();
        const { handleCenariosRequest } = await import('./dashboard/painel-admin/db/cenariosHandler.js');
        await handleCenariosRequest(req, res);
      });
    }
  };
}

function authRoutesPlugin() {
  const routes = {
    '/api/auth/login': './dashboard/api/auth/login.js',
    '/api/auth/register': './dashboard/api/auth/register.js',
    '/api/auth/me': './dashboard/api/auth/me.js',
    '/api/auth/update-me': './dashboard/api/auth/update-me.js',
    '/api/auth/logout': './dashboard/api/auth/logout.js',
    '/api/auth/delete-account': './dashboard/api/auth/delete-account.js',
    '/api/auth/verify-otp': './dashboard/api/auth/verify-otp.js',
    '/api/auth/resend-otp': './dashboard/api/auth/resend-otp.js',
  };
  async function handle(req, res, next) {
    try {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      if (!pathname.startsWith('/api/')) return next();
      const { getCloudflareD1 } = await import('./dashboard/api/auth/cloudflareD1.js');
      const db = getCloudflareD1();
      const env = { DB: db };
      const { resolveSessionId, getSession } = await import('./dashboard/api/auth/_lib.js');
      const requestUrl = `http://${req.headers.host || 'localhost:3000'}${req.url}`;
      const request = new Request(requestUrl, { method: req.method, headers: req.headers });
      const sessionId = resolveSessionId(request, env);
      const session = env.DB && sessionId ? await getSession(env, sessionId) : null;
      req.documentUserId = session?.id || null;
      req.documentUserRole = session?.role || null;

      if (!routes[pathname]) return next();
      const route = await import(pathToFileURL(path.resolve(process.cwd(), routes[pathname])).href);
      const method = req.method[0] + req.method.slice(1).toLowerCase();
      const handler = route[`onRequest${method}`];
      if (!handler) {
        res.statusCode = 405;
        return res.end(JSON.stringify({ error: 'Método não permitido.' }));
      }
      const chunks = req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS'
        ? [] : await Array.fromAsync(req);
      const routeRequest = new Request(requestUrl, {
        method: req.method,
        headers: req.headers,
        ...(chunks.length ? { body: Buffer.concat(chunks) } : {}),
      });
      const response = await handler({ request: routeRequest, env });
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      return res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: error.message }));
    }
  }
  return {
    name: 'original-auth-routes-plugin',
    configureServer(server) { server.middlewares.use(handle); },
    configurePreviewServer(server) { server.middlewares.use(handle); },
  };
}

// https://vite.dev/config/
const serverPort = Number(process.env.SERVER_PORT || process.env.PORT || 3000);

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './dashboard'),
      '@dashboard': path.resolve(__dirname, './dashboard'),
    },
  },
  plugins: [
    authRoutesPlugin(),
    ytMusicPlugin(),
    cloudflareStatsPlugin(),
    youtubeTest1Plugin(),
    templatesPlugin(),
    imageUploadPlugin(),
    userGalleryPlugin(),
    cenariosPlugin(),
    documentaryDomainsPlugin(),
    react(),
  ],
  server: {
    host: '0.0.0.0',
    port: serverPort,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: serverPort,
    allowedHosts: true,
  }
});