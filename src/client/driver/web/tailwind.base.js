import assert from 'assert';
import { last } from 'lodash-es';

import { APP_NAME } from '../../../shared/domain/infra/constants';
import { tokens, tokenPathToCSSVariableName } from './designToken';

function tokensToTheme(tokens) {
  const theme = {};

  function traverse(tokens, path = []) {
    if (typeof tokens === 'string') {
      const cssProperty = last(path);

      if (!theme[cssProperty]) {
        theme[cssProperty] = {};
      }

      const themePath = path
        .slice(0, -1)
        .filter((key) => key !== 'default')
        .join('-');

      theme[cssProperty][themePath] = `var(${tokenPathToCSSVariableName(path)})`;
    } else if (typeof tokens === 'object') {
      for (const key of Object.keys(tokens)) {
        traverse(tokens[key], [...path, key]);
      }
    } else {
      assert.fail(`invalid tokens: ${tokens}`);
    }
  }

  traverse(tokens);

  return theme;
}

/** @type {import('tailwindcss').Config} */
export default {
  important: `.${APP_NAME}`,
  theme: tokensToTheme(tokens),
  corePlugins: {
    preflight: false,
  },
};
