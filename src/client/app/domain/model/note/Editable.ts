import { makeObservable, action, toJS } from 'mobx';
import debounce from 'lodash/debounce';
import assert from 'assert';

import { EntityTypes } from 'model/entity';
import type { NoteVO as Note, NotePatchDTO as NotePatch, NoteBodyVO } from 'model/note';
import EditableEntity from 'model/abstract/EditableEntity';

interface Entity {
  body: string;
  metadata: Note;
}

type UpdatableNote = Partial<Pick<Note, 'title'>>;

export default class EditableNote extends EditableEntity<Entity> {
  readonly entityType = EntityTypes.Note;
  constructor(noteId: Note['id']) {
    super(noteId);
    makeObservable(this);
  }

  protected async init() {
    const [{ body: metadata }, { body }] = await Promise.all([
      this.remote.get<void, Note>(`/notes/${this.entityId}`),
      this.remote.get<void, NoteBodyVO>(`/notes/${this.entityId}/body`),
    ]);

    this.load({ metadata, body });
  }

  @action.bound
  updateBody(body: string) {
    if (!this.entity) {
      throw new Error('no load note');
    }

    this.entity.body = body;
    this.uploadBody(body);
  }

  @action
  updateMetadata(note: UpdatableNote) {
    assert(this.entity);
    Object.assign(this.entity.metadata, note);
    this.uploadNote(this.entity.metadata);
    this.emit('metadataUpdated');
  }

  private readonly uploadBody = debounce((body: string) => {
    this.remote.put<NoteBodyVO>(`/notes/${this.entityId}/body`, body);
  }, 800);

  private readonly uploadNote = debounce((note: Note) => {
    this.remote.patch<NotePatch>(`/notes/${note.id}`, toJS(note));
  }, 1000);
}
