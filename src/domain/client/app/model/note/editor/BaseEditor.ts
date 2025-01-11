import { debounce, uniqueId } from 'lodash-es';
import { computed, reaction } from 'mobx';
import type { infer as ZodInfer } from 'zod';
import assert from 'assert';
import { createMutation, createQuery, queryClient } from 'mobx-tanstack-query/preset';

import { EntityTypes } from '#domain/client/shared/model/entity';
import { notePatchDTOSchema } from '#domain/shared/infra/apiSchema/note';
import EventBus from '#domain/client/shared/infra/EventBus';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { NoteVO } from '#domain/shared/model/note';
import { getChildrenNoteQueryKey } from '#domain/client/shared/model/note/queryKeys';

import { EventNames, type Events } from './events';
import Backup from './Backup';
import type Tile from '../../Workbench/Tile';

export default class BaseEditor {
  constructor({ entityId, tile }: { entityId: NoteVO['id']; tile: Tile }) {
    this.tile = tile;
    this.entityId = entityId;
    this.backup = new Backup(entityId, BaseEditor.patchSchema);

    this.value = createQuery(({ signal }) => this.remote.note.queryOne.query(this.entityId, { signal }), {
      queryKey: this.valueQueryKey,
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
          enabled: this.value.result.isSuccess,
        }),
      },
    );

    reaction(
      () => this.value.result.data,
      (data) => data && this.backup.diff(data),
      { signal: this.destroyController.signal },
    );
  }

  protected readonly remote = container.resolve(rpcToken);

  public readonly backup;

  public readonly id = uniqueId('editor-');

  public readonly events = new EventBus<Events>(this.id);

  public readonly entityId: NoteVO['id'];

  public readonly entityType = EntityTypes.Note;

  private get valueQueryKey() {
    return ['note', this.entityId];
  }

  protected readonly destroyController = new AbortController();

  public readonly value;

  public readonly blob;

  public readonly path;

  public tile: Tile;

  @computed
  public get isLoading() {
    return this.value.result.isLoading || this.blob.result.isLoading;
  }

  public readonly update = debounce(
    createMutation(
      async (patch: ZodInfer<typeof BaseEditor.patchSchema>) => {
        assert(!this.value.result.isLoading, 'can not update when loading');
        return this.remote.note.updateOne.mutate([this.entityId, patch]);
      },
      {
        abortSignal: this.destroyController.signal,
        onSuccess: (_, patch) => {
          assert(this.value.result.data);

          this.backup.clear();
          queryClient.setQueryData<NoteVO>(this.valueQueryKey, (note) => note && { ...note, ...patch });
          queryClient.invalidateQueries({ queryKey: getChildrenNoteQueryKey(this.value.result.data.parentId) });
        },
        onError: (_error, patch) => {
          this.backup.write(patch);
        },
      },
    ).mutate,
    1000,
  );

  public destroy() {
    this.update.flush();
    this.events.clearListeners();
    this.destroyController.abort();

    this.events.emit(EventNames.Destroy, this);
  }

  public static readonly eventNames = EventNames;

  private static readonly patchSchema = notePatchDTOSchema.pick({ title: true, body: true });
}
