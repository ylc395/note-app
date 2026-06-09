import { debounce, pick, defaults } from 'lodash-es';
import { computed, observable, runInAction } from 'mobx';
import assert from 'assert';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { type NotePatchDTO, type NoteVO } from '#domain/shared/model/note';

import type Tile from '../Tile';
import DomainEventBus, { type UpdatedEvent } from '../../note/EventBus';
import ResourceManager from './Uploader';
import BaseEditor, { Options as BaseOptions } from '../BaseEditor';
import IconManager from '../../note/IconManager';
import NoteEntity from '../../note/NoteEntity';

export const uiStateStoreName = 'editor_UI_state';

export const remoteIconStoreName = 'remote_icon';

export interface Options extends BaseOptions<Required<NoteVO>> {
  resourceManager?: ResourceManager;
}

type Patch = Pick<NotePatchDTO, 'body' | 'icon' | 'title'>;

export default abstract class NoteBaseEditor extends BaseEditor<Required<NoteVO>> {
  constructor(tile: Tile, { resourceManager, ...options }: Options) {
    super(tile, options);
    this.isTemp = Boolean(resourceManager);

    runInAction(() => {
      this.resourceManager = resourceManager;
    });

    this.resourceManager?.eventBus.on(ResourceManager.EventNames.Uploaded, this.reload.bind(this, true));

    this.entity = new NoteEntity(options.entityId, {
      signal: this.destroyController.signal,
      blob: resourceManager?.file?.data,
      path: options.path,
      value: options.value,
      options: () => ({ enabled: !this.isTemp }),
    });

    this.domainEventBus.on(DomainEventBus.eventNames.Updated, this.handleNoteUpdated.bind(this), {
      signal: this.destroyController.signal,
    });
  }

  // 一个临时的编辑器，用于预览文件效果
  public readonly isTemp: boolean;

  public readonly entity;

  @observable.ref public accessor resourceManager: ResourceManager | undefined;

  protected readonly remote = container.resolve(rpcToken);

  public readonly iconManager = new IconManager({ noteIds: this.entityId });

  protected readonly domainEventBus = container.resolve(DomainEventBus);

  public hasEdited = false;

  @computed
  public get title() {
    return this.entity.title || this.options.title;
  }

  @computed
  public get content() {
    return this.entity.content;
  }

  @computed
  public get icon() {
    return this.entity.icon || this.options.icon;
  }

  public readonly update = (patch: Patch) => {
    assert(this.entity.value.data, 'can not update when loading');
    const currentData = pick(this.entity.value.data, ['title', 'body', 'icon', 'type']);

    this.hasEdited = true;

    // 这里采用乐观更新
    this.entity.value.setData((note) => ({ ...note!, ...patch }));
    this.domainEventBus.emit(DomainEventBus.eventNames.Updated, {
      id: this.entityId,
      payload: patch,
      source: this,
    });

    // 若服务器更新失败，前端回退至之前的值
    this.upload(patch)?.catch(() => {
      this.entity.value.setData((note) => ({ ...note!, ...currentData }));
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
    assert(this.entity.value.data);

    this.tile.replace(this, {
      entityId: this.entityId,
      entityType: this.entity.type,
      mimeType: hard ? this.mimeType : this.entity.value.data.mimeType,
      value: hard ? undefined : this.entity.value.data,
      path: this.entity.path.data,
    });
  }

  public override destroy() {
    if (this.isTemp) {
      this.entity.blob.remove(); // 从缓存中移除。因为这是一个前端填充的临时 blob
    }

    this.resourceManager?.destroy();
    Promise.resolve(this.upload.flush()).then(() => super.destroy());
  }

  private handleNoteUpdated(e: UpdatedEvent) {
    if (e.source === this) {
      return;
    }

    if (e.id === this.entityId) {
      this.entity.value.setData((v) => defaults({}, e.payload, v));
    }

    if (e.payload.parentId !== undefined && this.entity.path.data?.some(({ id }) => id === e.id)) {
      this.entity.path.invalidate();
    }
  }
}
