import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3001,
    https: process.env.VITE_HTTPS ? {
      key: fs.readFileSync(process.env.VITE_SSL_KEY as string),
      cert: fs.readFileSync(process.env.VITE_SSL_CERT as string),
    } : undefined,
    hmr: {
      port: 8000, // Use same port for HMR to avoid confusion
      host: 'localhost'
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'https://diemdanh.zettix.net',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3001,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  },
});
