import 'reflect-metadata';
import { IS_DEV } from '@domain/infra/constants.js';
import ElectronRuntime from './driver/runtime/Electron/index.js';

process.traceProcessWarnings = IS_DEV;

const electronRuntime = new ElectronRuntime();
electronRuntime.bootstrap();
