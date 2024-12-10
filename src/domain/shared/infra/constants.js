/** this file is used by both dev scripts and app code, so we don't use .ts file */
export const APP_NAME = 'my-note-app';

export const WEB_ROOT_ID = 'app';

export const IS_DEV = process.env.NODE_ENV === 'development'; // todo: 移除 process.env，使用 import.meta.env。需要相关工具支持，例如 https://github.com/runtime-env/import-meta-env/issues/1633。

export const IS_TEST = process.env.NODE_ENV === 'test';

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
