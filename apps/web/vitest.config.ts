import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
      environment: 'jsdom',
      globals: true,
    },
  }),
);
