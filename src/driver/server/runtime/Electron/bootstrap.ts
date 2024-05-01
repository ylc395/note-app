import 'reflect-metadata';
import { IS_DEV } from '@domain/shared/infra/constants.js';
import ElectronRuntime from './index.js';

process.traceProcessWarnings = IS_DEV;

const electronRuntime = new ElectronRuntime();
electronRuntime.bootstrap();
