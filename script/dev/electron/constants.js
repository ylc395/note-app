import { parseTsconfig } from 'get-tsconfig';

export const ELECTRON_TSCONFIG_PATH = './tsconfig.electron.json';
export const ELECTRON_TSCONFIG = parseTsconfig(ELECTRON_TSCONFIG_PATH);
export const RUNTIME_ENV = 'development';
