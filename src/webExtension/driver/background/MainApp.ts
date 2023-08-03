import browser from 'webextension-polyfill';

import { Statuses, REMOTE_ID, type MainApp as IMainApp, type Payload } from 'infra/MainApp';
import type { DirectoryVO, MaterialDTO } from 'interface/material';
import type { FileVO } from 'interface/file';
import type { NoteBodyDTO, NoteDTO, NoteVO } from 'interface/note';
import type { MemoDTO } from 'interface/memo';
import { type EntityId, EntityTypes } from 'interface/entity';
import NoteTree from 'model/NoteTree';
import MaterialTree from 'model/MaterialTree';
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

  private async fetch<T, K = void>(method: 'GET' | 'POST' | 'PUT' | 'PATCH', url: string, body?: K) {
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

  async getTree(type: EntityTypes.Note | EntityTypes.Material, id?: EntityId | null) {
    let tree: NoteTree | MaterialTree | undefined;
    if (type === EntityTypes.Note) {
      const notes = await this.fetch<NoteVO[]>('GET', id ? `/notes/${id}/tree-fragment` : `/notes`);

      if (notes) {
        tree = NoteTree.fromNotes(notes);
      }
    }

    if (type === EntityTypes.Material) {
      const query = '?type=directory';
      const directories = await this.fetch<DirectoryVO[]>(
        'GET',
        id ? `/materials/${id}/tree-fragment${query}` : `/materials${query}`,
      );

      if (directories) {
        tree = MaterialTree.fromMaterials(directories);
      }
    }

    if (!tree) {
      return null;
    }

    if (id) {
      for (const ancestor of tree.getAncestors(id)) {
        tree.toggleExpand(ancestor.id);
      }

      tree.toggleSelect(id);
    }

    return tree;
  }

  async getChildren(type: EntityTypes.Note, id: EntityId): Promise<NoteVO[]>;
  async getChildren(type: EntityTypes.Material, id: EntityId): Promise<DirectoryVO[]>;
  async getChildren(type: EntityTypes.Material | EntityTypes.Note, id: EntityId) {
    let children: NoteVO[] | DirectoryVO[] | null = null;

    if (type === EntityTypes.Note) {
      children = await this.fetch<NoteVO[]>('GET', `/notes?parentId=${id}`);
    }

    if (type === EntityTypes.Material) {
      children = await this.fetch<DirectoryVO[]>('GET', `/materials?parentId=${id}&type=1`);
    }

    return children || [];
  }
}
