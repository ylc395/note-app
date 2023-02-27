import uniqueId from 'lodash/uniqueId';
import { computed, makeObservable, action, observable } from 'mobx';
import EventEmitter from 'eventemitter2';

import type Tile from 'model/workbench/Tile';
import type { EntityId, EntityTypes } from 'interface/Entity';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default abstract class EntityEditor<T = unknown> extends EventEmitter {
  readonly id = uniqueId('editor-');
  abstract readonly title: string;
  abstract readonly entityType: EntityTypes;
  abstract readonly breadcrumbs: Breadcrumbs;
  @observable.ref entity?: T;

  constructor(protected readonly tile: Tile, readonly entityId: EntityId) {
    super();
    makeObservable(this);
  }

  destroy() {
    this.emit(Events.Destroyed);
    this.removeAllListeners();
  }

  @computed
  get isActive() {
    return this.tile.isFocused && this.tile.currentEditor?.id === this.id;
  }

  @action.bound
  loadEntity(entity: T) {
    if (this.entity) {
      throw new Error('can not reload entity');
    }

    this.entity = entity;
  }
}
