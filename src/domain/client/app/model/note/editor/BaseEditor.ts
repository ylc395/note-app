import { uniqueId, debounce, pick } from 'lodash-es';
import { action, computed } from 'mobx';
import assert from 'assert';
import { createQuery } from 'mobx-tanstack-query/preset';

import EventBus from '#domain/client/shared/infra/EventBus';
import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { NotePatchDTO, NoteVO } from '#domain/shared/model/note';

import { EventNames, type Events } from './events';
import type Tile from '../../Workbench/Tile';
import DomainEventBus from '../EventBus';
import type { Direction } from '../../base/HistoryStack';

export interface Options {
  entityId: NoteVO['id'];
  tile: Tile;
}

type Patch = Pick<NotePatchDTO, 'body' | 'icon' | 'title'>;

export default abstract class BaseEditor {
  constructor({ entityId, tile }: Options) {
    this.tile = tile;
    this.noteId = entityId;

    this.value = createQuery(({ signal }) => this.remote.note.queryOneById.query(this.noteId, { signal }), {
      queryKey: ['note', this.noteId],
      refetchOnWindowFocus: true,
      abortSignal: this.destroyController.signal,
    });

    this.path = createQuery(({ signal }) => this.remote.note.queryPath.query(this.noteId, { signal }), {
      queryKey: ['note.path', this.noteId],
      refetchOnWindowFocus: true,
      abortSignal: this.destroyController.signal,
    });

    this.blob = createQuery(
      ({ signal }) => this.remote.note.getBlob.query(this.noteId, { signal }) as Promise<ArrayBuffer>,
      {
        queryKey: ['note.blob', this.noteId],
        abortSignal: this.destroyController.signal,
        options: () => ({
          enabled: Boolean(this.value.result.data?.mimeType),
        }),
      },
    );
  }

  public abstract readonly mimeType: string | null;

  protected readonly remote = container.resolve(rpcToken);

  private readonly domainEventBus = container.resolve(DomainEventBus);

  public readonly id = uniqueId('editor-');

  public readonly events = new EventBus<Events>(this.id);

  public readonly noteId: NoteVO['id'];

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
    this.domainEventBus.emit(DomainEventBus.eventNames.Updated, { id: this.noteId, ...patch });

    // 若服务器更新失败，前端回退至之前的值
    this._update(patch)?.catch(() => {
      this.value.setData((note) => ({ ...note!, ...currentData }));
      this.domainEventBus.emit(DomainEventBus.eventNames.Updated, {
        id: this.noteId,
        ...currentData,
      });
    });
  };

  private readonly _update = debounce((patch: Patch) => {
    return this.remote.note.updateOne.mutate([this.noteId, patch]);
  }, 1000);

  @action
  public moveTo(dest: BaseEditor | Tile, switchTo?: boolean) {
    const destTile = !(dest instanceof BaseEditor) ? dest : dest.tile;

    if (destTile !== this.tile) {
      const sameEditor = destTile.findEditor(this.noteId);

      if (sameEditor) {
        destTile.switchToEditor(sameEditor);
        return;
      }

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
