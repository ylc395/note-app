import { makeObservable, action, toJS, runInAction } from 'mobx';
import { debounce } from 'lodash-es';
import assert from 'assert';

import { EntityTypes } from '@domain/app/model/entity';
import type { DetailedNoteVO as Note, NotePatchDTO as NotePatch } from '@shared/domain/model/note';
import EditableEntity from '@domain/app/model/abstract/EditableEntity';
import { Tile } from '@domain/app/model/workbench';
import NoteEditor from './Editor';
import eventBus, { Events as NoteEvents, UpdateEvent } from './eventBus';

export default class EditableNote extends EditableEntity<Note> {
  readonly entityType = EntityTypes.Note;
  constructor(noteId: Note['id']) {
    super(noteId);
    makeObservable(this);
    eventBus.on(NoteEvents.Updated, this.handleNoteUpdated);
  }

  public async load() {
    const { body: note } = await this.remote.get<void, Note>(`/notes/${this.entityId}`);
    runInAction(() => (this.entity = note));
  }

  protected getEditor(tile: Tile) {
    return new NoteEditor(this, tile);
  }

  private readonly handleNoteUpdated = ({ id, parentId }: UpdateEvent) => {
    if (id !== this.entityId) {
      return;
    }

    if (parentId) {
      this.load();
    }
  };

  @action
  async update(note: Pick<NotePatch, 'title' | 'body'>) {
    assert(this.entity);
    Object.assign(this.entity, { ...note, updatedAt: Date.now() });

    this.uploadNote(note);
    eventBus.emit(NoteEvents.Updated, { id: this.entityId, ...note });
  }

  private readonly uploadNote = debounce((note: NotePatch) => {
    this.remote.patch<NotePatch>(`/notes/${this.entityId}`, toJS(note));
  }, 1000);

  destroy(): void {
    this.uploadNote.flush();
    eventBus.off(NoteEvents.Updated, this.handleNoteUpdated);
    super.destroy();
  }
}
