import { observable, makeObservable, runInAction } from 'mobx';
import browser from 'webextension-polyfill';

import type { MaterialDTO } from 'shared/interface/material';
import type { NoteBodyDTO, NoteDTO, NoteVO } from 'shared/interface/note';
import type { MemoDTO } from 'shared/interface/memo';
import { EntityTypes } from 'shared/interface/entity';

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
  private token?: string;

  constructor(checkOnline?: true) {
    makeObservable(this);
    this.init(checkOnline);
  }

  private async init(checkOnline?: true) {
    this.token = (await browser.storage.local.get(TOKEN_KEY))[TOKEN_KEY];

    if (checkOnline) {
      this.checkOnline();
    }
  }

  async checkOnline() {
    if (!this.token) {
      runInAction(() => {
        this.status = Statuses.EmptyToken;
      });
      return;
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

  private async fetch<T, K>(method: 'GET' | 'POST' | 'PUT', url: string, body?: K) {
    if (!this.token) {
      throw new Error('no token');
    }

    // there is no `window` in background env. so use `globalThis`
    const res = await globalThis.fetch(`${HOST}${url}`, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        Authorization: this.token,
        ...(body ? { 'Content-Type': 'application/json' } : null),
      },
    });

    if (!res.ok) {
      throw new Error('http error');
    }

    const responseType = res.headers.get('Content-Type');

    if (responseType?.startsWith('application/json')) {
      return (await res.json()) as T;
    }

    return null;
  }

  async save(
    saveAs: EntityTypes,
    payload: { title: string; content: string; contentType: 'html' | 'md'; sourceUrl: string; parentId: string | null },
  ) {
    if (saveAs === EntityTypes.Material) {
      await this.fetch<void, MaterialDTO>('POST', '/materials', {
        name: payload.title,
        sourceUrl: payload.sourceUrl,
        file: { mimeType: payload.contentType === 'html' ? 'text/html' : 'text/markdown', data: payload.content },
        parentId: payload.parentId,
      });
    }

    if (saveAs === EntityTypes.Note) {
      const note = await this.fetch<NoteVO, NoteDTO>('POST', '/notes', {
        title: payload.title,
        parentId: payload.parentId,
      });

      if (!note) {
        throw new Error('create note failed');
      }

      await this.fetch<void, NoteBodyDTO>('PUT', `/notes/${note.id}/body`, { content: payload.content });
    }

    if (saveAs === EntityTypes.Memo) {
      await this.fetch<void, MemoDTO>('POST', '/memos', {
        content: payload.content,
        parentId: payload.parentId || undefined,
      });
    }
  }
}
