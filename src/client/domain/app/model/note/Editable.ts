import { makeObservable, action, toJS, runInAction, observable, computed } from 'mobx';
import { container } from 'tsyringe';
import { debounce } from 'lodash-es';
import assert from 'assert';
import { applyPatch } from 'diff';

import { EntityTypes } from '@domain/app/model/entity';
import { token as localStorageToken } from '@domain/app/infra/localStorage';
import type { NoteVO, NotePatchDTO } from '@shared/domain/model/note';
import type { Tile } from '@domain/app/model/workbench';
import EditableEntity from '@domain/app/model/abstract/EditableEntity';
import NoteEditor from './Editor';
import { eventBus, Events as NoteEvents, type UpdateEvent } from './eventBus';

export default class EditableNote extends EditableEntity<Required<NoteVO>> {
  constructor(noteId: NoteVO['id']) {
    super(noteId);
    makeObservable(this);
    eventBus.on(NoteEvents.Updated, this.refresh);
  }

  public readonly entityType = EntityTypes.Note;
  private readonly localStorage = container.resolve(localStorageToken);
  private get readonlyKey() {
    return `${this.entityLocator.entityId}-readonly`;
  }

  @observable private isUploading = false;
  @observable private latestVersionBody?: string;
  @observable public entity?: Required<NoteVO>;
  @observable public isReadonly = this.localStorage.get<boolean>(this.readonlyKey) || false;

  @action.bound
  public setReadonly(value: boolean) {
    this.isReadonly = value;
    this.localStorage.set(this.readonlyKey, value);
  }

  @computed
  public get canSubmitVersion() {
    if (!this.entity || this.isUploading) {
      return false;
    }

    return this.entity.body !== this.latestVersionBody;
  }

  public readonly submitNewVersion = async () => {
    await this.remote.version.create.mutate({ entityId: this.entityLocator.entityId });

    runInAction(() => {
      assert(this.entity);
      this.latestVersionBody = this.entity.body;
    });
  };

  protected async load() {
    const [note, path] = await Promise.all([
      this.remote.note.queryOne.query(this.entityLocator.entityId),
      this.remote.note.queryPath.query(this.entityLocator.entityId),
    ]);

    runInAction(() => {
      this.entity = note;
      this.path = path;

      const latestVersionBody = applyPatch(note.body, note.diff);

      if (typeof latestVersionBody === 'string') {
        this.latestVersionBody = latestVersionBody;
      }
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
    this.isUploading = true;
    this.upload(note);
  }

  private readonly upload = debounce(async (note: NotePatchDTO) => {
    runInAction(() => {
      this.isUploading = true;
    });

    const updatedNote = await this.remote.note.updateOne.mutate([this.entityLocator.entityId, toJS(note)]);

    runInAction(() => {
      this.isUploading = false;
    });

    eventBus.emit(NoteEvents.Updated, {
      id: this.entityLocator.entityId,
      trigger: this,
      updatedAt: updatedNote.updatedAt,
      ...note,
    });
  }, 1000);

  public destroy(): void {
    this.upload.flush();
    eventBus.off(NoteEvents.Updated, this.refresh);
  }
}
