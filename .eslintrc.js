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
      extends: ['plugin:tailwindcss/recommended', 'plugin:mobx/recommended'],
      rules: {
        'mobx/missing-observer': 'off', // checked in runtime
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
