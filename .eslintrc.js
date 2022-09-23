module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['eslint:recommended'],
  plugins: ['prefer-arrow-functions'],
  root: true,
  ignorePatterns: ['dist'],
  rules: {
    'prefer-arrow-functions/prefer-arrow-functions': [
      'error',
      { classPropertiesAllowed: true },
    ],
  },
  overrides: [
    {
      files: ['./*.js', 'script/**/*', 'src/client/driver/electron/**/*'],
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
