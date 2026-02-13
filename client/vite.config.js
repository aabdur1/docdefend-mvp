import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy API calls to Express backend during local development.
    // On Vercel, the api/ directory handles routing natively.
    proxy: process.env.VERCEL
      ? undefined
      : {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          },
        },
  },
});
