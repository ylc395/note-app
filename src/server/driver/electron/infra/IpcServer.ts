import { Server, type CustomTransportStrategy } from '@nestjs/microservices';
import type { ExceptionFilter } from '@nestjs/common';
import { ipcMain } from 'electron';
import { match, type MatchFunction } from 'path-to-regexp';
import isError from 'lodash/isError';
import toPlainObject from 'lodash/toPlainObject';

import { InvalidInputError } from 'model/Error';
import { FAKE_HTTP_CHANNEL, type FakeHttpRequest, type FakeHttpResponse } from 'client/driver/electron/fakeHttp';

export default class ElectronIpcServer extends Server implements CustomTransportStrategy {
  #routeMap = new Map<string, MatchFunction>();

  listen(cb: () => void) {
    const allPaths = Array.from(this.getHandlers().keys()).map((pattern) => JSON.parse(pattern).path);

    for (const path of allPaths) {
      this.#routeMap.set(path, match(path));
    }

    ipcMain.handle(FAKE_HTTP_CHANNEL, async (e, req: FakeHttpRequest<unknown>): Promise<FakeHttpResponse<unknown>> => {
      this.#populateRequest(req);

      const pattern = this.normalizePattern({ path: req.originPath || '', method: req.method });
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

  #populateRequest(req: FakeHttpRequest<unknown>) {
    for (const [path, matcher] of this.#routeMap.entries()) {
      const result = matcher(req.path);

      if (!result) {
        continue;
      }

      const { params } = result;
      req.params = params as Record<string, string>;
      req.originPath = path;
      break;
    }
  }

  close() {
    ipcMain.removeHandler(FAKE_HTTP_CHANNEL);
  }
}

export class RawExceptionFilter implements ExceptionFilter {
  catch(exception: unknown) {
    throw exception;
  }
}
