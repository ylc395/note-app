import { Server, type CustomTransportStrategy } from '@nestjs/microservices';
import type { ExceptionFilter } from '@nestjs/common';
import { ipcMain } from 'electron';
import isError from 'lodash/isError';

import { InvalidInputError, BusinessError } from 'model/Error';
import { IPC_CHANNEL, type IpcRequest, type IpcResponse } from 'client/driver/electron/ipc';

export default class ElectronIpcServer extends Server implements CustomTransportStrategy {
  listen(cb: () => void) {
    ipcMain.handle(IPC_CHANNEL, async (e, req: IpcRequest<unknown>): Promise<IpcResponse<unknown>> => {
      const pattern = this.normalizePattern({ path: req.path, method: req.method });
      const handler = this.messageHandlers.get(pattern);

      if (!handler) {
        return { status: 404, body: { error: `can not handle request: ${pattern}` } };
      }

      try {
        const result = await handler(req);
        return { status: 200, body: result };
      } catch (e) {
        if (!isError(e)) {
          this.logger.error(e);
          return { status: 500, body: { error: String(e) } };
        }

        if (!(e instanceof BusinessError)) {
          this.logger.error(e.message, e.stack);
        }

        const status = e instanceof InvalidInputError ? 400 : 500;
        return { status, body: { error: e.message } };
      }
    });
    cb();
  }
  close() {
    ipcMain.removeHandler(IPC_CHANNEL);
  }
}

export class RawExceptionFilter implements ExceptionFilter {
  catch(exception: unknown) {
    throw exception;
  }
}
