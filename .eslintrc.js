module.exports = {
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  root: true,
  ignorePatterns: ['dist'],
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
      parser: '@typescript-eslint/parser',
      plugins: ['prefer-arrow-functions'],
      extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
      rules: {
        'prefer-arrow-functions/prefer-arrow-functions': [
          'error',
          { classPropertiesAllowed: true },
        ],
      },
    },
    {
      files: ['*.vue'],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:vue/vue3-recommended',
      ],
      rules: {
        'vue/singleline-html-element-content-newline': 'off',
        'vue/multi-word-component-names': 'off',
      },
    },
  ],
};
