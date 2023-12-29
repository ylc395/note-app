import { APP_CLASS_NAME } from './infra/ui/constants';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/client/driver/web/**/*.{tsx,ts,html}'],
  important: `.${APP_CLASS_NAME}`,
  corePlugins: {
    preflight: false,
  },
};
