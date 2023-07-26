import browser, { Tabs } from 'webextension-polyfill';
import isObject from 'lodash/isObject';

const MESSAGE_TYPE = '__REMOTE_API_CALL';

export function getRemoteApi<T>(tabId?: NonNullable<Tabs.Tab['id']>) {
  return new Proxy(
    {},
    {
      get(target, p) {
        return (...args: unknown[]) => {
          const message = { type: MESSAGE_TYPE, api: p, args };

          if (tabId) {
            return browser.tabs.sendMessage(tabId, message);
          }

          return browser.runtime.sendMessage(message);
        };
      },
    },
  ) as T;
}

export function exposeApi(api: unknown) {
  if (!isObject(api)) {
    throw new Error('not object');
  }

  browser.runtime.onMessage.addListener((message) => {
    if (isObject(message) && 'type' in message && message.type === MESSAGE_TYPE) {
      if (
        'api' in message &&
        typeof message.api === 'string' &&
        message.api in api &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof (api as any)[message.api] === 'function' &&
        'args' in message &&
        Array.isArray(message.args)
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Promise.resolve((api as any)[message.api](...message.args));
      }
    }
  });
}
