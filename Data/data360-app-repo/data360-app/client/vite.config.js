import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, `npm run dev` serves the client and proxies /api to the Node backend.
// In prod, `npm run build` emits to dist/, which the Node backend serves itself.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:4370' },
  },
  build: { outDir: 'dist', emptyOutDir: true },
});
