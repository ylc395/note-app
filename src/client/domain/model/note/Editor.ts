import { makeObservable, computed, action, observable } from 'mobx';
import debounce from 'lodash/debounce';

import { EntityTypes } from 'interface/entity';
import type { LintProblem } from 'interface/lint';
import { normalizeTitle, type NoteVO, type NoteBodyVO } from 'interface/Note';

import type Tile from 'model/workbench/Tile';
import EntityEditor, { type Breadcrumbs } from 'model/abstract/Editor';

import type NoteTree from './Tree';

export enum Events {
  MetadataUpdated = 'noteEditor.updated.metadata', // not included synced by other editor
  BodyUpdated = 'noteEditor.updated.body', // not included synced by other editors
  BodyUpdatedNotOriginally = 'noteEditor.updated.body.notOriginally',
}

export type MetadataPatch = Omit<Partial<NoteVO>, 'id'>;
export type BodyEvent = string;
export type MetadataEvent = MetadataPatch;

export interface Entity {
  body: NoteBodyVO;
  metadata: NoteVO;
}

export default class NoteEditor extends EntityEditor<Entity> {
  readonly entityType = EntityTypes.Note;
  @observable.ref lintProblems: LintProblem[] = [];
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
  get breadcrumbs(): Breadcrumbs {
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
  updateMetadata(metadata: MetadataEvent, isOrigin: boolean) {
    if (!this.entity) {
      throw new Error('no load note');
    }

    Object.assign(this.entity.metadata, metadata);

    if (isOrigin) {
      this.emit(Events.MetadataUpdated, metadata);
      this.updateTree();
    }
  }

  private updateTree = debounce(() => {
    if (!this.entity) {
      throw new Error('no load note');
    }

    this.noteTree.updateTreeByEntity(this.entity.metadata);
  }, 500);

  @action
  loadLintProblems(problems: LintProblem[]) {
    this.lintProblems = problems;
  }
}
