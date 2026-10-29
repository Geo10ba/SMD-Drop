import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function apiDevMiddleware() {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/telegram/notify')) {
          try {
            const env = loadEnv('development', process.cwd(), '');
            process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN;
            process.env.TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || env.TELEGRAM_CHAT_ID;

            const { default: handler } = await import('./api/telegram/notify.js');

            let body = {};
            if (req.method === 'POST') {
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
