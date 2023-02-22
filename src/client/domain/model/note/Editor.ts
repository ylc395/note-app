import { makeObservable, computed, action } from 'mobx';
import debounce from 'lodash/debounce';
import { container } from 'tsyringe';

import { EntityTypes } from 'interface/Entity';
import { normalizeTitle, type NoteVO, type NoteBodyVO, type NoteBodyDTO, type NoteDTO } from 'interface/Note';
import type Tile from 'model/workbench/Tile';
import NoteService from 'service/NoteService';

import EntityEditor, { type Breadcrumbs } from 'model/abstract/editor';

export enum Events {
  TitleUpdated = 'noteEditor.updated.title',
  BodyUpdated = 'noteEditor.updated.body',
}

export interface Entity {
  body: NoteBodyVO;
  metadata: NoteVO;
}

export default class NoteEditor extends EntityEditor<Entity> {
  readonly entityType: EntityTypes = EntityTypes.Note;
  private readonly noteTree = container.resolve(NoteService).noteTree;
  constructor(tile: Tile, noteId: NoteVO['id']) {
    super(tile, noteId);
    makeObservable(this);
    this.init();
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

  @action
  async updateBody(body: unknown) {
    if (!this.entity) {
      throw new Error('not ready');
    }

    const jsonStr = JSON.stringify(body);
    this.entity.body = jsonStr;
    this.emit(Events.BodyUpdated, this.entity.body);
    this.uploadBody(jsonStr);
  }

  @action
  updateTitle(title: string) {
    if (!this.entity) {
      throw new Error('not ready');
    }

    this.entity.metadata.title = title;
    this.emit(Events.TitleUpdated, this.entity.metadata);
    this.uploadTitle(title);
  }

  protected async fetchEntity() {
    const [{ body: metadata }, { body }] = await Promise.all([
      this.remote.get<void, NoteVO>(`/notes/${this.entityId}`),
      this.remote.get<void, NoteBodyVO>(`/notes/${this.entityId}/body`),
    ]);

    return { metadata, body };
  }

  private readonly uploadBody = debounce((body: NoteBodyDTO) => {
    this.remote.put<NoteBodyDTO>(`/notes/${this.entityId}/body`, body);
  }, 1000);

  private readonly uploadTitle = debounce((title: NonNullable<NoteDTO['title']>) => {
    this.remote.patch<NoteDTO>(`/notes/${this.entityId}`, { title });
  }, 1000);
}
