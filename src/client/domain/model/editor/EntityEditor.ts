import uniqueId from 'lodash/uniqueId';
import { container } from 'tsyringe';
import { computed, makeObservable, observable, runInAction, reaction } from 'mobx';
import EventEmitter from 'eventemitter2';

import { token as remoteToken } from 'infra/Remote';
import type Tile from 'model/mosaic/Tile';
import type { EntityId, EntityTypes } from 'interface/Entity';

import type { Entity as NoteEditorEntity } from './NoteEditor';

type EditableEntity = NoteEditorEntity;

interface Breadcrumb {
  title: string;
  id: string;
  icon?: string;
}

export type Breadcrumbs = Array<Breadcrumb & { siblings: Breadcrumb[] }>;

export enum Events {
  Destroyed = 'entityEditor.destroyed',
  Activated = 'entityEditor.activated',
}

const entitiesMap: Record<string, { entity?: EditableEntity | Promise<EditableEntity>; count: number }> = {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default abstract class EntityEditor<T extends EditableEntity = any> extends EventEmitter {
  protected remote = container.resolve(remoteToken);
  readonly id = uniqueId('editor-');
  abstract readonly title: string;
  abstract readonly entityType: EntityTypes;
  abstract readonly breadcrumbs: Breadcrumbs;
  private disposeReaction?: ReturnType<typeof reaction>;
  protected abstract fetchEntity(): Promise<T>;
  @observable.ref entity?: T;

  constructor(protected readonly tile: Tile, readonly entityId: EntityId) {
    super();
    makeObservable(this);
  }

  destroy() {
    const key = this.entityKey;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const record = entitiesMap[key]!;

    record.count -= 1;

    if (record.count === 0) {
      delete entitiesMap[key];
    }

    this.emit(Events.Destroyed);
    this.disposeReaction && this.disposeReaction();
    this.removeAllListeners();
  }

  @computed
  get isActive() {
    return this.tile.isFocused && this.tile.currentTab?.id === this.id;
  }

  private get entityKey() {
    return `${this.entityType}-${this.entityId}`;
  }

  protected async init() {
    const key = this.entityKey;

    if (!entitiesMap[key]) {
      entitiesMap[key] = { count: 0 };
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const record = entitiesMap[key]!;

    record.count += 1;

    if (record.entity) {
      this.entity = (record.entity instanceof Promise ? await record.entity : record.entity) as T;
    } else {
      record.entity = new Promise((resolve) => {
        this.fetchEntity().then((entity) => {
          const result = observable(entity);

          runInAction(() => (this.entity = result));
          record.entity = result;
          resolve(result);
        });
      });
    }

    this.disposeReaction = reaction(
      () => this.isActive,
      (isActive) => isActive && this.emit(Events.Activated),
      { fireImmediately: true },
    );
  }
}
