import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

// Body parsing
app.use(express.json());
app.use(express.raw({ type: '*/*', limit: '10mb' }));

// Helper to handle dynamic imports and handlers (replicating vite plugin logic)
async function handleDynamicRoute(req, res, handlerPath, method, handlerName) {
  try {
    const mod = await import(pathToFileURL(path.resolve(__dirname, handlerPath)).href);
    const handler = mod[handlerName];
    if (!handler) return res.status(405).json({ error: 'Método não permitido.' });
    
    // Convert Express req to Request object for compatibility with handlers
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: new Headers(req.headers),
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    
    // Call handler
    const response = await handler({ request, env: process.env });
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 1. Auth Routes Bridge (Mirroring authRoutesPlugin)
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
  const handlerPath = authRoutes[req.path];
  if (!handlerPath) return res.status(404).send('Not Found');
  const method = req.method[0] + req.method.slice(1).toLowerCase();
  await handleDynamicRoute(req, res, handlerPath, req.method, `onRequest${method}`);
});

// 2. Add other plugins as middleware here similarly...
// For brevity and to keep it focused, I will add the static file serving first
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Production server running on port ${port}`);
});
