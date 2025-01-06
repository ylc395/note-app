import { debounce, uniqueId } from 'lodash-es';
import assert from 'assert';
import { action, computed } from 'mobx';
import type { infer as ZodInfer } from 'zod';
import { createQuery, queryClient } from 'mobx-tanstack-query/preset';

import { EntityTypes } from '#domain/client/shared/model/entity';
import { notePatchDTOSchema } from '#domain/shared/infra/apiSchema/note';
import EventBus from '#domain/client/app/infra/EventBus';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { NoteVO } from '#domain/shared/model/note';
import { onlyWhen } from '#utils/function';

import { EventNames } from './events';
import Backup from './Backup';
import type Tile from '../../Workbench/Tile';
import { eventBus as domainEventBus, EventNames as DomainEventNames } from '../eventBus';

const backupSchema = notePatchDTOSchema.pick({ title: true, body: true });

type EditorPatch = ZodInfer<typeof backupSchema>;

export default class BaseEditor {
  constructor({ entityId, tile }: { entityId: NoteVO['id']; tile: Tile }) {
    this.tile = tile;
    this.entityId = entityId;
    this.backup = new Backup(entityId, backupSchema);

    this.value = createQuery(({ signal }) => this.remote.note.queryOne.query(this.entityId, { signal }), {
      queryKey: this.valueQueryKey,
      onDone: this.backup.diff.bind(this.backup),
      abortSignal: this.destroyController.signal,
    });

    this.path = createQuery(({ signal }) => this.remote.note.queryPath.query(this.entityId, { signal }), {
      queryKey: ['note.path', this.entityId],
      abortSignal: this.destroyController.signal,
    });

    domainEventBus.on(DomainEventNames.Removed, this.handleRemoved);
  }

  protected readonly remote = container.resolve(rpcToken);

  public readonly backup;

  public readonly id = uniqueId('editor-');

  public readonly events = new EventBus(this.id);

  public readonly entityId: NoteVO['id'];

  public readonly entityType = EntityTypes.Note;

  private get valueQueryKey() {
    return ['note', this.entityId];
  }

  protected readonly destroyController = new AbortController();

  public readonly value;

  public readonly blob = createQuery(
    ({ signal }) => this.remote.note.getBlob.query(this.entityId, { signal }) as Promise<ArrayBuffer>,
    {
      queryKey: () => ['note.blob', this.entityId],
      enabled: () => this.value.result.isSuccess,
      structuralSharing: false,
      abortSignal: this.destroyController.signal,
    },
  );

  public readonly path;

  public tile: Tile;

  @computed
  public get isLoading() {
    return this.value.result.isLoading || this.blob.result.isLoading;
  }

  @action
  public update(patch: EditorPatch) {
    assert(this.value, 'can not update editor');

    this.backup.write(patch);
    this.upload(patch);
  }

  private isUploading = false;

  private readonly upload = debounce(async (patch: EditorPatch) => {
    if (this.isUploading) {
      return;
    }

    this.isUploading = true;
    const updated = await this.remote.note.updateOne.mutate([this.entityId, patch]);
    this.isUploading = false;

    this.backup.clear();
    queryClient.setQueryData(this.valueQueryKey, updated);
    domainEventBus.emit(DomainEventNames.Updated, { id: this.entityId, payload: patch });
  }, 1000);

  public destroy() {
    this.upload.flush();
    this.events.clearListeners();
    this.destroyController.abort();

    this.events.emit(EventNames.Destroy, this);
    domainEventBus.off(DomainEventNames.Removed, this.handleRemoved);
  }

  private readonly handleRemoved = onlyWhen<NoteVO['id']>((id) => id === this.entityId, this.destroy.bind(this));

  public static readonly eventNames = EventNames;
}
