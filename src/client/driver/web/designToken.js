import { compact } from 'lodash-es';

function colorWithOpacity(hex, opacity) {
  opacity = Math.min(Math.max(opacity, 0), 1);

  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');

  return `#${hex.replace(/^#/, '')}${alpha}`;
}

/**
 * design tokens of this project
 *
 * level 1: css properties. available properties: https://tailwindcss.com/docs/theme#configuration-reference
 * level 2: ui component names (optional)
 * level 3: variant (optional)
 * level 4: state (optional)
 *
 */
export const tokens = {
  backgroundColor: {
    common: {
      primary: '#fff',
      secondary: {
        default: '#fff',
        highlight: '#f4f4f5',
      },
    },
    button: {
      primary: {
        default: '#2f2f31',
        highlight: colorWithOpacity('#2f2f31', 0.9),
      },
      secondary: {
        default: '#f6f6f7',
        highlight: colorWithOpacity('#f6f6f7', 0.8),
      },
      ghost: {
        default: '#fff',
        highlight: '#f4f4f5',
      },
      transparent: 'transparent',
      danger: {
        default: '#ce4943',
        highlight: colorWithOpacity('#ce4943', 0.9),
      },
    },
  },
  textColor: {
    common: {
      primary: '#090911',
      secondary: '#71717a',
    },
    button: {
      primary: '#f8fafc',
      secondary: '#0f172a',
      ghost: '#0f172a',
      danger: '#f8fafc',
    },
  },
  borderColor: {
    common: '#e4e4e7',
  },
  ringColor: {
    // ring is a kind of decoration made by `box-shadow`
    button: {
      focus: '#94a3b8',
    },
  },
};

export function tokenPathToCSSVariableName(path) {
  const [cssProperty, componentName, variant, state] = path;

  return `--${compact([componentName, variant, state === 'default' ? '' : state, cssProperty]).join('-')}`;
}
