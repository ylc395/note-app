import { container } from 'tsyringe';
import { makeObservable, observable, runInAction } from 'mobx';

import { Statuses, token as mainAppToken, type Payload } from 'infra/MainApp';
import type { DirectoryVO, MaterialDTO } from 'interface/material';
import type { FileVO } from 'interface/file';
import type { NoteBodyDTO, NoteDTO, NoteVO } from 'interface/note';
import type { MemoDTO } from 'interface/memo';
import { type EntityId, EntityTypes } from 'interface/entity';
import NoteTree from 'model/NoteTree';
import MaterialTree from 'model/MaterialTree';

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
            mimeType: payload.contentType === 'html' ? 'text/html' : 'text/markdown',
            data: payload.content,
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

  async getTree(type: EntityTypes.Note | EntityTypes.Material, id?: EntityId | null) {
    let tree: NoteTree | MaterialTree | undefined;
    if (type === EntityTypes.Note) {
      const notes = await this.mainApp.fetch<NoteVO[]>('GET', id ? `/notes/${id}/tree-fragment` : `/notes`);

      if (notes) {
        tree = NoteTree.fromNotes(notes);
      }
    }

    if (type === EntityTypes.Material) {
      const query = '?type=directory';
      const directories = await this.mainApp.fetch<DirectoryVO[]>(
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
      children = await this.mainApp.fetch<NoteVO[]>('GET', `/notes?parentId=${id}`);
    }

    if (type === EntityTypes.Material) {
      children = await this.mainApp.fetch<DirectoryVO[]>('GET', `/materials?parentId=${id}&type=1`);
    }

    return children || [];
  }
}
