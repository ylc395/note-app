import { parentPort } from 'node:worker_threads';
import { expose } from 'comlink';
import nodeEndpoint from 'comlink/dist/umd/node-adapter';
/** used in development env */
import './driver/enableEsm';
/*******/

import LocalServer from './driver/localHttpServer';

if (parentPort) {
  expose(new LocalServer(), nodeEndpoint(parentPort));
}
