import { uniqueId, debounce, pick } from 'lodash-es';
import { action, computed, observable, runInAction } from 'mobx';
import { deepObserve } from 'mobx-utils';
import assert from 'assert';
import { createQuery } from 'mobx-tanstack-query/preset';
import type { ZodType } from 'zod';

import EventBus from '#domain/client/shared/infra/EventBus';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { NotePatchDTO, NoteVO } from '#domain/shared/model/note';
import PersistedObject from '#domain/client/shared/model/abstract/PersistedObject';

import { EventNames, type Events } from './events';
import type Tile from '../../Workbench/Tile';
import DomainEventBus from '../EventBus';
import type { Direction } from '../../Workbench/HistoryStack';

export interface Options {
  entityId: NoteVO['id'];
  tile: Tile;
}

type Patch = Pick<NotePatchDTO, 'body' | 'icon' | 'title'>;

export default abstract class BaseEditor<S = unknown> {
  constructor({ entityId, tile, uiStateSchema }: Options & { uiStateSchema: ZodType<S> }) {
    this.tile = tile;
    this.entityId = entityId;
    this.noteUIState = new PersistedObject(`uiState-${this.entityId}`, uiStateSchema);

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

    this.initUIState();
  }

  private async initUIState() {
    await this.noteUIState.ready;

    if (this.destroyController.signal.aborted) {
      return;
    }

    const uiState = this.noteUIState.get();

    if (uiState) {
      runInAction(() => {
        this.uiState = uiState;
      });
    }

    const dispose = deepObserve(this.uiState, () => this.noteUIState.set(this.uiState));
    this.destroyController.signal.addEventListener('abort', dispose);
  }

  @observable public accessor uiState: Partial<S> = {};

  private readonly noteUIState: PersistedObject<S>;

  public abstract readonly mimeType: string | null;

  protected readonly remote = container.resolve(rpcToken);

  private readonly domainEventBus = container.resolve(DomainEventBus);

  public readonly id = uniqueId('editor-');

  public readonly events = new EventBus<Events>(this.id);

  public readonly entityId: NoteVO['id'];

  protected readonly destroyController = new AbortController();

  public readonly value;

  public readonly blob;

  public readonly path;

  public tile: Tile;

  @computed
  public get isLoading() {
    return this.value.result.isLoading || this.blob.result.isLoading;
  }

  public readonly update = (patch: Patch) => {
    const currentData: Required<Patch> | undefined = this.value.result.data
      ? pick(this.value.result.data, ['title', 'body', 'icon'])
      : undefined;

    assert(currentData, 'can not update when loading');

    // 这里采用乐观更新
    this.value.setData((note) => ({ ...note!, ...patch }));
    this.domainEventBus.emit(DomainEventBus.eventNames.Updated, { id: this.entityId, ...patch });

    const promise = this._update(patch);

    if (promise) {
      // 若服务器更新失败，前端回退至之前的值
      promise.catch(() => {
        this.value.setData((note) => ({ ...note!, ...currentData }));
        this.domainEventBus.emit(DomainEventBus.eventNames.Updated, {
          id: this.entityId,
          ...currentData,
        });
      });
    }
  };

  private readonly _update = debounce((patch: Patch) => {
    return this.remote.note.updateOne.mutate([this.entityId, patch]);
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

  public focus(options?: { isFromHistory?: Direction }) {
    this.events.emit(EventNames.Focus, { editor: this, fromHistory: options?.isFromHistory });
  }

  public destroy() {
    Promise.resolve(this._update.flush()).then(
      action(() => {
        this.destroyController.abort();

        this.events.emit(EventNames.Destroy, this).then(() => {
          this.events.clearListeners();
        });
      }),
    );
  }

  public static readonly eventNames = EventNames;
}
