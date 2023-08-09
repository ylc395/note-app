import { container } from 'tsyringe';
import { makeObservable, observable, runInAction } from 'mobx';

import { Statuses, token as mainAppToken, type Payload } from 'infra/MainApp';
import { MaterialTypes, type DirectoryVO, type MaterialDTO } from 'interface/material';
import type { FileVO } from 'interface/file';
import type { NoteBodyDTO, NoteDTO, NoteVO } from 'interface/note';
import type { MemoDTO } from 'interface/memo';
import { type EntityId, type EntityParentId, EntityTypes } from 'interface/entity';
import NoteTree from 'model/note/Tree';
import MaterialTree from 'model/material/Tree';

export default class MainAppService {
  constructor(checkStatus?: boolean) {
    makeObservable(this);

    if (checkStatus) {
      this.updateAppStatus();
    }
  }
  @observable status = Statuses.NotReady;
  private readonly mainApp = container.resolve(mainAppToken);

  private async updateAppStatus() {
    const mainAppStatus = await this.mainApp.getStatus();
    runInAction(() => {
      this.status = mainAppStatus;
    });

    if (mainAppStatus === Statuses.ConnectionFailure) {
      setTimeout(this.updateAppStatus.bind(this), 1000);
    }
  }

  async setToken(token: string) {
    await this.mainApp.setToken(token);
    this.updateAppStatus();
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
      const files = await this.mainApp.fetch<FileVO[], FormData>('PATCH', '/files', data);
      file = files?.[0];

      if (!file) {
        throw new Error('create files fail');
      }
    }

    await this.mainApp.fetch<void, MaterialDTO>('POST', '/materials', {
      name: payload.title,
      sourceUrl: payload.sourceUrl,
      parentId: payload.parentId,
      ...(file
        ? { fileId: file.id }
        : {
            file: {
              mimeType: payload.contentType === 'html' ? 'text/html' : 'text/markdown',
              data: payload.content,
            },
          }),
    });
  }

  private async saveNote(payload: Payload) {
    if (payload.contentType !== 'md') {
      throw new Error('invalid content type for note');
    }

    const note = await this.mainApp.fetch<NoteVO, NoteDTO>('POST', '/notes', {
      title: payload.title,
      parentId: payload.parentId,
    });

    if (!note) {
      throw new Error('create note failed');
    }

    await this.mainApp.fetch<void, NoteBodyDTO>('PUT', `/notes/${note.id}/body`, { content: payload.content });
  }

  private async saveMemo(payload: Payload) {
    if (payload.contentType !== 'md') {
      throw new Error('invalid content type for memo');
    }

    await this.mainApp.fetch<void, MemoDTO>('POST', '/memos', {
      content: payload.content,
      parentId: payload.parentId || undefined,
    });
  }

  async getTree(type: EntityTypes.Material | EntityTypes.Note, targetId: EntityParentId) {
    if (type === EntityTypes.Note) {
      const entities = await this.mainApp.fetch<NoteVO[]>(
        'GET',
        targetId ? `/notes/${targetId}/tree-fragment` : `/notes`,
      );
      return entities && NoteTree.from(entities);
    }

    if (type === EntityTypes.Material) {
      const query = `?type=${MaterialTypes.Directory}`;
      const entities = await this.mainApp.fetch<DirectoryVO[]>(
        'GET',
        targetId ? `/materials/${targetId}/tree-fragment${query}` : `/materials${query}`,
      );
      return entities && MaterialTree.from(entities);
    }

    return null;
  }

  async getChildren(type: EntityTypes.Material | EntityTypes.Note, parentId: EntityId) {
    const url =
      type === EntityTypes.Material
        ? `/materials?parentId=${parentId}&type=${MaterialTypes.Directory}`
        : `/notes?parentId=${parentId}`;
    return await this.mainApp.fetch<NoteVO[] | DirectoryVO[]>('GET', url);
  }
}
