import uniqueId from 'lodash/uniqueId';
import { makeObservable, action, observable } from 'mobx';
import { Emitter, type EventMap } from 'strict-event-emitter';

import type Tile from 'model/workbench/Tile';
import type { EntityId, EntityTypes } from 'interface/entity';

interface Breadcrumb {
  title: string;
  id: string;
  icon?: string;
}

export type Breadcrumbs = Array<Breadcrumb & { siblings: Breadcrumb[] }>;

export enum Events {
  Destroyed = 'entityEditor.destroyed',
}

export interface CommonEditorEvents extends EventMap {
  [Events.Destroyed]: [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default abstract class EntityEditor<T = any, E extends CommonEditorEvents = any> extends Emitter<E> {
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

  @action.bound
  loadEntity(entity: T) {
    if (this.entity) {
      throw new Error('can not reload entity');
    }

    this.entity = entity;
  }
}
