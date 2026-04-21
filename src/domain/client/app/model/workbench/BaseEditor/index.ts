import { uniqueId, debounce } from 'lodash-es';
import { action, computed, observable, runInAction } from 'mobx';
import assert from 'assert';
import type { ZodType } from 'zod';

import EventBus from '#domain/client/shared/infra/EventBus';
import container from '#utils/singletonContainer';
import type { EntityId, EntityPath, EntityTypes, Icon } from '#domain/shared/model/entity';
import { token as documentDbToken } from '#domain/client/shared/infra/documentDb';

import { EventNames, type Events } from './events';
import type Tile from '../Tile';
import { createQuery } from 'mobx-tanstack-query/preset';

export const uiStateStoreName = 'editor_UI_state';

export interface Options<T> {
  entityId: EntityId;
  title?: string;
  icon?: Icon | null;
  value?: T;
  path?: EntityPath;
}

export default abstract class BaseEditor<T = unknown> {
  constructor(tile: Tile, options: Options<T>) {
    this.options = options;

    runInAction(() => {
      this.tile = tile;
    });

    this.value = createQuery(this.fetchValue.bind(this), {
      queryKey: ['editor.value', this.entityId],
      refetchOnWindowFocus: true,
      abortSignal: this.destroyController.signal,
      initialData: this.options.value,
      options: () => ({
        enabled: this.isCurrent && !this.options.value,
      }),
    });

    this.path = createQuery(this.fetchPath.bind(this), {
      queryKey: ['editor.path', this.entityId],
      refetchOnWindowFocus: true,
      initialData: this.options.path,
      abortSignal: this.destroyController.signal,
      options: () => ({
        enabled: this.isCurrent && !this.options.path,
      }),
    });
  }

  private readonly db = container.resolve(documentDbToken);

  protected readonly options;

  public abstract readonly mimeType: string | null;

  public abstract readonly entityType: EntityTypes;

  protected abstract fetchValue(params: { signal: AbortSignal }): Promise<T>;

  protected abstract fetchPath(params: { signal: AbortSignal }): Promise<EntityPath>;

  public get entityId() {
    return this.options.entityId;
  }

  protected readonly saveUIState = debounce((value: Record<string, unknown>) => {
    this.db.put(uiStateStoreName, { ...value, id: this.entityId });
  }, 500);

  protected getUIState<T>(schema: ZodType<T>) {
    return this.db.getByKey(uiStateStoreName, this.entityId, schema);
  }

  public readonly id = uniqueId('editor-');

  public readonly events = new EventBus<Events<T>>(this.id);

  protected readonly destroyController = new AbortController();

  public readonly value;

  public readonly path;

  @observable.ref public accessor tile!: Tile;

  public abstract readonly title: string | null;

  public abstract readonly icon: Icon | null;

  @computed
  public get index() {
    return this.tile.editors.indexOf(this as BaseEditor<unknown>);
  }

  @computed
  public get isCurrent() {
    return this.tile.currentEditor === this;
  }

  @computed
  public get isGlobalCurrent() {
    return this.tile.workbench.currentEditor === this;
  }

  @action
  public moveTo(dest: BaseEditor<unknown> | Tile, switchTo?: boolean) {
    const destTile = !(dest instanceof BaseEditor) ? dest : dest.tile;
    const thisEditor = this as BaseEditor;

    if (destTile !== this.tile) {
      const sameEditor = destTile.findEditor(this.entityId);

      if (sameEditor) {
        destTile.switchToEditor(sameEditor);
        return;
      }

      destTile.addEditor(thisEditor, dest instanceof BaseEditor ? dest : undefined);
    } else {
      if (!(dest instanceof BaseEditor)) {
        // 此时 dest 为 tile，且肯定是 this.tile
        return;
      }

      // 在同一个 tile 里移动
      const index = destTile.editors.indexOf(thisEditor);
      assert(index >= 0, 'invalid dest');

      const newIndex = destTile.editors.indexOf(dest);

      destTile.editors.splice(index, 1);
      destTile.editors.splice(newIndex, 0, thisEditor);
    }

    if (switchTo) {
      destTile.switchToEditor(thisEditor);
    }
  }

  public focus() {
    this.events.emit(EventNames.Focus, this);
  }

  public toObject() {
    return {
      entityId: this.entityId,
      entityType: this.entityType,
      mimeType: this.mimeType,
      title: this.title || '',
      icon: this.icon,
    };
  }

  public destroy() {
    this.destroyController.abort();

    this.events.emit(EventNames.Destroy, this).then(() => {
      this.events.clearListeners();
    });
  }

  public static readonly eventNames = EventNames;
}
