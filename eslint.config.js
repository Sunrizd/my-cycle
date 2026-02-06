import js from '@eslint/js';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  { ignores: ['dist/'] },
  js.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        globals: {
            ...globals.browser,
            ...globals.node,
            // Vitest globals
            describe: 'readonly',
            it: 'readonly', 
            expect: 'readonly',
            vi: 'readonly',
            beforeEach: 'readonly',
            afterEach: 'readonly'
        }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-undef': 'warn' // downgrade to warn if globals missing
    }
  }
];
