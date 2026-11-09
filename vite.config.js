import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Makefy Admin Panel. Devda /api so'rovlari PHP backendga proxy qilinadi — sessiya cookie bir xil origin'da qoladi.
// `npm run dev:mock` — backendsiz, namunaviy ma'lumotlar bilan (dizayn/sinov uchun).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      '/api': { target: process.env.VITE_API_PROXY_TARGET || 'http://localhost', changeOrigin: true },
    },
  },
});
