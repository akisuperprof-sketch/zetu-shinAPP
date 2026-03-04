import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Build info generation
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstDate = new Date(now.getTime() + jstOffset);
  const version = `ver${jstDate.toISOString().replace(/T/, '.').replace(/-/g, '.').replace(/:/g, '.').slice(0, 19)}`;

  let sha = 'no-sha';
  try {
    sha = execSync('git rev-parse --short HEAD').toString().trim();
  } catch (e) {
    console.warn('Git SHA extraction failed');
  }

  const appEnv = process.env.VERCEL_ENV || mode;

  return {
    server: {
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      {
        name: 'rewrite-middleware',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url && req.url.startsWith('/app')) {
              req.url = '/app/index.html';
            }
            next();
          });
        }
      }
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      '__BUILD_INFO__': JSON.stringify({
        version,
        sha,
        env: appEnv
      })
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          app: path.resolve(__dirname, 'app/index.html')
        }
      }
    }
  };
});
