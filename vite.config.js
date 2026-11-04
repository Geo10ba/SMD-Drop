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

            // Mapeia /api/xyz/abc para ./api/xyz/abc.js
            const relativePath = urlPath.replace(/^\/api\//, '');
            const filePath = `./api/${relativePath}.js`;

            const module = await import(/* @vite-ignore */ filePath);
            const handler = module.default || module;

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
