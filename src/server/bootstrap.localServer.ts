import { parentPort } from 'node:worker_threads';
import { expose } from 'comlink';
import nodeEndpoint from 'comlink/dist/umd/node-adapter.js';

import LocalServer from './driver/localHttpServer/index.js';

if (parentPort) {
  expose(new LocalServer(), nodeEndpoint.default(parentPort));
}
