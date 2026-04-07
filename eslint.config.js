import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist', 'node_modules', '.netlify'] },
  
  // 1. Global JS recommended
  js.configs.recommended,

  // 2. React/Web Development
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react/jsx-uses-react': 'off', // Not needed with React 17+ / jsx-runtime
      'react/jsx-uses-vars': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // 3. Node.js Environment Overrides
  {
    files: [
      'netlify/functions/**/*.js',
      'test_latency.js',
      'eslint.config.js',
      'vite.config.js',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    // For node files, we disable the react-specific rules to avoid errors if they don't apply
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
    },
  },
]
