import { IS_DEV } from '@domain/infra/constants.js';
import bootstrapElectron from './driver/electron/bootstrap.js';

process.traceProcessWarnings = IS_DEV;
await bootstrapElectron();
