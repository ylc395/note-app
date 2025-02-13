import animation from 'tailwindcss-animated';
import { APP_NAME } from '../../../domain/shared/infra/constants';

/** @type {import('tailwindcss').Config} */
export default {
  important: `.${APP_NAME}`,
  content: ['./src/driver/client/web/**/*.{tsx,ts,html}'],
  plugins: [animation],
};
