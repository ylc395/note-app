module.exports = {
  extends: ['eslint:recommended', 'plugin:lodash/recommended'],
  plugins: ['lodash', 'mobx'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  root: true,
  ignorePatterns: ['dist'],
  rules: {
    'lodash/prefer-lodash-typecheck': 'off',
    'lodash/prefer-lodash-method': 'off',
    'lodash/prefer-constant': 'off',
    'lodash/prefer-immutable-method': 'off',
    'lodash/path-style': 'off',
  },
  overrides: [
    {
      files: ['src/client/**', 'src/webExtension/popup/**'],
      excludedFiles: ['**/components/**'],
      extends: ['plugin:mobx/recommended'],
    },
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      extends: ['plugin:@typescript-eslint/recommended', 'plugin:react-hooks/recommended', 'plugin:react/recommended'],
      settings: {
        react: {
          version: 'detect',
        },
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      extends: ['plugin:tailwindcss/recommended'],
      excludedFiles: ['./src/webExtension/driver/contentScript/**'],
    },
    {
      files: ['*.tsx'],
      extends: ['plugin:react/jsx-runtime'],
    },
    {
      files: ['*Controller.ts'],
      rules: { '@typescript-eslint/explicit-function-return-type': 'error' },
    },
    {
      files: ['./*.js', 'test/**/*', 'script/**/*', 'src/client/driver/desktop/**/*'],
      env: { node: true },
    },
    {
      files: ['src/client/driver/web/**/*'],
      env: { browser: true },
    },
  ],
};
