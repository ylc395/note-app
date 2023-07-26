import { observable, makeObservable, runInAction } from 'mobx';
import browser from 'webextension-polyfill';

import type { MaterialDTO } from 'interface/material';
import type { FileVO } from 'interface/file';
import type { NoteBodyDTO, NoteDTO, NoteVO } from 'interface/note';
import type { MemoDTO } from 'interface/memo';
import { EntityTypes } from 'interface/entity';
import type { TaskResult } from 'model/task';

const HOST = 'http://localhost:3001';
const TOKEN_KEY = 'token';

export enum Statuses {
  NotReady,
  Online,
  ConnectionFailure,
  EmptyToken,
  InvalidToken,
}

interface Payload extends TaskResult {
  sourceUrl: string;
  parentId: string | null;
}

export default class MainApp {
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

  private async fetch<T, K>(method: 'GET' | 'POST' | 'PUT' | 'PATCH', url: string, body?: K) {
    if (!this.token) {
      throw new Error('no token');
    }
    // there is no `window` in background env. so use `globalThis`
    const res = await globalThis.fetch(`${HOST}${url}`, {
      method,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      headers: {
        Authorization: this.token,
        ...(body ? { 'Content-Type': body instanceof FormData ? 'multipart/form-data' : 'application/json' } : null),
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

  async save(saveAs: EntityTypes, payload: Payload) {
    switch (saveAs) {
      case EntityTypes.Material:
        return this.saveMaterial(payload);
      case EntityTypes.Note:
        return this.saveNote(payload);
      case EntityTypes.Memo:
        return this.saveMemo(payload);
      default:
        throw new Error('invalid type');
    }
  }

  private async saveMaterial(payload: Payload) {
    let file: FileVO | undefined;

    if (payload.contentType === 'png') {
      const data = new FormData();
      data.append('files', await (await fetch(payload.content)).blob());
      const files = await this.fetch<FileVO[], FormData>('PATCH', '/files', data);
      file = files?.[0];

      if (!file) {
        throw new Error('create files fail');
      }
    }

    await this.fetch<void, MaterialDTO>('POST', '/materials', {
      name: payload.title,
      sourceUrl: payload.sourceUrl,
      parentId: payload.parentId,
      ...(file
        ? { fileId: file.id }
        : {
            mimeType: payload.contentType === 'html' ? 'text/html' : 'text/markdown',
            data: payload.content,
          }),
    });
  }

  private async saveNote(payload: Payload) {
    if (payload.contentType !== 'md') {
      throw new Error('invalid content type for note');
    }

    const note = await this.fetch<NoteVO, NoteDTO>('POST', '/notes', {
      title: payload.title,
      parentId: payload.parentId,
    });

    if (!note) {
      throw new Error('create note failed');
    }

    await this.fetch<void, NoteBodyDTO>('PUT', `/notes/${note.id}/body`, { content: payload.content });
  }

  private async saveMemo(payload: Payload) {
    if (payload.contentType !== 'md') {
      throw new Error('invalid content type for memo');
    }

    await this.fetch<void, MemoDTO>('POST', '/memos', {
      content: payload.content,
      parentId: payload.parentId || undefined,
    });
  }
}
