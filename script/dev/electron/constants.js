import path from 'node:path';
import { get } from 'lodash-es';
import fs from 'fs-extra';

export const TSCONFIG = fs.readJSONSync(path.resolve('./tsconfig.json'));
export const OUTPUT = get(TSCONFIG, 'compilerOptions.outDir');
export const ENV = 'development';
