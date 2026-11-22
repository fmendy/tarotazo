import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:8080' } },
  build: {
    rollupOptions: {
      output: {
        // Librerías grandes en chunks propios y cacheables (QA-10).
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'motion';
          if (id.includes('gsap')) return 'gsap';
          if (id.includes('@capacitor')) return 'capacitor';
          if (id.includes('i18next')) return 'i18n';
          if (/[\/](react|react-dom|scheduler|zustand)[\/]/.test(id)) return 'react';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
