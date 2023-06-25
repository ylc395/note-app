/** used in development env */
import './driver/enableEsm';
/*******/

import bootstrapHttpServer from './driver/localHttpServer/bootstrap';
import bootstrapElectron from './driver/electron/bootstrap';

(async function () {
  await bootstrapElectron();
  await bootstrapHttpServer();
})();
