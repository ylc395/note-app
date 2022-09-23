module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['eslint:recommended'],
  root: true,
  ignorePatterns: ['dist'],
  overrides: [
    {
      files: ['.eslintrc.js', 'script/**/*', 'src/client/driver/electron/**/*'],
      env: { node: true },
    },
    {
      files: ['src/client/driver/web/**/*'],
      env: { browser: true },
    },
    {
      files: ['*.ts'],
      extends: ['plugin:@typescript-eslint/recommended', 'eslint:recommended'],
    },
  ],
};
