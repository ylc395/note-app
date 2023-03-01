import uniqueId from 'lodash/uniqueId';
import { computed, makeObservable, action, observable } from 'mobx';
import EventEmitter from 'eventemitter3';

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
  Loaded = 'entityEditor.loaded',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default abstract class EntityEditor<T = unknown> extends EventEmitter {
  readonly id = uniqueId('editor-');
  abstract readonly tabView: {
    title: string;
    icon: string | null;
  };
  abstract readonly entityType: EntityTypes;
  abstract readonly breadcrumbs: Breadcrumbs;
  @observable entity?: T;

  constructor(public tile: Tile, readonly entityId: EntityId) {
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
    this.emit(Events.Loaded, entity);
  }
}
