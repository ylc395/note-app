const path = require('path');

module.exports = {
  plugins: {
    tailwindcss: {
      config: path.join(__dirname, 'tailwind.config.js'),
    },
    autoprefixer: {},
    // tailwind use rem unit. Not suitable for a web component that will appear in any page.
    // use this plugin to transform to px
    '@thedutchcoder/postcss-rem-to-px': {},
  },
};
