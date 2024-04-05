import { isPlainObject, mapValues } from 'lodash-es';
import assert from 'node:assert';

import { APP_NAME } from '../../../shared/domain/infra/constants';
import { tokens, tokenPathToCSSVariableName } from './designToken';

function tokensToTheme(tokens, path = []) {
  if (typeof tokens === 'string') {
    return `var(${tokenPathToCSSVariableName(path)})`;
  }

  if (isPlainObject(tokens)) {
    return mapValues(tokens, (value, key) => tokensToTheme(value, [...path, key]));
  }

  assert.fail('invalid tokens');
}

/** @type {import('tailwindcss').Config} */
export default {
  important: `.${APP_NAME}`,
  theme: tokensToTheme(tokens),
  corePlugins: {
    preflight: false,
  },
};
