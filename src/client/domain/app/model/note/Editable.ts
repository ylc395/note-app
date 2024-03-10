import { makeObservable, action, toJS, runInAction, observable } from 'mobx';
import { debounce } from 'lodash-es';
import assert from 'assert';

import { EntityTypes } from '@domain/app/model/entity';
import type { NoteVO, NotePatchDTO } from '@shared/domain/model/note';
import EditableEntity from '@domain/app/model/abstract/EditableEntity';
import { Tile } from '@domain/app/model/workbench';
import NoteEditor from './Editor';
import { eventBus, Events as NoteEvents, UpdateEvent } from './eventBus';

export default class EditableNote extends EditableEntity<Required<NoteVO>> {
  public readonly entityType = EntityTypes.Note;

  constructor(noteId: NoteVO['id']) {
    super(noteId);
    makeObservable(this);
    eventBus.on(NoteEvents.Updated, this.refresh);
  }

  @observable public entity?: Required<NoteVO>;

  protected async load() {
    const [note, path] = await Promise.all([
      this.remote.note.queryOne.query(this.entityLocator.entityId),
      this.remote.note.queryPath.query(this.entityLocator.entityId),
    ]);

    runInAction(() => {
      this.entity = note;
      this.path = path;
    });
  }

  private readonly refresh = async ({ trigger, id }: UpdateEvent) => {
    if (trigger === this || this.entityLocator.entityId !== id) {
      return;
    }

    await this.load();
  };

  public createEditor(tile: Tile) {
    return new NoteEditor(this, tile);
  }

  @action
  public update(note: NotePatchDTO) {
    assert(this.entity);

    this.entity = { ...this.entity, ...note, updatedAt: Date.now() };
    this.uploadNote(note);
  }

  @action
  public updateBody(body: string) {
    assert(this.entity);

    this.entity.body = body;
    this.entity.updatedAt = Date.now();
    this.uploadNote({ body });
  }

  private readonly uploadNote = debounce(async (note: NotePatchDTO) => {
    await this.remote.note.updateOne.mutate([this.entityLocator.entityId, toJS(note)]);
    eventBus.emit(NoteEvents.Updated, {
      id: this.entityLocator.entityId,
      trigger: this,
      updatedAt: Date.now(),
      ...note,
    });
  }, 1000);

  public destroy(): void {
    this.uploadNote.flush();
    eventBus.off(NoteEvents.Updated, this.refresh);
  }
}
