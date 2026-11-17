import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-static';
import { configDefaults, defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const svelteClient = fileURLToPath(
  new URL('node_modules/svelte/src/index-client.js', import.meta.url),
);

// Specs needing a DOM: the component ones (named after their PascalCase
// component) and localStorage. The others run in node, much faster to start.
const domSpecs = [
  'src/**/__tests__/[A-Z]*.spec.ts',
  'src/lib/progression/__tests__/local-storage-repository.spec.ts',
];

export default defineConfig({
  plugins: [
    sveltekit({
      adapter: adapter({
        fallback: 'index.html',
      }),
      alias: {
        $lib: 'src/lib',
      },
    }),
  ],
  test: {
    alias: [{ find: /^svelte$/, replacement: svelteClient }],
    projects: [
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: domSpecs,
          setupFiles: ['vitest.setup.ts', '@testing-library/svelte/vitest'],
        },
      },
      {
        extends: true,
        test: {
          name: 'logic',
          environment: 'node',
          include: ['src/**/*.spec.ts'],
          exclude: [...configDefaults.exclude, ...domSpecs],
        },
      },
    ],
  },
});
