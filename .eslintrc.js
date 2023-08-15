module.exports = {
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  root: true,
  ignorePatterns: ['dist'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      extends: ['plugin:mobx/recommended', 'plugin:@typescript-eslint/recommended'],
    },
    {
      files: ['*.tsx'],
      parser: '@typescript-eslint/parser',
      extends: [
        'plugin:tailwindcss/recommended',
        'plugin:react-hooks/recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
      ],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: "CallExpression[callee.name='useCallback']",
            message: 'Do not useCallback. Use `useMemoizedFn` from ahooks if you really want to cache a function',
          },
        ],
      },
    },
    {
      files: ['*Controller.ts'],
      rules: { '@typescript-eslint/explicit-function-return-type': 'error' },
    },
    {
      files: ['*.js', 'test/**/*', 'src/client/driver/electron/**/*'],
      env: { node: true },
    },
  ],
};
