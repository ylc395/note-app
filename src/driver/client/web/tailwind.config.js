import baseConfig from './tailwind.base';

/** @type {import('tailwindcss').Config} */
export default {
  ...baseConfig,
  content: ['./src/driver/client/web/**/*.{tsx,ts,html}'],
};
