module.exports = [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
  },
  {
    // Global variables and parser settings
    languageOptions: {
      globals: {
        browser: 'readonly',
        node: 'readonly',
        es2022: 'readonly',
      },
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    // Apply to all JS/TS files
    files: ['**/*.{js,jsx,ts,tsx}'],
    // Combine recommended rules manually
    rules: {
      // TypeScript recommended rules
      ...require('@typescript-eslint/eslint-plugin').configs.recommended.rules,
      // TypeScript type‑checking rules
      ...require('@typescript-eslint/eslint-plugin').configs['recommended-requiring-type-checking'].rules,
      // Prettier integration (turn off conflicting rules)
      ...require('eslint-config-prettier').rules,
      // Project‑specific rule example
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];


