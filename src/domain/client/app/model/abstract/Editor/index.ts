import { debounce, uniqueId } from 'lodash-es';
import assert from 'assert';
import { action, observable, runInAction } from 'mobx';
import type { ZodSchema } from 'zod';
import type { Change } from 'diff';

import { EntityId, EntityTypes, type EntityLocator } from '#domain/shared/model/entity';
import EventBus from '#domain/client/app/infra/EventBus';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import type Tile from '../../workbench/Tile';
import { type EventsMap, EventNames } from './events';
import UIState from './UIState';
import Backup from './Backup';

export default abstract class Editor<E = unknown, P = Partial<E>, S = unknown> extends EventBus<EventsMap> {
  public readonly uiState: UIState<S>;

  @observable protected accessor entity: E | undefined;

  constructor({ entityId, tile, schema }: { entityId: EntityId; tile: Tile; schema: ZodSchema<P> }) {
    super('editor');

    this.tile = tile;
    this.entityId = entityId;
    this.uiState = new UIState(entityId);
    this.backup = new Backup(entityId, schema);

    this.init();
  }

  protected readonly remote = container.resolve(rpcToken);

  private readonly backup: Backup<P>;

  @observable.ref public accessor backupDiff: Change[] | undefined;

  public readonly id = uniqueId('editor-');

  @observable.ref public accessor tile: Tile;

  @observable public accessor status: 'idle' | 'loading' | 'destroyed' | 'active' = 'idle';

  protected abstract readonly entityType: EntityTypes;

  private readonly entityId: EntityId;

  protected abstract load(abortSignal: AbortController['signal']): Promise<void>;

  protected abstract upload(patch: P, abortSignal: AbortController['signal']): Promise<void>;

  @observable.ref private accessor processes: {
    loading?: AbortController;
    uploading?: AbortController;
  } = {};

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
      this.status = 'loading';
    });

    try {
      await this.load(abortController.signal);
    } catch (error) {
      if (this.processes.loading === abortController && this.status !== 'destroyed') {
        this.emit(EventNames.Error, error);
      }
    }

    if (this.processes.loading === abortController) {
      runInAction(() => {
        this.processes.loading = undefined;
      });
    }

    runInAction(() => {
      this.status = 'idle';
    });

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
    assert(this.status !== 'destroyed', 'can not update destroyed editor');

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
        this.emit(EventNames.Error, error);
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
    assert(this.status !== 'destroyed', 'can not activate a destroyed editor');
    this.status = 'active';
  }

  @action
  public deactivate() {
    assert(this.status === 'active', 'can not deactivate');
    this.status = 'idle';
  }

  public destroy() {
    this.status = 'destroyed';
    this.debouncedUpload.flush();
    this.emit(EventNames.Destroy);
    this.clearListeners();
  }

  public static readonly events = EventNames;
}
