import { makeObservable, computed, action } from 'mobx';
import debounce from 'lodash/debounce';

import { EntityTypes } from 'interface/Entity';
import { normalizeTitle, type NoteVO, type NoteBodyVO } from 'interface/Note';
import type Tile from 'model/workbench/Tile';
import EntityEditor, { type Breadcrumbs } from 'model/abstract/Editor';

import type NoteTree from './Tree';

export enum Events {
  MetadataUpdated = 'noteEditor.updated.metadata', // not included synced by other editor
  BodyUpdated = 'noteEditor.updated.body', // not included synced by other editors
  BodySynced = 'noteEditor.synced.body',
}

export type MetadataPatch = Omit<Partial<NoteVO>, 'id'>;
export type BodyEvent = string;
export type MetadataEvent = MetadataPatch;

export interface Entity {
  body: NoteBodyVO;
  metadata: NoteVO;
}

export default class NoteEditor extends EntityEditor<Entity> {
  readonly entityType: EntityTypes = EntityTypes.Note;
  constructor(tile: Tile, noteId: NoteVO['id'], private readonly noteTree: NoteTree) {
    super(tile, noteId);
    makeObservable(this);
  }

  @computed
  get title() {
    return this.entity ? normalizeTitle(this.entity.metadata) : '';
  }

  @computed
  get breadcrumbs(): Breadcrumbs {
    const result: Breadcrumbs = [];
    let note: NoteVO | undefined = this.noteTree.getNode(this.entityId).note;
    const noteToBreadcrumb = (note: NoteVO) => ({
      id: note.id,
      title: normalizeTitle(note),
      icon: note.icon || undefined,
    });

    while (note) {
      result.unshift({
        ...noteToBreadcrumb(note),
        siblings: this.noteTree.getSiblings(note.id).map(({ note }) => noteToBreadcrumb(note)),
      });

      note = note.parentId ? this.noteTree.getNode(note.parentId).note : undefined;
    }

    return result;
  }

  @action.bound
  async updateBody(body: string, syncFlag = false) {
    if (!this.entity) {
      throw new Error('no load note');
    }

    this.entity.body = body;
    this.emit(syncFlag ? Events.BodySynced : Events.BodyUpdated, body);
  }

  @action
  updateMetadata(metadata: MetadataEvent, syncFlag?: true) {
    if (!this.entity) {
      throw new Error('no load note');
    }

    Object.assign(this.entity.metadata, metadata);

    if (!syncFlag) {
      this.emit(Events.MetadataUpdated, metadata);
      this.updateTree();
    }
  }

  private updateTree = debounce(() => {
    if (!this.entity) {
      throw new Error('no load note');
    }

    this.noteTree.updateTreeByNote(this.entity.metadata);
  }, 500);
}