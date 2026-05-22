module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.eslint.json',
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'prettier',
  ],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    'no-console': 'off',
    'import/prefer-default-export': 'off',
    'consistent-return': 'off',
    'no-underscore-dangle': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_' },
    ],
  },
  ignorePatterns: ['dist', 'node_modules'],
};
