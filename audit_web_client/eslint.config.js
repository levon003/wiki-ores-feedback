import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

// Flat config replacing CRA's `eslint-config-react-app`.
export default [
  { ignores: ['build', 'dist', 'node_modules'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // The codebase has plenty of intentionally-unused vars; keep as warnings.
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
      // Pre-existing legacy debt inherited from the Devias template / original
      // code (unescaped apostrophes, stray DOM props, missing list keys, etc.).
      // Downgraded to warnings so lint can gate *new* code; promote back to
      // 'error' as the backlog is burned down. See DEVELOPMENT.md TODOs.
      'react/no-unescaped-entities': 'warn',
      'react/no-unknown-property': 'warn',
      'react/jsx-key': 'warn',
      'react/display-name': 'warn',
      'no-useless-escape': 'warn',
    },
  },
];
