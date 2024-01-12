import 'reflect-metadata';
import { container } from 'tsyringe';

import { IS_DEV } from '@domain/infra/constants.js';
import { token as loggerToken } from '@domain/infra/logger.js';

import ElectronRuntime from './driver/runtime/Electron/index.js';

process.traceProcessWarnings = IS_DEV;
container.registerInstance(loggerToken, console); // todo: use disk log for production

const electronRuntime = new ElectronRuntime();
electronRuntime.bootstrap();
