import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/casper-rpc': {
            target: 'https://rpc.testnet.casperlabs.io',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/casper-rpc/, '')
          },
          '/casper-node-rpc': {
            target: 'https://node-clarity-testnet.make.services',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/casper-node-rpc/, '')
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
