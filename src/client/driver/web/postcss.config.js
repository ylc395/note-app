import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default {
  plugins: {
    tailwindcss: {
      config: path.join(path.dirname(fileURLToPath(import.meta.url)), 'tailwind.config.js'),
    },
    autoprefixer: {},
  },
};
