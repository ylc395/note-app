import { getTsconfig } from 'get-tsconfig';

export const TSCONFIG = getTsconfig('./tsconfig.electron.json').config;
export const ENV = 'development';
