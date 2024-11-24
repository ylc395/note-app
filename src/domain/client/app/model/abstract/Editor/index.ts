import { debounce, uniqueId } from 'lodash-es';
import assert from 'assert';
import { action, computed, observable, runInAction } from 'mobx';
import type { ZodSchema } from 'zod';
import type { Change } from 'diff';

import { EntityId, EntityTypes, type EntityLocator } from '#domain/client/shared/model/entity';
import EventBus from '#domain/client/app/infra/EventBus';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import type Tile from '../../workbench/Tile';
import { type Events, EventNames } from './events';
import Backup from './Backup';

export default abstract class Editor<E = unknown, P = Partial<E>> {
  @observable protected accessor entity: E | undefined;

  constructor({ entityId, tile, schema }: { entityId: EntityId; tile: Tile; schema: ZodSchema<P> }) {
    this.tile = tile;
    this.entityId = entityId;
    this.backup = new Backup(entityId, schema);
    this.events = new EventBus<Events>(`editor-${entityId}`);

    this.init();
  }

  protected readonly remote = container.resolve(rpcToken);

  private readonly backup: Backup<P>;

  public readonly events;

  @observable.ref public accessor backupDiff: Change[] | undefined;

  public readonly id = uniqueId('editor-');

  @observable.ref public accessor tile: Tile;

  protected abstract readonly entityType: EntityTypes;

  private readonly entityId: EntityId;

  protected abstract load(abortSignal: AbortController['signal']): Promise<void>;

  protected abstract upload(patch: P, abortSignal: AbortController['signal']): Promise<void>;

  @observable.shallow private accessor processes: {
    loading?: AbortController;
    uploading?: AbortController;
  } = {};

  private isDestroyed = false;

  @observable public accessor isActive = false;

  @computed public get isLoading() {
    return Boolean(this.processes.loading);
  }

  public get entityLocator(): EntityLocator {
    return {
      entityId: this.entityId,
      entityType: this.entityType,
    };
  }

  protected async init() {
    this.processes.loading?.abort();
    const abortController = new AbortController();

    runInAction(() => {
      this.processes.loading = abortController;
    });

    try {
      await this.load(abortController.signal);
    } catch (error) {
      if (this.processes.loading === abortController && !this.isDestroyed) {
        this.events.emit(EventNames.Error, error);
      }
    }

    if (this.processes.loading === abortController) {
      runInAction(() => {
        this.processes.loading = undefined;
      });
    }

    if (!this.entity) {
      return;
    }

    const backupDiff = this.backup.diff(this.entity);

    if (backupDiff && backupDiff.length > 0) {
      runInAction(() => {
        this.backupDiff = backupDiff;
      });
    }
  }

  public async update(patch: P) {
    assert(!this.isDestroyed, 'can not update destroyed editor');

    runInAction(() => {
      assert(this.entity, 'can not update editor');
      this.entity = { ...this.entity, ...patch };
    });

    this.backup.write(patch);
    this.debouncedUpload(patch);
  }

  private readonly debouncedUpload = debounce(async (patch: P) => {
    const controller = new AbortController();

    this.processes.uploading?.abort();
    let isSuccess = true;

    runInAction(() => {
      this.processes.uploading = controller;
    });

    try {
      await this.upload(patch, controller.signal);
    } catch (error) {
      if (this.processes.uploading === controller) {
        isSuccess = false;
        this.events.emit(EventNames.Error, error);
      }
    }

    if (this.processes.uploading !== controller) {
      return;
    }

    if (isSuccess) {
      this.backup.clear();
    }

    runInAction(() => {
      this.processes.uploading = undefined;
    });
  }, 1000);

  @action
  public activate() {
    assert(!this.isDestroyed, 'can not activate a destroyed editor');
    this.isActive = true;
  }

  @action
  public deactivate() {
    assert(this.isActive, 'can not deactivate');
    this.isActive = false;
  }

  public destroy() {
    this.isDestroyed = true;
    this.debouncedUpload.flush();
    this.events.emit(EventNames.Destroy);
    this.events.clearListeners();
  }

  public static readonly events = EventNames;
}
