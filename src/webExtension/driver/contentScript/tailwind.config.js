/* eslint-env node */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./**/*.{tsx,ts}'],
  theme: {
    extend: {},
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
