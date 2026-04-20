import { debounce, pick, defaults } from 'lodash-es';
import { computed, observable, runInAction } from 'mobx';
import assert from 'assert';
import { createQuery } from 'mobx-tanstack-query/preset';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { normalizeTitle, type NotePatchDTO, type NoteVO } from '#domain/shared/model/note';
import { EntityTypes } from '#domain/shared/model/entity';

import type Tile from '../../Workbench/Tile';
import DomainEventBus, { type UpdatedEvent } from '../EventBus';
import Uploader from './Uploader';
import BaseEditor, { Options as BaseOptions } from '../../Workbench/BaseEditor';
import IconManager from '../IconManager';

export type Action = (editor: BaseEditor) => void;

export const uiStateStoreName = 'editor_UI_state';

export const remoteIconStoreName = 'remote_icon';

export interface Options extends BaseOptions<NoteVO> {
  uploader?: Uploader;
}

type Patch = Pick<NotePatchDTO, 'body' | 'icon' | 'title'>;

export default abstract class NoteBaseEditor extends BaseEditor<NoteVO> {
  constructor(tile: Tile, { uploader, ...options }: Options) {
    super(tile, options);

    runInAction(() => {
      this.fileUploader = uploader;
    });

    this.fileUploader?.eventBus.on(Uploader.EventNames.Uploaded, this.reload.bind(this, true));

    this.blob = createQuery(
      ({ signal }) => this.remote.note.getBlob.query(this.entityId, { signal }) as Promise<ArrayBuffer>,
      {
        initialData: this.fileUploader?.file?.data,
        queryKey: ['note.blob', this.entityId],
        staleTime: Infinity,
        abortSignal: this.destroyController.signal,
        options: () => ({
          enabled: Boolean(this.isCurrent && !this.isTemp && this.mimeType),
        }),
      },
    );

    this.domainEventBus.on(DomainEventBus.eventNames.Updated, this.handleNoteUpdated.bind(this), {
      signal: this.destroyController.signal,
    });
  }

  @observable.ref public accessor fileUploader: Uploader | undefined;

  protected readonly remote = container.resolve(rpcToken);

  public override readonly entityType = EntityTypes.Note;

  public readonly iconManager = new IconManager({ noteIds: this.entityId });

  protected override fetchValue(params: { signal: AbortSignal }) {
    return this.remote.note.queryOneById.query(this.entityId, { signal: params.signal });
  }

  protected override fetchPath(params: { signal: AbortSignal }) {
    return this.remote.note.queryPath.query(this.entityId, { signal: params.signal });
  }

  protected readonly domainEventBus = container.resolve(DomainEventBus);

  public readonly blob;

  public hasEdited = false;

  @computed
  public get title() {
    return this.value.data ? normalizeTitle(this.value.data) : this.options.title ?? null;
  }

  @computed
  public get icon() {
    return this.value.data ? this.value.data.icon : this.options.icon ?? null;
  }

  public readonly update = (patch: Patch) => {
    assert(this.value.data, 'can not update when loading');
    const currentData = pick(this.value.data, ['title', 'body', 'icon', 'type']);

    this.hasEdited = true;

    // 这里采用乐观更新
    this.value.setData((note) => ({ ...note!, ...patch }));
    this.domainEventBus.emit(DomainEventBus.eventNames.Updated, {
      id: this.entityId,
      payload: patch,
      source: this,
    });

    // 若服务器更新失败，前端回退至之前的值
    this.upload(patch)?.catch(() => {
      this.value.setData((note) => ({ ...note!, ...currentData }));
      this.domainEventBus.emit(DomainEventBus.eventNames.Updated, {
        id: this.entityId,
        payload: currentData,
        source: this,
      });
    });
  };

  private readonly upload = debounce((patch: Patch) => {
    return this.remote.note.updateOne.mutate([this.entityId, patch]);
  }, 1000);

  public reload(hard = false) {
    assert(this.isTemp, 'can not reload a non-preview editor');
    assert(this.value.data);

    this.tile.replace(this, {
      entityId: this.entityId,
      entityType: this.entityType,
      mimeType: hard ? this.mimeType : this.value.data.mimeType,
      value: hard ? undefined : this.value.data,
      path: this.path.data,
    });
  }

  public override destroy() {
    if (this.isTemp) {
      this.blob.remove(); // 从缓存中移除。因为这是一个临时的 blob
    }

    this.fileUploader?.destroy();
    Promise.resolve(this.upload.flush()).then(() => super.destroy());
  }

  private handleNoteUpdated(e: UpdatedEvent) {
    if (e.source === this) {
      return;
    }

    if (e.id === this.entityId) {
      this.value.setData((v) => defaults({}, e.payload, v));
    }

    if (e.payload.parentId !== undefined && this.path.data?.some(({ id }) => id === e.id)) {
      this.path.invalidate();
    }
  }
}
