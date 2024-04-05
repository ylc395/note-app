/** this file is used by both dev scripts and app code, so we don't use .ts file */

export const APP_NAME = 'my-note-app';
export const IS_DEV = process.env.NODE_ENV === 'development';
export const IS_TEST = process.env.NODE_ENV === 'test';
