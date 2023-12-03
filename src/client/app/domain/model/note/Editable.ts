import { makeObservable, action, toJS } from 'mobx';
import debounce from 'lodash/debounce';
import assert from 'assert';

import { EntityTypes } from 'model/entity';
import type { DetailedNoteVO as Note, NotePatchDTO as NotePatch } from 'model/note';
import EditableEntity, { EventNames } from 'model/abstract/EditableEntity';
import NoteEditor from './Editor';
import { Tile } from 'model/workbench';

export default class EditableNote extends EditableEntity<Note> {
  readonly entityType = EntityTypes.Note;
  constructor(noteId: Note['id']) {
    super(noteId);
    makeObservable(this);
  }

  async init() {
    const { body: note } = await this.remote.get<void, Note>(`/notes/${this.entityId}`);

    this.load(note);
  }

  protected getEditor(tile: Tile) {
    return new NoteEditor(this, tile);
  }

  @action
  async update(note: Pick<NotePatch, 'title' | 'body'>) {
    assert(this.entity);
    Object.assign(this.entity, { ...note, updatedAt: Date.now() });

    this.uploadNote(note);
    this.emit(EventNames.EntityUpdated);
  }

  private readonly uploadNote = debounce((note: NotePatch) => {
    this.remote.patch<NotePatch>(`/notes/${this.entityId}`, toJS(note));
  }, 1000);

  destroy(): void {
    this.uploadNote.flush();
  }
}
