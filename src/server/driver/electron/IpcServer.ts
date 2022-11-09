import { Server, type CustomTransportStrategy } from '@nestjs/microservices';
import type { ExceptionFilter } from '@nestjs/common';
import { ipcMain } from 'electron';
import { match } from 'path-to-regexp';
import isError from 'lodash/isError';
import toPlainObject from 'lodash/toPlainObject';

import { InvalidInputError } from 'model/Error';
import { IPC_CHANNEL, type IpcRequest, type IpcResponse } from 'client/driver/electron/ipc';
import { fromPatternToRequest } from './handler';

export default class ElectronIpcServer extends Server implements CustomTransportStrategy {
  listen(cb: () => void) {
    const allPaths = Array.from(this.getHandlers().keys()).map((pattern) => fromPatternToRequest(pattern).path);
    const matchers = allPaths.map((path) => match(path));

    ipcMain.handle(IPC_CHANNEL, async (e, req: IpcRequest<unknown>): Promise<IpcResponse<unknown>> => {
      let originPath = '';

      for (const [i, matcher] of matchers.entries()) {
        const result = matcher(req.path);

        if (!result) {
          continue;
        }

        const { params } = result;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        originPath = allPaths[i]!;
        req.params = params as Record<string, string>;
        break;
      }

      const pattern = this.normalizePattern({ path: originPath, method: req.method });
      const handler = this.messageHandlers.get(pattern);

      if (!handler) {
        return {
          status: 404,
          body: { error: { message: `can not handle request: ${req.method} ${req.path}`, cause: req } },
        };
      }

      try {
        const result = await handler(req);
        return { status: 200, body: result };
      } catch (e) {
        if (!isError(e)) {
          this.logger.error(e);
          return { status: 500, body: { error: toPlainObject(e) } };
        }

        const status = e instanceof InvalidInputError ? 400 : 500;

        if (!(e instanceof InvalidInputError)) {
          this.logger.error(e.message, e.stack);
        }

        return { status, body: { error: e instanceof InvalidInputError ? toPlainObject(e) : 'Server Error' } };
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
