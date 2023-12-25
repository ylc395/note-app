import { makeObservable, observable, runInAction } from 'mobx';
import browser from 'webextension-polyfill';
import { singleton } from 'tsyringe';

import {
  MaterialTypes,
  type MaterialDirectoryVO,
  type NewMaterialEntityDTO,
  type MaterialVO,
} from '@domain/model/material';
import type { FileVO } from '@domain/model/file';
import type { NoteBodyDTO, NewNoteDTO, NoteVO } from '@domain/model/note';
import type { MemoDTO } from '@domain/model/memo';
import { type EntityId, EntityTypes } from '@domain/model/entity';
import NoteTree from '@domain/model/note/Tree';
import MaterialTree from '@domain/model/material/Tree';
import { Statuses, type Payload } from '@domain/model/mainApp';

const HOST = 'http://localhost:3001';
const TOKEN_KEY = 'token';

@singleton()
export default class MainAppService {
  constructor() {
    makeObservable(this);
  }
  @observable status = Statuses.NotReady;

  private async getStatus() {
    const token = await this.getToken();

    if (!token) {
      return Statuses.EmptyToken;
    }

    try {
      const res = await fetch(`${HOST}/app/ping`, { headers: { Authorization: token } });

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

  readonly setToken = async (token: string) => {
    await browser.storage.local.set({ [TOKEN_KEY]: token });
    this.updateAppStatus();
  };

  private async getToken() {
    return (await browser.storage.local.get(TOKEN_KEY))[TOKEN_KEY];
  }

  async fetch<T, K = void>(method: 'GET' | 'POST' | 'PUT' | 'PATCH', url: string, body?: K, mimeType?: string) {
    const token = await this.getToken();

    if (!token) {
      throw new Error('no token');
    }
    // there is no `window` in background env. so use `globalThis`
    const res = await globalThis.fetch(`${HOST}${url}`, {
      method,
      body: body instanceof FormData || typeof body === 'string' ? body : body && JSON.stringify(body),
      headers: {
        Authorization: token,
        ...(body && !(body instanceof FormData) ? { 'Content-Type': mimeType || 'application/json' } : null),
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
  readonly updateAppStatus = async () => {
    const mainAppStatus = await this.getStatus();
    runInAction(() => {
      this.status = mainAppStatus;
    });

    if (mainAppStatus === Statuses.ConnectionFailure) {
      setTimeout(this.updateAppStatus.bind(this), 1000);
    }
  };

  async saveToMainApp(saveAs: EntityTypes, payload: Payload) {
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
    const data = new FormData();
    data.append(
      'files[]',
      payload.contentType === 'png'
        ? await (await fetch(payload.content)).blob()
        : new Blob([payload.content], { type: payload.contentType === 'html' ? 'text/html' : 'text/markdown' }),
    );

    const files = await this.fetch<FileVO[], FormData>('PATCH', '/files', data);
    const file = files?.[0];

    if (!file) {
      throw new Error('create files fail');
    }

    await this.fetch<void, NewMaterialEntityDTO>('POST', '/materials', {
      name: payload.title,
      sourceUrl: payload.sourceUrl,
      parentId: payload.parentId,
      fileId: file.id,
    });
  }

  private async saveNote(payload: Payload) {
    if (payload.contentType !== 'md') {
      throw new Error('invalid content type for note');
    }

    const note = await this.fetch<NoteVO, NewNoteDTO>('POST', '/notes', {
      title: payload.title,
      parentId: payload.parentId,
    });

    if (!note) {
      throw new Error('create note failed');
    }

    await this.fetch<void, NoteBodyDTO>('PUT', `/notes/${note.id}/body`, payload.content, 'text/markdown');
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

  async getTree(type: EntityTypes.Material | EntityTypes.Note, targetId: EntityId | null) {
    const options = { unselectable: true };
    const urlMap = {
      [EntityTypes.Material]: 'materials',
      [EntityTypes.Note]: 'notes',
    };

    const query = type === EntityTypes.Material ? `?type=${MaterialTypes.Directory}` : '';

    const entities = targetId
      ? await this.fetch<NoteVO[] | MaterialVO[]>('GET', `/${urlMap[type]}/${targetId}/tree${query}`)
      : await this.fetch<NoteVO[] | MaterialVO[]>('GET', `/${urlMap[type]}${query}`);

    if (entities) {
      if (type === EntityTypes.Material) {
        return new MaterialTree({ ...options, from: entities as MaterialVO[] });
      }

      if (type === EntityTypes.Note) {
        return new NoteTree({ ...options, from: entities as NoteVO[] });
      }
    }

    return null;
  }

  async getChildren(type: EntityTypes.Material | EntityTypes.Note, parentId: EntityId | null) {
    const url =
      type === EntityTypes.Material
        ? `/materials?${parentId ? `parentId=${parentId}&` : ''}type=${MaterialTypes.Directory}`
        : `/notes${parentId ? `?parentId=${parentId}` : ''}`;
    return await this.fetch<NoteVO[] | MaterialDirectoryVO[]>('GET', url);
  }
}
