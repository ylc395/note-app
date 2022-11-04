module.exports = {
  extends: ['eslint:recommended', 'plugin:lodash/recommended'],
  plugins: ['lodash'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  root: true,
  ignorePatterns: ['dist'],
  rules: {
    'lodash/prefer-lodash-typecheck': 'off',
    'lodash/prefer-lodash-method': 'off',
    'lodash/prefer-constant': 'off',
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
      parser: '@typescript-eslint/parser',
      extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    },
    {
      files: ['*.vue'],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
      extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:vue/vue3-recommended'],
      rules: {
        'vue/singleline-html-element-content-newline': 'off',
        'vue/multi-word-component-names': 'off',
        'vue/max-attributes-per-line': 'off',
      },
    },
    {
      files: ['index.vue'],
      rules: {
        'vue/require-name-property': 'error',
      },
    },
  ],
};
