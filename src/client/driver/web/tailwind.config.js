const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [path.join(__dirname, './index.html'), path.join(__dirname, './**/*.{tsx,ts}')],
  important: '#app',
  corePlugins: {
    // todo: enable preflight after removing antd
    preflight: false,
  },
};
