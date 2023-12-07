import { Server, type CustomTransportStrategy } from '@nestjs/microservices';
import type { ExceptionFilter } from '@nestjs/common';
import { ipcMain } from 'electron';
import { match, type MatchFunction } from 'path-to-regexp';
import { isError, toPlainObject } from 'lodash-es';
import assert from 'assert';

import { InvalidInputError } from '@domain/model/Error.js';
import { IPC_CHANNEL, type IpcRequest, type IpcResponse } from '@domain/infra/transport.js';
import Context from './Context.js';

export default class ElectronIpcServer extends Server implements CustomTransportStrategy {
  private readonly routeMap = new Map<string, MatchFunction>();

  listen(cb: () => void) {
    const allPaths = Array.from(this.getHandlers().keys()).map((pattern) => JSON.parse(pattern).path);

    for (const path of allPaths) {
      this.routeMap.set(path, match(path));
    }

    ipcMain.handle(IPC_CHANNEL, async (e, req: IpcRequest<unknown>): Promise<IpcResponse<unknown>> => {
      this.populateRequest(req);
      this.logger.log(req);

      assert(req.route, 'empty route for request');
      const pattern = this.normalizePattern({ path: req.route, method: req.method });
      const handler = this.messageHandlers.get(pattern);

      if (!handler) {
        return {
          status: 404,
          body: { error: { message: `can not handle request: ${req.method} ${req.path}`, cause: req } },
        };
      }

      const ctx = new Context();

      try {
        const result = await handler(req, ctx);
        return { status: 200, body: result, headers: ctx.getHeaders() };
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

  private populateRequest(req: IpcRequest<unknown>) {
    for (const [path, matcher] of this.routeMap.entries()) {
      const result = matcher(req.path);

      if (!result) {
        continue;
      }

      const { params } = result;
      req.params = params as Record<string, string>;
      req.route = path;
      break;
    }
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
