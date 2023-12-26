/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/client/driver/web/**/*.{tsx,ts,html}'],
  important: '.note-app',
  corePlugins: {
    preflight: false,
  },
};
