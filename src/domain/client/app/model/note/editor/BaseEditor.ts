import { uniqueId, debounce, pick, defaults } from 'lodash-es';
import { action, computed, observable, runInAction } from 'mobx';
import assert from 'assert';
import { createQuery } from 'mobx-tanstack-query/preset';
import { BehaviorSubject } from 'rxjs';
import type { ZodType } from 'zod';

import EventBus from '#domain/client/shared/infra/EventBus';
import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { normalizeTitle, type NotePatchDTO, type NoteVO } from '#domain/shared/model/note';
import type { EntityPath } from '#domain/shared/model/entity';
import { token as documentDbToken } from '#domain/client/shared/infra/documentDb';

import { EventNames, type Events } from './events';
import type Tile from '../../Workbench/Tile';
import DomainEventBus, { type UpdatedEvent } from '../EventBus';
import type { Command } from './command';
import Uploader from './Uploader';

export const uiStateStoreName = 'editor_UI_state';

export const remoteIconStoreName = 'remote_icon';

export interface Options {
  noteId: NoteVO['id'];
  title?: NoteVO['title'];
  icon?: NoteVO['icon'];
  initialCommand?: Command;
  value?: NoteVO;
  path?: EntityPath;
  uploader?: Uploader;
}

type Patch = Pick<NotePatchDTO, 'body' | 'icon' | 'title'>;

export default abstract class BaseEditor {
  constructor(tile: Tile, { noteId, initialCommand, uploader, value, path, ...options }: Options) {
    this.noteId = noteId;
    this.command$ = new BehaviorSubject(initialCommand);
    this.options = options;
    this.isPreview = Boolean(uploader); // 若初始化时就带了 uploader，说明是预览编辑器

    runInAction(() => {
      this.tile = tile;
      this.fileUploader = uploader;
    });

    this.fileUploader?.eventBus.on(Uploader.EventNames.Uploaded, this.reload.bind(this, true));

    this.value = createQuery(({ signal }) => this.remote.note.queryOneById.query(this.noteId, { signal }), {
      queryKey: ['note', this.noteId],
      refetchOnWindowFocus: true,
      abortSignal: this.destroyController.signal,
      initialData: value,
      options: () => ({
        enabled: this.isCurrent && !this.isPreview,
      }),
    });

    this.path = createQuery(({ signal }) => this.remote.note.queryPath.query(this.noteId, { signal }), {
      queryKey: ['note.path', this.noteId],
      refetchOnWindowFocus: true,
      initialData: path,
      abortSignal: this.destroyController.signal,
      options: () => ({
        enabled: this.isCurrent && !this.isPreview,
      }),
    });

    this.blob = createQuery(
      ({ signal }) => this.remote.note.getBlob.query(this.noteId, { signal }) as Promise<ArrayBuffer>,
      {
        initialData: this.fileUploader?.file?.data,
        queryKey: ['note.blob', this.noteId],
        staleTime: Infinity,
        abortSignal: this.destroyController.signal,
        options: () => ({
          enabled: this.isCurrent && !this.isPreview,
        }),
      },
    );

    this.domainEventBus.on(DomainEventBus.eventNames.Updated, this.handleNoteUpdated.bind(this), {
      signal: this.destroyController.signal,
    });
  }

  public readonly command$;

  private readonly db = container.resolve(documentDbToken);

  @observable.ref public accessor fileUploader: Uploader | undefined;

  private readonly options;

  public readonly isPreview: boolean;

  protected readonly remote = container.resolve(rpcToken);

  public abstract readonly mimeType: string | null; // 当处于预览模式时，有可能和 value.mimeType 不一致

  protected readonly domainEventBus = container.resolve(DomainEventBus);

  protected readonly saveUIState = debounce((value: Record<string, unknown>) => {
    this.db.put(uiStateStoreName, { ...value, id: this.noteId });
  }, 500);

  protected getUIState<T>(schema: ZodType<T>) {
    return this.db.getByKey(uiStateStoreName, this.noteId, schema);
  }

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
    return this.value.result.data ? normalizeTitle(this.value.result.data) : this.options.title ?? null;
  }

  @computed
  public get icon() {
    return this.value.result.data ? this.value.result.data.icon : this.options.icon ?? null;
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

  public reload(hard = false) {
    assert(this.isPreview, 'can not reload a non-preview editor');
    assert(this.value.data);

    this.tile.replace(this, {
      noteId: this.noteId,
      mimeType: hard ? this.mimeType : this.value.data.mimeType,
      value: hard ? undefined : this.value.data,
      path: this.path.data,
    });
  }

  public toObject() {
    return {
      noteId: this.noteId,
      mimeType: this.value.data?.mimeType || null, // 不能读取 editor.mimeType，因为它可能是一个预览用的
      title: this.title || '',
      icon: this.icon,
    };
  }

  public destroy() {
    if (this.isPreview) {
      this.blob.remove();
    }
    this.fileUploader?.destroy();

    Promise.resolve(this.upload.flush()).then(
      action(() => {
        this.destroyController.abort();

        this.events.emit(EventNames.Destroy, this).then(() => {
          this.events.clearListeners();
        });
      }),
    );
  }

  private handleNoteUpdated(e: UpdatedEvent) {
    if (e.source === this) {
      return;
    }

    if (e.id === this.noteId) {
      this.value.setData((v) => defaults(e.payload, v));
    }

    if (e.payload.parentId !== undefined && this.path.data?.some(({ id }) => id === e.id)) {
      this.path.invalidate();
    }
  }

  public static readonly eventNames = EventNames;
}
