import js from '@eslint/js';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

export default [
  {
    ignores: ['**/dist/**', '**/coverage/**', '**/playwright-report/**', '**/test-results/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['apps/web/**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: globals.browser,
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx,vue}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['apps/api/**/*.ts', 'packages/**/*.ts', '*.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
];

