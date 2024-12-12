import { flow } from 'lodash-es';
import { computed, runInAction } from 'mobx';

import { IS_DEV } from '#domain/shared/infra/env';
import { onlyWhen } from '#utils/function';
import Editor from '#domain/client/app/model/abstract/Editor';
import type Tile from '#domain/client/app/model/workbench/Tile';
import { notePatchDTOSchema } from '#domain/shared/infra/apiSchema/note';
import { normalizeTitle, type NotePatchDTO, type NoteVO } from '#domain/shared/model/note';
import { EntityTypes } from '#domain/shared/model/entity';
import { container } from '#domain/shared/infra/singletons';
import EventBus from '../EventBus';
import { create as createUIState } from './uiState';

type NotePatch = Pick<NotePatchDTO, 'body' | 'icon' | 'title'>;

export default class NoteEditor extends Editor<Required<NoteVO>, NotePatch> {
  private readonly _dispose: () => void;

  private readonly eventBus = container.resolve(EventBus);

  public readonly uiState;

  constructor(noteId: NoteVO['id'], tile: Tile) {
    super({ entityId: noteId, tile, schema: notePatchDTOSchema });

    this.uiState = createUIState(noteId);
    this._dispose = flow([
      this.eventBus.on(
        EventBus.eventNames.Updated,
        onlyWhen((e) => e.id === noteId && e.trigger !== this, this.init.bind(this)),
      ),
      this.eventBus.on(
        EventBus.eventNames.Removed,
        onlyWhen(({ id }) => id === noteId, this.destroy.bind(this)),
      ),
    ]);
  }

  protected readonly entityType = EntityTypes.Note;

  protected async load(signal: AbortController['signal']) {
    const [note, path] = await Promise.all([
      this.remote.note.queryOne.query(this.entityLocator.entityId, { signal }),
      this.remote.note.queryPath.query(this.entityLocator.entityId, { signal }),
    ]);

    runInAction(() => {
      this.entity = note;
      this.path = path;
    });
  }

  public toggleReadonly() {
    this.uiState.update({ isReadonly: !this.uiState.value?.isReadonly });
  }

  protected async upload(patch: NotePatch, signal: AbortController['signal']) {
    await this.remote.note.updateOne.mutate([this.entityLocator.entityId, patch], { signal });

    this.eventBus.emit(EventBus.eventNames.Updated, {
      id: this.entityLocator.entityId,
      payload: patch,
      trigger: this,
    });
  }

  @computed
  public get view() {
    const titlePrefix = IS_DEV ? `${this.id} ${this.entityLocator.entityId.slice(0, 3)} ` : '';

    return {
      readableTitle: titlePrefix + (this.entity?.title ? normalizeTitle(this.entity) : ''),
      title: this.entity?.title ?? '',
      body: this.entity?.body ?? '',
      icon: this.entity?.icon || null,
    };
  }

  public destroy(): void {
    this._dispose();
    super.destroy();
  }
}
