import { runInAction, observable } from 'mobx';

import type { NoteVO, NotePatchDTO } from '#domain/shared/model/note';
import EditableEntity from '#domain/client/app/model/abstract/Editable';
import { type EntityPath, EntityTypes } from '#domain/shared/model/entity';

import { eventBus, EventNames as NoteEvents } from './eventBus';

export default class EditableNote extends EditableEntity<Required<NoteVO>> {
  constructor(noteId: NoteVO['id']) {
    super(noteId);
  }

  @observable public accessor path: EntityPath | undefined;

  protected readonly entityType = EntityTypes.Note;

  @observable public accessor entity: Required<NoteVO> | undefined;

  protected async _load(signal: AbortController['signal']) {
    const [note, path] = await Promise.all([
      this.remote.note.queryOne.query(this.entityLocator.entityId, { signal }),
      this.remote.note.queryPath.query(this.entityLocator.entityId, { signal }),
    ]);

    runInAction(() => {
      this.entity = note;
      this.path = path;
    });
  }

  public async update(note: NotePatchDTO) {
    await this.remote.note.updateOne.mutate([this.entityLocator.entityId, note]);

    eventBus.emit(NoteEvents.Updated, {
      id: this.entityLocator.entityId,
      payload: note,
      trigger: this,
    });
  }
}
