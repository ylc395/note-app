import { APP_NAME } from '../../../domain/shared/infra/constants';

function colorWithOpacity(hex, opacity) {
  opacity = Math.min(Math.max(opacity, 0), 1);

  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');

  return `#${hex.replace(/^#/, '')}${alpha}`;
}

/** @type {import('tailwindcss').Config} */
export default {
  important: `.${APP_NAME}`,
  // theme: {
  //   backgroundColor: {
  //     tree: {
  //       highlight: '#f4f4f5',
  //     },
  //     layout: {
  //       DEFAULT: '#fff',
  //       highlight: '#f4f4f5',
  //     },
  //     button: {
  //       primary: {
  //         DEFAULT: '#2f2f31',
  //         highlight: colorWithOpacity('#2f2f31', 0.9),
  //       },
  //       secondary: {
  //         DEFAULT: '#f6f6f7',
  //         highlight: colorWithOpacity('#f6f6f7', 0.9),
  //       },
  //       ghost: {
  //         DEFAULT: 'transparent',
  //         highlight: '#f4f4f5',
  //       },
  //     },
  //   },
  //   textColor: {
  //     button: {
  //       primary: '#f8fafc',
  //     },

  //     text: {
  //       primary: '#090911',
  //       secondary: '#71717a',
  //     },
  //   },
  //   borderColor: {
  //     layout: '#e4e4e7',
  //   },
  // },
  content: ['./src/driver/client/web/**/*.{tsx,ts,html}'],
};
