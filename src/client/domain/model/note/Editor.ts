import { makeObservable, computed, action, toJS } from 'mobx';

import { EntityTypes } from 'interface/entity';
import { normalizeTitle, type NoteVO, type NoteBodyVO } from 'interface/Note';
import type Tile from 'model/workbench/Tile';
import EntityEditor, { type CommonEditorEvents, type Breadcrumbs } from 'model/abstract/Editor';
import type NoteTree from './Tree';

export enum Events {
  Updated = 'noteEditor.updated.metadata', // not included synced by other editor
  BodyUpdated = 'noteEditor.updated.body', // not included synced by other editors
  BodyUpdatedNotOriginally = 'noteEditor.updated.body.notOriginally',
}

export interface Entity {
  body: NoteBodyVO;
  metadata: NoteVO;
}

interface NoteEditorEvents extends CommonEditorEvents {
  [Events.BodyUpdated]: [string];
  [Events.BodyUpdatedNotOriginally]: [string];
  [Events.Updated]: [NoteVO];
}

export default class NoteEditor extends EntityEditor<Entity, NoteEditorEvents> {
  readonly entityType = EntityTypes.Note;
  constructor(tile: Tile, noteId: NoteVO['id'], private readonly noteTree: NoteTree) {
    super(tile, noteId);
    makeObservable(this);
  }

  @computed
  get tabView() {
    return {
      title:
        (__ENV__ === 'dev' ? `${this.id} ${this.entityId.slice(0, 3)} ` : '') +
        (this.entity ? normalizeTitle(this.entity.metadata) : ''),
      icon: this.entity?.metadata.icon || null,
    };
  }

  @computed
  get breadcrumbs() {
    const result: Breadcrumbs = [];
    let note = this.noteTree.getNode(this.entityId, true)?.entity;
    const noteToBreadcrumb = (note: NoteVO) => ({
      id: note.id,
      title: normalizeTitle(note),
      icon: note.icon || undefined,
    });

    while (note) {
      result.unshift({
        ...noteToBreadcrumb(note),
        siblings: this.noteTree.getSiblings(note.id).map(({ entity: note }) => noteToBreadcrumb(note)),
      });

      note = note.parentId ? this.noteTree.getNode(note.parentId).entity : undefined;
    }

    return result;
  }

  @action
  async updateBody(body: string, isOrigin: boolean) {
    if (!this.entity) {
      throw new Error('no load note');
    }

    this.entity.body = body;
    this.emit(isOrigin ? Events.BodyUpdated : Events.BodyUpdatedNotOriginally, body);
  }

  @action
  updateNote(note: Partial<NoteVO>, isOrigin: boolean) {
    if (!this.entity) {
      throw new Error('no load note');
    }

    if (note.id && note.id !== this.entity.metadata.id) {
      throw new Error('wrong id');
    }

    Object.assign(this.entity.metadata, note);

    if (isOrigin) {
      this.emit(Events.Updated, toJS(this.entity.metadata));
    }
  }
}
