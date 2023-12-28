import { makeObservable, action, toJS, runInAction } from 'mobx';
import { debounce } from 'lodash-es';
import assert from 'assert';

import { EntityTypes } from '@domain/app/model/entity';
import type { NoteVO, NotePatchDTO } from '@shared/domain/model/note';
import EditableEntity from '@domain/app/model/abstract/EditableEntity';
import { Tile } from '@domain/app/model/workbench';
import NoteEditor from './Editor';
import eventBus, { Events as NoteEvents, UpdateEvent } from './eventBus';

export default class EditableNote extends EditableEntity<{
  info: NoteVO;
  body: string;
}> {
  readonly entityType = EntityTypes.Note;
  constructor(noteId: NoteVO['id']) {
    super(noteId);
    makeObservable(this);
    eventBus.on(NoteEvents.Updated, this.handleNoteUpdated);
  }

  public async load() {
    const [{ body: info }, { body }] = await Promise.all([
      this.remote.get<void, NoteVO>(`/notes/${this.entityId}`),
      this.remote.get<void, string>(`/notes/${this.entityId}/body`),
    ]);

    runInAction(() => {
      this.entity = { info, body };
    });
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
  public update(note: Pick<NotePatchDTO, 'title'>) {
    assert(this.entity);
    this.entity.info = { ...this.entity.info, ...note, updatedAt: Date.now() };
    this.uploadNote(note);
    eventBus.emit(NoteEvents.Updated, { id: this.entityId, ...note });
  }

  @action
  public updateBody(body: string) {
    assert(this.entity);
    this.entity.body = body;
    this.entity.info.updatedAt = Date.now();

    this.uploadNoteBody(body);
    eventBus.emit(NoteEvents.Updated, { id: this.entityId, body });
  }

  private readonly uploadNote = debounce((note: NotePatchDTO) => {
    this.remote.patch<NotePatchDTO>(`/notes/${this.entityId}`, toJS(note));
  }, 1000);

  private readonly uploadNoteBody = debounce((body: string) => {
    this.remote.put<string>(`/notes/${this.entityId}/body`, body);
  }, 1000);

  destroy(): void {
    this.uploadNote.flush();
    this.uploadNoteBody.flush();
    eventBus.off(NoteEvents.Updated, this.handleNoteUpdated);
    super.destroy();
  }
}
