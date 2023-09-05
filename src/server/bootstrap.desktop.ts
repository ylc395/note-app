/** used in development env */
import './driver/enableEsm';
/*******/

import bootstrapElectron from './driver/electron/bootstrap';

(async function () {
  await bootstrapElectron();
})();
