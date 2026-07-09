import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxies /api to the Express backend during development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
