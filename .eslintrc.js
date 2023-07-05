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
      files: ['src/client/**'],
      excludedFiles: ['**/components/**'],
      extends: ['plugin:mobx/recommended'],
    },
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:react-hooks/recommended',
        'plugin:react/recommended',
        'plugin:tailwindcss/recommended',
      ],
      settings: {
        react: {
          version: 'detect',
        },
      },
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
      files: ['./*.js', 'test/**/*', 'script/**/*', 'src/client/driver/electron/**/*'],
      env: { node: true },
    },
    {
      files: ['src/client/driver/web/**/*'],
      env: { browser: true },
    },
  ],
};
