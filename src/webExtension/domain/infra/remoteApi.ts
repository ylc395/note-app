import browser, { Tabs } from 'webextension-polyfill';
import isObject from 'lodash/isObject';

export type RemoteId<T = unknown> = string | T;

export interface RemoteCallable {
  readonly __remoteId: string;
}

interface RemoteCallMessage {
  __remoteId: string;
  api: string;
  args: unknown[];
}

const isRemoteCallPayload = (message: unknown): message is RemoteCallMessage => {
  return (
    isObject(message) &&
    '__remoteId' in message &&
    typeof message.__remoteId === 'string' &&
    'api' in message &&
    typeof message.api === 'string' &&
    'args' in message &&
    Array.isArray(message.args)
  );
};

export function getRemoteApi<T extends RemoteCallable>(remoteId: RemoteId<T>, tabId?: NonNullable<Tabs.Tab['id']>) {
  if (typeof remoteId !== 'string') {
    throw new Error('remote id must be a string');
  }

  return new Proxy(
    {},
    {
      get(target, p) {
        if (typeof p !== 'string') {
          throw new Error('string only');
        }

        return (...args: unknown[]) => {
          const message: RemoteCallMessage = { __remoteId: remoteId, api: p, args };

          if (tabId) {
            return browser.tabs.sendMessage(tabId, message);
          }

          return browser.runtime.sendMessage(message);
        };
      },
    },
  ) as T;
}

const apis: Record<string, unknown> = {};
let listening = false;

export function exposeApi<T extends RemoteCallable>(api: T) {
  if (typeof api.__remoteId !== 'string') {
    throw new Error('invalid api');
  }

  if (api.__remoteId in apis) {
    throw new Error('can not expose again');
  }

  apis[api.__remoteId] = api;

  if (listening) {
    return;
  }

  browser.runtime.onMessage.addListener((message) => {
    if (isRemoteCallPayload(message)) {
      const { api, args, __remoteId } = message;
      const remoteObj = apis[__remoteId];

      if (!isObject(remoteObj)) {
        throw new Error(`no remoteObj ${__remoteId}`);
      }

      if (
        api in remoteObj &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof (remoteObj as any)[api] === 'function'
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Promise.resolve((remoteObj as any)[api](...args));
      } else {
        throw new Error('invalid remote api call');
      }
    }
  });

  listening = true;
}
