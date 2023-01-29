import mapValues from 'lodash/mapValues';
import wrap from 'lodash/wrap';
import isObject from 'lodash/isObject';

import type { Remote } from 'infra/Remote';
import { InvalidInputError } from 'model/Error';
import type { IpcResponse } from 'driver/electron/ipc';

declare global {
  interface Window {
    electronIpc?: Remote;
  }
}

export const ipcClient = window.electronIpc
  ? (mapValues(window.electronIpc, (method) =>
      wrap(method, async (func, ...args: unknown[]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { status, body } = (await func.apply(window.electronIpc, args as any)) as IpcResponse;

        if (status < 200 || status > 299) {
          const { error } = body;

          if (InvalidInputError.is(error)) {
            throw new InvalidInputError(error.issues);
          }

          throw isObject(error) ? Object.assign(new Error(), { stack: undefined }, error) : new Error(String(error));
        }

        return { status, body };
      }),
    ) as Remote)
  : undefined;

export const httpClient: Remote = {
  async get<T>() {
    return {} as T;
  },
  async post<T>() {
    return {} as T;
  },
  async delete<T>() {
    return {} as T;
  },
  async patch<T>() {
    return {} as T;
  },
  async put<T>() {
    return {} as T;
  },
};
