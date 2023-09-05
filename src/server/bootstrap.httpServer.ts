import { isMainThread, parentPort } from 'node:worker_threads';
import type { AppServerStatus } from 'model/app';

/** used in development env */
import './driver/enableEsm';
/*******/
import bootstrapHttpServer from './driver/localHttpServer/bootstrap';

(async function () {
  const { port, terminate } = await bootstrapHttpServer();

  if (!isMainThread && parentPort) {
    parentPort.on('message', async (message) => {
      switch (message.type) {
        case 'offline':
          await terminate();
          parentPort?.postMessage({ type: 'terminated' });
          break;

        default:
          break;
      }
    });
    parentPort.postMessage({ type: 'started', payload: { port } satisfies AppServerStatus });
  }
})();
