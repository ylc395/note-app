// https://prettier.io/docs/en/options.html
module.exports = {
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 120,
  overrides: [
    {
      files: '*.json5',
      options: {
        parser: 'json', // 这里的 "parser" 应作 "output format" 理解
      },
    },
  ],
};
