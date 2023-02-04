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
  },
  overrides: [
    {
      files: ['src/client/**/*'],
      extends: ['plugin:mobx/recommended'],
    },
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      extends: ['plugin:@typescript-eslint/recommended'],
    },
    {
      files: ['*.tsx'],
      extends: ['plugin:react-hooks/recommended', 'plugin:react/recommended', 'plugin:react/jsx-runtime'],
    },
    {
      files: ['*Controller.ts'],
      rules: { '@typescript-eslint/explicit-function-return-type': 'error' },
    },
    {
      files: ['./*.js', 'script/**/*', 'src/client/driver/electron/**/*'],
      env: { node: true },
    },
    {
      files: ['src/client/driver/web/**/*'],
      env: { browser: true },
    },
  ],
};
