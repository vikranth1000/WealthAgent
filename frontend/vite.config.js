import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
const wsUrl = backendUrl.replace(/^http/, 'ws');

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': backendUrl,
      '/ws': {
        target: wsUrl,
        ws: true,
      },
    },
  },
});
