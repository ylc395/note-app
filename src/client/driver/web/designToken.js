import { compact, last } from 'lodash-es';

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
 * level 1: ui component names
 * level 2: variant (optional)
 * level 3: state (optional)
 * level 4: css properties. available properties: https://tailwindcss.com/docs/theme#configuration-reference
 *
 */
export const tokens = {
  layout: {
    default: {
      borderColor: '#e4e4e7',
      backgroundColor: '#fff',
    },
  },
  tree: {
    highlight: {
      backgroundColor: '#f4f4f5',
    },
  },
  text: {
    primary: {
      textColor: '#090911',
    },
    secondary: {
      textColor: '#71717a',
    },
  },
  button: {
    primary: {
      default: {
        backgroundColor: '#2f2f31',
        textColor: '#f8fafc',
      },
      highlight: {
        backgroundColor: colorWithOpacity('#2f2f31', 0.9),
      },
      focus: {
        ringColor: '#94a3b8',
      },
    },
    secondary: {
      default: {
        backgroundColor: '#f6f6f7',
        textColor: '#0f172a',
      },
      highlight: {
        backgroundColor: colorWithOpacity('#f6f6f7', 0.8),
      },
    },
    ghost: {
      default: {
        backgroundColor: '#fff',
        textColor: '#0f172a',
      },
      highlight: {
        backgroundColor: '#f4f4f5',
      },
    },
    transparent: {
      backgroundColor: 'transparent',
    },
    danger: {
      default: {
        backgroundColor: '#ce4943',
        textColor: '#f8fafc',
      },
      highlight: {
        backgroundColor: colorWithOpacity('#ce4943', 0.9),
      },
    },
  },
};

export function tokenPathToCSSVariableName(path) {
  const levelPath = path.slice(0, -1);
  const cssProperty = last(path);

  return `--${compact([...levelPath.map((level) => (level === 'default' ? '' : level)), cssProperty]).join('-')}`;
}
