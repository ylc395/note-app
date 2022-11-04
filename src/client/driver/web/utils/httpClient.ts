import mapValues from 'lodash/mapValues';
import wrap from 'lodash/wrap';

import type { Remote } from 'infra/Remote';
import { InvalidInputError, type InvalidInputErrorCause } from 'model/Error';
import type { IpcResponse } from 'driver/electron/ipc';

declare global {
  interface Window {
    electronIpc?: Remote;
  }
}

export const ipcClient = window.electronIpc
  ? (mapValues(window.electronIpc, (method) => {
      return wrap(method, async (func, ...args: unknown[]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { status, body } = (await func.apply(window.electronIpc, args as any)) as IpcResponse;

        if (status < 200 || status > 299) {
          const { error } = body;

          if (status >= 400 && status < 500 && error) {
            throw new InvalidInputError(
              `Request Failed: ${error.message}.`,
              error.cause ? { cause: error.cause as InvalidInputErrorCause } : undefined,
            );
          }

          throw new Error(`Request Failed: ${error?.message || 'unknown reason'}`);
        }

        return { status, body };
      });
    }) as Remote)
  : undefined;

export const httpClient: Remote = {
  async get<T>() {
    return {} as T;
  },
  async post<T>() {
    return {} as T;
  },
};
