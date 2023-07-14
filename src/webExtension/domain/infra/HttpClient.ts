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

  async save(
    saveAs: EntityTypes,
    payload: { title: string; content: string; type: 'html' | 'md'; sourceUrl: string; parentId: string | null },
  ) {
    if (!this.token) {
      throw new Error('no token');
    }

    const options: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: this.token },
    };

    if (saveAs === EntityTypes.Material) {
      await fetch(`${HOST}/materials`, {
        ...options,
        body: JSON.stringify({
          name: payload.title,
          sourceUrl: payload.sourceUrl,
          file: { mimeType: payload.type === 'html' ? 'text/html' : 'text/markdown', data: payload.content },
          parentId: payload.parentId,
        } satisfies MaterialDTO),
      });
    }

    if (saveAs === EntityTypes.Note) {
      const res = await fetch(`${HOST}/notes`, {
        ...options,
        body: JSON.stringify({ title: payload.title, parentId: payload.parentId } satisfies NoteDTO),
      });

      const note: NoteVO = await res.json();

      await fetch(`${HOST}/notes/${note.id}/body`, {
        ...options,
        body: JSON.stringify({ content: payload.content } satisfies NoteBodyDTO),
      });
    }

    if (saveAs === EntityTypes.Memo) {
      await fetch(`${HOST}/memos`, {
        ...options,
        body: JSON.stringify({ content: payload.content, parentId: payload.parentId || undefined } satisfies MemoDTO),
      });
    }
  }
}
