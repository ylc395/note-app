import browser from 'webextension-polyfill';

import { Statuses, REMOTE_ID, type MainApp as IMainApp } from 'infra/MainApp';
import type { RemoteCallable } from 'infra/remoteApi';

const HOST = 'http://localhost:3001';
const TOKEN_KEY = 'token';

export default class MainApp implements IMainApp, RemoteCallable {
  readonly __remoteId = REMOTE_ID as string;

  async getStatus() {
    const token = await this.getToken();

    if (!token) {
      return Statuses.EmptyToken;
    }

    try {
      const res = await fetch(`${HOST}/ping`, { headers: { Authorization: token } });

      if (res.status === 200) {
        return Statuses.Online;
      } else if (res.status === 403) {
        return Statuses.InvalidToken;
      } else {
        return Statuses.ConnectionFailure;
      }
    } catch (e) {
      return Statuses.ConnectionFailure;
    }
  }

  setToken(token: string) {
    return browser.storage.local.set({ [TOKEN_KEY]: token });
  }

  private async getToken() {
    return (await browser.storage.local.get(TOKEN_KEY))[TOKEN_KEY];
  }

  async fetch<T, K = void>(method: 'GET' | 'POST' | 'PUT' | 'PATCH', url: string, body?: K) {
    const token = await this.getToken();

    if (!token) {
      throw new Error('no token');
    }
    // there is no `window` in background env. so use `globalThis`
    const res = await globalThis.fetch(`${HOST}${url}`, {
      method,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      headers: {
        Authorization: token,
        ...(body ? { 'Content-Type': body instanceof FormData ? 'multipart/form-data' : 'application/json' } : null),
      },
    });

    if (!res.ok) {
      return null;
    }

    const responseType = res.headers.get('Content-Type');

    if (responseType?.startsWith('application/json')) {
      return (await res.json()) as T;
    }

    return null;
  }
}
