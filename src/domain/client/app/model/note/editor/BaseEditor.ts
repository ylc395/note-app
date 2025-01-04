import { debounce, uniqueId } from 'lodash-es';
import assert from 'assert';
import { action, computed, observable } from 'mobx';
import type { infer as ZodInfer } from 'zod';

import { EntityId, type EntityPath, EntityTypes } from '#domain/client/shared/model/entity';
import { notePatchDTOSchema } from '#domain/shared/infra/apiSchema/note';
import EventBus from '#domain/client/app/infra/EventBus';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { NoteVO } from '#domain/shared/model/note';
import { onlyWhen } from '#utils/function';

import { type Events, EventNames } from './events';
import Backup from './Backup';
import type Tile from '../../Workbench/Tile';
import { eventBus as domainEventBus, EventNames as DomainEventNames, type UpdatedEvent } from '../eventBus';

const backupSchema = notePatchDTOSchema.pick({ title: true, body: true });

type EditorPatch = ZodInfer<typeof backupSchema>;

export default class BaseEditor {
  constructor({ entityId, tile }: { entityId: EntityId; tile: Tile }) {
    this.tile = tile;
    this.entityId = entityId;
    this.backup = new Backup(entityId, backupSchema);
    this.events = new EventBus<Events>(`editor-${entityId}`);

    this.load();

    domainEventBus.on(DomainEventNames.Removed, this.handleRemoved);
    domainEventBus.on(DomainEventNames.Updated, this.handleUpdated);
  }

  protected readonly remote = container.resolve(rpcToken);

  public readonly backup;

  public readonly events;

  public readonly id = uniqueId('editor-');

  public readonly entityId: EntityId;

  public readonly entityType = EntityTypes.Note;

  @observable public accessor value: NoteVO | undefined;

  @observable.ref public accessor blob: ArrayBuffer | undefined;

  @observable public accessor path: EntityPath | undefined;

  @observable.ref public accessor tile: Tile;

  @observable.shallow private accessor processes: {
    loading?: AbortController;
    uploading?: AbortController;
  } = {};

  @computed
  public get isLoading() {
    return Boolean(this.processes.loading);
  }

  protected async load() {
    this.processes.loading?.abort();

    const abortController = new AbortController();
    this.processes.loading = abortController;

    try {
      // 在第一次 load 之后，再次 load 只会更新 path 了
      const [note, path] = await Promise.all([
        this.value || this.remote.note.queryOne.query(this.entityId, { signal: abortController.signal }),
        this.remote.note.queryPath.query(this.entityId, { signal: abortController.signal }),
      ]);

      let blob = this.blob;

      if (note.fileId && !blob) {
        blob = (await this.remote.note.getBlob.query(note.fileId)) as ArrayBuffer;
      }

      this.value = note;
      this.path = path;
      this.blob = blob;
    } catch (e) {
      if (!abortController.signal.aborted) {
        throw e;
      }
    } finally {
      if (this.processes.loading === abortController) {
        this.processes.loading = undefined;
      }
    }

    if (this.value) {
      this.backup.diff(this.value);
    }
  }

  @action
  public update(patch: EditorPatch) {
    assert(this.value, 'can not update editor');

    this.backup.write(patch);
    this.debouncedUpload(patch);
  }

  private readonly debouncedUpload = debounce(async (patch: EditorPatch) => {
    this.processes.uploading?.abort();

    const controller = new AbortController();
    this.processes.uploading = controller;
    let isSuccess = false;

    try {
      await this.remote.note.updateOne.mutate([this.entityId, patch], { signal: controller.signal });
      isSuccess = true;
    } catch (e) {
      if (!controller.signal.aborted) {
        throw e;
      }
    } finally {
      if (this.processes.uploading === controller) {
        this.processes.uploading = undefined;
      }
    }

    if (isSuccess) {
      this.backup.clear();
      domainEventBus.emit(DomainEventNames.Updated, {
        id: this.entityId,
        payload: patch,
      });
    }
  }, 1000);

  public destroy() {
    this.events.emit(EventNames.Destroy, this);

    // debouncedUpload 还有可能触发事件。所以要等 debouncedUpload 执行完成再清空事件回调
    Promise.resolve(this.debouncedUpload.flush()).then(() => {
      this.events.clearListeners();
    });

    domainEventBus.off(DomainEventNames.Removed, this.handleRemoved);
    domainEventBus.off(DomainEventNames.Updated, this.handleUpdated);
  }

  private readonly handleUpdated = onlyWhen<UpdatedEvent>(
    ({ id }) => id === this.entityId,
    ({ payload }) => {
      if (!this.value) {
        return;
      }

      this.value = { ...this.value, ...payload };

      if (payload.parentId !== undefined) {
        this.load();
      }
    },
  );

  private readonly handleRemoved = onlyWhen<NoteVO['id']>((id) => id === this.entityId, this.destroy.bind(this));

  public static readonly eventNames = EventNames;
}
