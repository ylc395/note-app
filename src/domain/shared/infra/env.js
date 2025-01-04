/** this file is used by both dev scripts and app code, so we don't use .ts file */

export const IS_DEV = import.meta.env.RUNTIME_ENV === 'development';

export const IS_TEST = import.meta.env.RUNTIME_ENV === 'test';

export const IS_PRODUCTION = import.meta.env.RUNTIME_ENV === 'production';

export const APP_NAME = 'my-note-app';
