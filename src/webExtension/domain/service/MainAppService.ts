import { container } from 'tsyringe';
import { makeObservable, observable, runInAction } from 'mobx';

import { Statuses, token as mainAppToken, type Payload } from 'infra/MainApp';
import { MaterialTypes, type MaterialDirectoryVO, type NewMaterialEntityDTO, type MaterialVO } from 'model/material';
import type { FileVO } from 'model/file';
import type { NoteBodyDTO, NewNoteDTO, NoteVO } from 'model/note';
import type { MemoDTO } from 'model/memo';
import { type EntityId, EntityTypes } from 'model/entity';
import NoteTree, { type NoteTreeVO } from 'model/note/Tree';
import MaterialTree, { type MaterialTreeVO } from 'model/material/Tree';
import type { TreeVO } from 'model/abstract/Tree';

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

  readonly setToken = async (token: string) => {
    await this.mainApp.setToken(token);
    this.updateAppStatus();
  };

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
    const data = new FormData();
    data.append(
      'files[]',
      payload.contentType === 'png'
        ? await (await fetch(payload.content)).blob()
        : new Blob([payload.content], { type: payload.contentType === 'html' ? 'text/html' : 'text/markdown' }),
    );

    const files = await this.mainApp.fetch<FileVO[], FormData>('PATCH', '/files', data);
    const file = files?.[0];

    if (!file) {
      throw new Error('create files fail');
    }

    await this.mainApp.fetch<void, NewMaterialEntityDTO>('POST', '/materials', {
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

    const note = await this.mainApp.fetch<NoteVO, NewNoteDTO>('POST', '/notes', {
      title: payload.title,
      parentId: payload.parentId,
    });

    if (!note) {
      throw new Error('create note failed');
    }

    await this.mainApp.fetch<void, NoteBodyDTO>('PUT', `/notes/${note.id}/body`, payload.content, 'text/markdown');
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

  async getTree(type: EntityTypes.Material | EntityTypes.Note, targetId: EntityId | null) {
    const options = { unselectable: true };
    const urlMap = {
      [EntityTypes.Material]: 'materials',
      [EntityTypes.Note]: 'notes',
    };

    const query = type === EntityTypes.Material ? `?type=${MaterialTypes.Directory}` : '';
    let treeVO: TreeVO | null = null;

    if (targetId) {
      treeVO = await this.mainApp.fetch<TreeVO>('GET', `/${urlMap[type]}/${targetId}/tree${query}`);
    } else {
      const roots = await this.mainApp.fetch<NoteVO[] | MaterialVO[]>('GET', `/${urlMap[type]}${query}`);
      treeVO = roots && roots.map((entity) => ({ entity }));
    }

    if (treeVO) {
      if (type === EntityTypes.Material) {
        return new MaterialTree({ ...options, from: treeVO as MaterialTreeVO });
      }

      if (type === EntityTypes.Note) {
        return new NoteTree({ ...options, from: treeVO as NoteTreeVO });
      }
    }

    return null;
  }

  async getChildren(type: EntityTypes.Material | EntityTypes.Note, parentId: EntityId | null) {
    const url =
      type === EntityTypes.Material
        ? `/materials?${parentId ? `parentId=${parentId}&` : ''}type=${MaterialTypes.Directory}`
        : `/notes${parentId ? `?parentId=${parentId}` : ''}`;
    return await this.mainApp.fetch<NoteVO[] | MaterialDirectoryVO[]>('GET', url);
  }
}
