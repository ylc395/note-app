import { compact } from 'lodash-es';

function colorWithOpacity(hex, opacity) {
  opacity = Math.min(Math.max(opacity, 0), 1);

  let hexWithAlpha = '';

  if (hex.startsWith('#')) {
    hex = hex.replace(/^#/, '');
    for (let i = 0; i < 3; i++) {
      hexWithAlpha += hex[i] + hex[i];
    }
  }

  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');

  return `#${hexWithAlpha}${alpha}`;
}

/**
 * design tokens of this project
 *
 * level 1: css properties. available properties: https://tailwindcss.com/docs/theme#configuration-reference
 * level 2: ui component names
 * level 3: variant
 * level 4: state
 *
 */
export const tokens = {
  backgroundColor: {
    layer: {
      base: '#fff',
      main: '#fff',
    },
    button: {
      primary: {
        default: '#2f2f31',
        hover: colorWithOpacity('#2f2f31', 0.9),
      },
      secondary: {
        default: '#f6f6f7',
        hover: colorWithOpacity('#f6f6f7', 0.8),
      },
      danger: {
        default: '#ce4943',
        hover: colorWithOpacity('#ce4943', 0.9),
      },
    },
  },
  ringColor: {
    // ring is a kind of decoration made by `box-shadow`
    button: '#94a3b8',
  },
  textColor: {
    button: {
      primary: '#f8fafc',
      secondary: '#0f172a',
      danger: '#f8fafc',
    },
  },
};

export function tokenPathToCSSVariableName(path) {
  const [cssProperty, componentName, variant, state] = path;

  return `--${compact([componentName, variant, state, cssProperty]).join('-')}`;
}
