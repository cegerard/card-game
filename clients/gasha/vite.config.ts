import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const svelteClient = fileURLToPath(
  new URL('node_modules/svelte/src/index-client.js', import.meta.url),
);

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['@testing-library/svelte/vitest'],
    alias: [{ find: /^svelte$/, replacement: svelteClient }],
  },
});
