/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/client/driver/web/**/*.{tsx,ts,html}'],
  important: '#app',
  corePlugins: {
    preflight: false,
  },
};
