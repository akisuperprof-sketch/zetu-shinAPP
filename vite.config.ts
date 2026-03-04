import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Read pre-generated build info
  let buildInfo = { version: 'unknown', sha: 'no-sha', env: mode };
  try {
    buildInfo = JSON.parse(fs.readFileSync('./build-info.json', 'utf-8'));
  } catch (e) {
    console.warn('build-info.json not found, using defaults.');
  }

  return {
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3500',
          changeOrigin: true,
          secure: false
        }
      }
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
      '__BUILD_INFO__': JSON.stringify(buildInfo)
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
