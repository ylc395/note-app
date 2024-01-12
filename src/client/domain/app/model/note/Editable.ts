import { makeObservable, action, toJS, runInAction } from 'mobx';
import { debounce } from 'lodash-es';
import assert from 'assert';

import { EntityTypes } from '@domain/app/model/entity';
import type { NoteVO, NotePatchDTO } from '@shared/domain/model/note';
import EditableEntity from '@domain/app/model/abstract/EditableEntity';
import { Tile } from '@domain/app/model/workbench';
import NoteEditor from './Editor';
import { eventBus, Events as NoteEvents } from './eventBus';

export default class EditableNote extends EditableEntity<{
  info: NoteVO;
  body: string;
}> {
  readonly entityType = EntityTypes.Note;
  constructor(noteId: NoteVO['id']) {
    super(noteId);
    makeObservable(this);
  }

  public async load() {
    const [info, body] = await Promise.all([
      this.remote.note.queryOne.query(this.entityId),
      this.remote.note.queryBody.query(this.entityId),
    ]);

    runInAction(() => {
      this.entity = { info, body };
    });
  }

  public createEditor(tile: Tile) {
    return new NoteEditor(this, tile);
  }

  @action
  public update(note: Pick<NotePatchDTO, 'title' | 'icon'>) {
    assert(this.entity);
    this.entity.info = { ...this.entity.info, ...note, updatedAt: Date.now() };
    this.uploadNote(note);
    eventBus.emit(NoteEvents.Updated, { id: this.entityId, actor: this, ...note });
  }

  @action
  public updateBody(body: string) {
    assert(this.entity);
    this.entity.body = body;
    this.entity.info.updatedAt = Date.now();

    this.uploadNoteBody(body);
    eventBus.emit(NoteEvents.Updated, { id: this.entityId, actor: this, body });
  }

  private readonly uploadNote = debounce((note: NotePatchDTO) => {
    this.remote.note.updateOne.mutate([this.entityId, toJS(note)]);
  }, 1000);

  private readonly uploadNoteBody = debounce((body: string) => {
    this.remote.note.updateBody.mutate({ id: this.entityId, body });
  }, 1000);

  destroy(): void {
    this.uploadNote.flush();
    this.uploadNoteBody.flush();
  }
}
