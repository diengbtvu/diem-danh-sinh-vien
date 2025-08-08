import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 8000,
    https: process.env.VITE_HTTPS ? {
      key: fs.readFileSync(process.env.VITE_SSL_KEY as string),
      cert: fs.readFileSync(process.env.VITE_SSL_CERT as string),
    } : undefined,
    hmr: {
      port: 8001, // Use different port for HMR
      host: 'localhost'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 8000,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  },
});
