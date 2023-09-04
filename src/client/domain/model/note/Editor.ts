import { makeObservable, action, toJS } from 'mobx';
import debounce from 'lodash/debounce';
import { container } from 'tsyringe';

import { EntityTypes } from 'model/entity';
import type { NoteVO as Note, NotePatchDTO as NotePatch, NoteBodyVO } from 'model/note';
import type Tile from 'model/workbench/Tile';
import Editor from 'model/abstract/Editor';
import NoteTree from 'model/note/Tree';

export interface Entity {
  body: string;
  metadata: Note;
}

export default class NoteEditor extends Editor<Entity> {
  readonly entityType = EntityTypes.Note;
  readonly noteTree = container.resolve(NoteTree);
  constructor(tile: Tile, noteId: Note['id']) {
    super(tile, noteId);
    makeObservable(this);
  }

  protected async init() {
    const [{ body: metadata }, { body }] = await Promise.all([
      this.remote.get<void, Note>(`/notes/${this.entityId}`),
      this.remote.get<void, NoteBodyVO>(`/notes/${this.entityId}/body`),
    ]);

    this.load({ metadata, body });
  }

  @action
  updateBody(body: string) {
    if (!this.entity) {
      throw new Error('no load note');
    }

    this.entity.body = body;
    this.uploadBody(body);
  }

  private readonly uploadBody = debounce((body: string) => {
    this.remote.put<NoteBodyVO>(`/notes/${this.entityId}/body`, body);
  }, 800);

  @action
  updateNote(note: Partial<Note>) {
    if (!this.entity) {
      throw new Error('no load note');
    }

    if (note.id && note.id !== this.entity.metadata.id) {
      throw new Error('wrong id');
    }

    Object.assign(this.entity.metadata, note);

    const metadata = toJS(this.entity.metadata);
    this.uploadNote(metadata);
    this.noteTree.updateTree(metadata);
  }

  private readonly uploadNote = debounce((note: Note) => {
    this.remote.patch<NotePatch>(`/notes/${note.id}`, note);
  }, 1000);
}
