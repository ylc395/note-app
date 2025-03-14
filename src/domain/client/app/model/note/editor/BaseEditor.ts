import { uniqueId, debounce } from 'lodash-es';
import { action, computed, reaction } from 'mobx';
import type { infer as ZodInfer } from 'zod';
import assert from 'assert';
import { createQuery } from 'mobx-tanstack-query/preset';

import { EntityTypes } from '#domain/shared/model/entity';
import { notePatchDTOSchema } from '#domain/shared/infra/apiSchema/note';
import EventBus from '#domain/client/shared/infra/EventBus';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { NoteVO } from '#domain/shared/model/note';

import { EventNames, type Events } from './events';
import Backup from './Backup';
import type Tile from '../../Workbench/Tile';
import DomainEventBus from '../EventBus';

export interface Options {
  entityId: NoteVO['id'];
  tile: Tile;
}

export default class BaseEditor {
  constructor({ entityId, tile }: Options) {
    this.tile = tile;
    this.entityId = entityId;
    this.backup = new Backup(entityId, BaseEditor.patchSchema);

    this.value = createQuery(({ signal }) => this.remote.note.queryOneById.query(this.entityId, { signal }), {
      queryKey: ['note', this.entityId],
      abortSignal: this.destroyController.signal,
    });

    this.path = createQuery(({ signal }) => this.remote.note.queryPath.query(this.entityId, { signal }), {
      queryKey: ['note.path', this.entityId],
      abortSignal: this.destroyController.signal,
    });

    this.blob = createQuery(
      ({ signal }) => this.remote.note.getBlob.query(this.entityId, { signal }) as Promise<ArrayBuffer>,
      {
        queryKey: ['note.blob', this.entityId],
        structuralSharing: false,
        abortSignal: this.destroyController.signal,
        options: () => ({
          enabled: Boolean(this.value.result.data?.mimeType),
        }),
      },
    );

    reaction(
      () => this.value.result.data,
      (data) => data && this.backup.diff(data),
      { signal: this.destroyController.signal },
    );
  }

  public readonly mimeType: string | null = null;

  protected readonly remote = container.resolve(rpcToken);

  private readonly domainEventBus = container.resolve(DomainEventBus);

  public readonly backup;

  public readonly id = uniqueId('editor-');

  public readonly events = new EventBus<Events>(this.id);

  public readonly entityId: NoteVO['id'];

  public readonly entityType = EntityTypes.Note;

  protected readonly destroyController = new AbortController();

  public readonly value;

  public readonly blob;

  public readonly path;

  public tile: Tile;

  @computed
  public get isLoading() {
    return this.value.result.isLoading || this.blob.result.isLoading;
  }

  public readonly update = debounce(async (patch: ZodInfer<typeof BaseEditor.patchSchema>) => {
    assert(this.value.result.data, 'can not update when loading');
    await this.remote.note.updateOne.mutate([this.entityId, patch]);
    this.value.setData((note) => ({ ...note!, ...patch }));
    this.domainEventBus.emit(DomainEventBus.eventNames.Updated, { id: this.entityId, ...patch });
  }, 1000);

  @action
  public moveTo(dest: BaseEditor | Tile, switchTo?: boolean) {
    const destTile = !(dest instanceof BaseEditor) ? dest : dest.tile;

    if (destTile !== this.tile) {
      destTile.addEditor(this, dest instanceof BaseEditor ? dest : undefined);
    } else {
      if (!(dest instanceof BaseEditor)) {
        // 此时 dest 为 tile，且肯定是 this.tile
        return;
      }

      // 在同一个 tile 里移动
      const index = destTile.editors.indexOf(this);
      assert(index >= 0, 'invalid dest');

      const newIndex = destTile.editors.indexOf(dest);

      destTile.editors.splice(index, 1);
      destTile.editors.splice(newIndex, 0, this);
    }

    if (switchTo) {
      destTile.switchToEditor(this);
    }
  }

  public destroy() {
    Promise.resolve(this.update.flush()).then(
      action(() => {
        this.destroyController.abort();

        this.events.emit(EventNames.Destroy, this).then(() => {
          this.events.clearListeners();
        });
      }),
    );
  }

  public static readonly eventNames = EventNames;

  private static readonly patchSchema = notePatchDTOSchema.pick({ title: true, body: true });
}
