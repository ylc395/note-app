export const IS_DEV = import.meta.env.RUNTIME_ENV === 'development';

export const IS_TEST = import.meta.env.RUNTIME_ENV === 'test';

export const IS_PRODUCTION = import.meta.env.RUNTIME_ENV === 'production';

export { APP_NAME } from './constants.js';
