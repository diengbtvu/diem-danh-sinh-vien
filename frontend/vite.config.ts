import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 8000,
    https: process.env.VITE_HTTPS ? {
      key: fs.readFileSync(process.env.VITE_SSL_KEY as string),
      cert: fs.readFileSync(process.env.VITE_SSL_CERT as string),
    } : undefined,
    proxy: {
      '/api': {
        target: 'http://14.225.220.60:8081',
        changeOrigin: true,
      },
    },
  },
});
