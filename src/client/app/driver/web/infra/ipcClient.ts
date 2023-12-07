import { mapValues, wrap, isObject } from 'lodash-es';

import type { Remote } from '@domain/infra/remote';
import type { IpcResponse } from '@domain/infra/transport';
import { InvalidInputError } from '@domain/model/Error';

declare global {
  interface Window {
    electronIpcHttpClient?: Remote;
  }
}

const ipcClient = window.electronIpcHttpClient
  ? (mapValues(window.electronIpcHttpClient, (method) =>
      wrap(method, async (func, ...args: unknown[]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = (await func.apply(window.electronIpcHttpClient, args as any)) as IpcResponse;

        if (res.status < 200 || res.status > 299) {
          const { error } = res.body;

          if (InvalidInputError.is(error)) {
            throw new InvalidInputError(error.issues);
          }

          throw isObject(error) ? Object.assign(new Error(), { stack: undefined }, error) : new Error(String(error));
        }

        return res;
      }),
    ) as Remote)
  : undefined;

export default ipcClient;
