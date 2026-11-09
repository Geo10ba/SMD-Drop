import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function apiDevMiddleware() {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlPath = req.url ? req.url.split('?')[0] : '';
        if (urlPath.startsWith('/api/')) {
          try {
            const env = loadEnv('development', process.cwd(), '');
            Object.keys(env).forEach((k) => {
              if (!process.env[k]) process.env[k] = env[k];
            });

            let body = {};
            if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
              const buffers = [];
              for await (const chunk of req) {
                buffers.push(chunk);
              }
              const raw = Buffer.concat(buffers).toString('utf-8');
              body = raw ? JSON.parse(raw) : {};
            }
            req.body = body;

            try {
              const parsedUrl = new URL(req.url, 'http://localhost');
              req.query = Object.fromEntries(parsedUrl.searchParams.entries());
            } catch (e) {
              req.query = {};
            }

            // Se for endpoint do telegram em dev, repassa para a cloud Vercel para evitar bloqueios de rede local
            if (urlPath.startsWith('/api/telegram/')) {
              try {
                const cloudRes = await fetch(`https://smd-drop.vercel.app${urlPath}`, {
                  method: req.method,
                  headers: { 'Content-Type': 'application/json' },
                  body: req.method !== 'GET' ? JSON.stringify(body) : undefined
                });
                const cloudData = await cloudRes.json().catch(() => ({}));
                res.statusCode = cloudRes.status;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(cloudData));
                return;
              } catch (cloudErr) {
                console.warn('[Telegram Dev Proxy Fallback to Local]:', cloudErr.message);
              }
            }

            const path = await import('node:path');
            const { pathToFileURL } = await import('node:url');
            const relativePath = urlPath.replace(/^\/api\//, '');
            const absolutePath = path.resolve(process.cwd(), 'api', `${relativePath}.js`);

            const module = await import(pathToFileURL(absolutePath).href);
            const handler = module.default || module;

            res.status = (code) => {
              res.statusCode = code;
              return res;
            };
            res.json = (data) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return res;
            };

            return await handler(req, res);
          } catch (err) {
            console.error('[API Dev Middleware Error]:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    apiDevMiddleware()
  ],
});
