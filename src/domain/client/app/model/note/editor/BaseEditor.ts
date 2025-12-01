import { uniqueId, debounce, pick } from 'lodash-es';
import { action, computed, observable, runInAction } from 'mobx';
import assert from 'assert';
import { createQuery } from 'mobx-tanstack-query/preset';
import { BehaviorSubject } from 'rxjs';

import EventBus from '#domain/client/shared/infra/EventBus';
import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { normalizeTitle, type NotePatchDTO, type NoteVO } from '#domain/shared/model/note';

import { EventNames, type Events } from './events';
import type Tile from '../../Workbench/Tile';
import DomainEventBus from '../EventBus';
import type { Command } from './command';

export interface Options {
  entityId: NoteVO['id'];
  title?: NoteVO['title'];
  initialCommand?: Command;
}

type Patch = Pick<NotePatchDTO, 'body' | 'icon' | 'title'>;

export default abstract class BaseEditor {
  constructor(tile: Tile, { entityId, title, initialCommand }: Options) {
    this.noteId = entityId;
    this.initialTitle = title;
    this.command$ = new BehaviorSubject(initialCommand);

    runInAction(() => {
      this.tile = tile;
    });

    this.value = createQuery(({ signal }) => this.remote.note.queryOneById.query(this.noteId, { signal }), {
      queryKey: ['note', this.noteId],
      refetchOnWindowFocus: true,
      abortSignal: this.destroyController.signal,
      options: () => ({
        enabled: this.isCurrent,
      }),
    });

    this.path = createQuery(({ signal }) => this.remote.note.queryPath.query(this.noteId, { signal }), {
      queryKey: ['note.path', this.noteId],
      refetchOnWindowFocus: true,
      abortSignal: this.destroyController.signal,
      options: () => ({
        enabled: this.isCurrent,
      }),
    });

    this.blob = createQuery(
      ({ signal }) => this.remote.note.getBlob.query(this.noteId, { signal }) as Promise<ArrayBuffer>,
      {
        queryKey: ['note.blob', this.noteId],
        abortSignal: this.destroyController.signal,
        options: () => ({
          enabled: Boolean(this.value.result.data?.mimeType) && this.isCurrent,
        }),
      },
    );
  }

  public readonly command$;

  protected readonly remote = container.resolve(rpcToken);

  public abstract readonly mimeType: string | null;

  private readonly initialTitle?: string;

  private readonly domainEventBus = container.resolve(DomainEventBus);

  public readonly id = uniqueId('editor-');

  public readonly events = new EventBus<Events>(this.id);

  public readonly noteId: NoteVO['id'];

  protected readonly destroyController = new AbortController();

  public readonly value;

  public readonly blob;

  public readonly path;

  @observable.ref public accessor tile!: Tile;

  public hasEdited = false;

  @computed
  public get title() {
    return this.value.result.data ? normalizeTitle(this.value.result.data) : this.initialTitle ?? null;
  }

  @computed
  public get index() {
    return this.tile.editors.indexOf(this);
  }

  @computed
  public get isCurrent() {
    return this.tile.currentEditor === this;
  }

  public readonly update = (patch: Patch) => {
    const currentData = this.value.result.data
      ? pick(this.value.result.data, ['title', 'body', 'icon', 'type'])
      : undefined;

    this.hasEdited = true;
    assert(currentData, 'can not update when loading');

    // 这里采用乐观更新
    this.value.setData((note) => note && { ...note, ...patch });
    this.domainEventBus.emit(DomainEventBus.eventNames.Updated, {
      id: this.noteId,
      payload: patch,
      source: this,
    });

    // 若服务器更新失败，前端回退至之前的值
    this.upload(patch)?.catch(() => {
      this.value.setData((note) => ({ ...note!, ...currentData }));
      this.domainEventBus.emit(DomainEventBus.eventNames.Updated, {
        id: this.noteId,
        payload: currentData,
        source: this,
      });
    });
  };

  private readonly upload = debounce((patch: Patch) => {
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

  public focus() {
    this.events.emit(EventNames.Focus, this);
  }

  public destroy() {
    Promise.resolve(this.upload.flush()).then(
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
