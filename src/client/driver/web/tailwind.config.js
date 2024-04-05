import baseConfig from './tailwind.base';

/** @type {import('tailwindcss').Config} */
export default {
  ...baseConfig,
  content: ['./src/client/driver/web/**/*.{tsx,ts,html}'],
};
