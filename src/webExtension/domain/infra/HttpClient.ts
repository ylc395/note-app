import { observable, makeObservable, runInAction } from 'mobx';
import browser from 'webextension-polyfill';

import type { MaterialDTO } from 'shared/interface/material';

const HOST = 'http://localhost:3001';
const TOKEN_KEY = 'token';

export enum Statuses {
  NotReady,
  Online,
  ConnectionFailure,
  EmptyToken,
  InvalidToken,
}

export default class HttpClient {
  @observable status: Statuses | string = Statuses.NotReady;
  @observable token?: string;

  constructor(checkOnline?: true) {
    makeObservable(this);
    this.init(checkOnline);
  }

  private async init(checkOnline?: true) {
    this.token = (await browser.storage.local.get(TOKEN_KEY))[TOKEN_KEY];

    if (checkOnline) {
      if (!this.token) {
        this.status = Statuses.EmptyToken;
        return;
      }

      this.checkOnline();
    }
  }

  private async checkOnline() {
    if (!this.token) {
      throw new Error('no token');
    }

    try {
      const res = await fetch(`${HOST}/ping`, { headers: { Authorization: this.token } });

      runInAction(() => {
        if (res.status === 200) {
          this.status = Statuses.Online;
        } else if (res.status === 403) {
          this.status = Statuses.InvalidToken;
        } else {
          this.status = `${res.status} ${res.statusText}`;
        }
      });
    } catch {
      runInAction(() => {
        this.status = Statuses.ConnectionFailure;
      });
    }
  }

  setToken(token: string) {
    browser.storage.local.set({ [TOKEN_KEY]: token });
    this.token = token;
    this.checkOnline();
  }

  async save(payload: { title: string; content: string; type: 'html' | 'md'; sourceUrl: string }) {
    if (!this.token) {
      throw new Error('no token');
    }

    const res = await fetch(`${HOST}/materials`, {
      method: 'POST',
      body: JSON.stringify({
        name: payload.title,
        sourceUrl: payload.sourceUrl,
        file: {
          mimeType: payload.type === 'html' ? 'text/html' : 'text/markdown',
          data: payload.content,
        },
        parentId: '8919e8a897094aebbbda0df7f58ef3ec',
      } satisfies MaterialDTO),
      headers: { 'Content-Type': 'application/json', Authorization: this.token },
    });
  }
}
