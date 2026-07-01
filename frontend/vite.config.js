import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5173,
    // Proxy API calls to the Express gateway during dev so the browser only ever
    // talks to the same origin (instructions.md §2).
    proxy: {
      '/api': {
        target: process.env.VITE_GATEWAY_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['./vitest-setup.js'],
  },
});
