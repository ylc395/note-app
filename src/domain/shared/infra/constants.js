/** this file is used by both dev scripts and app code, so we don't use .ts file */
export const APP_NAME = 'my-note-app';

export const WEB_ROOT_ID = 'app';

// todo: 移除 process.env，使用 import.meta.env。需要相关工具支持，例如 https://github.com/runtime-env/import-meta-env/issues/1633。
const NODE_ENV = process.env.NODE_ENV || import.meta.env.NODE_ENV;

export const IS_DEV = NODE_ENV === 'development';

export const IS_TEST = NODE_ENV === 'test';

export const IS_PRODUCTION = NODE_ENV === 'production';
