import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server only: serve folder index pages (e.g. /about/ -> public/about/index.html).
// Without this, /about/ falls back to the app. Hosting and "vite preview" already do this.
const folderIndexInDev = () => ({
  name: 'folder-index-in-dev',
  configureServer(server: { config: { publicDir: string }; middlewares: { use: (fn: (req: { url?: string }, res: unknown, next: () => void) => void) => void } }) {
    server.middlewares.use((req, _res, next) => {
      const [pathname, query = ''] = (req.url ?? '').split('?');
      if (pathname.endsWith('/') && pathname !== '/') {
        const candidate = pathname + 'index.html';
        if (fs.existsSync(path.join(server.config.publicDir, candidate))) {
          req.url = candidate + (query ? '?' + query : '');
        }
      }
      next();
    });
  },
});

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), folderIndexInDev()],
      // No secrets in `define`: anything here is embedded in the public JS bundle.
      // Call Gemini from a server-side API instead (see the test plan, section 5).
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
