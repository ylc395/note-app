/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/client/app/driver/web/**/*.{tsx,ts,html}', './src/client/shared/components/**/*.{tsx,ts,html}'],
  important: '#app',
  corePlugins: {
    preflight: false,
  },
};
