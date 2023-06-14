import uniqueId from 'lodash/uniqueId';
import { container } from 'tsyringe';
import { makeObservable, action, observable } from 'mobx';
import { Emitter, type EventMap } from 'strict-event-emitter';

import type Tile from 'model/workbench/Tile';
import type { EntityId, EntityLocator, EntityTypes } from 'interface/entity';
import { token as remoteToken } from 'infra/remote';
import type EditorView from './EditorView';

interface Breadcrumb {
  title: string;
  id: string;
  icon?: string;
}

export type Breadcrumbs = Array<Breadcrumb & { siblings: Breadcrumb[] }>;

export enum Events {
  Destroyed = 'entityEditor.destroyed',
}

interface CommonEditorEvents extends EventMap {
  [Events.Destroyed]: [];
}

export default abstract class EntityEditor<T = unknown> extends Emitter<CommonEditorEvents> {
  protected remote = container.resolve(remoteToken);
  readonly id = uniqueId('editor-');
  @observable entity?: T;

  constructor(public tile: Tile, readonly entityId: EntityId) {
    super();
    makeObservable(this);
    this.init();
  }

  destroy() {
    this.emit(Events.Destroyed);
    this.removeAllListeners();
  }

  @action
  protected load(entity: T) {
    if (this.entity) {
      throw new Error('can not reload entity');
    }

    this.entity = entity;
  }

  abstract readonly tabView: { title: string; icon: string | null };
  abstract readonly entityType: EntityTypes;
  abstract readonly breadcrumbs: Breadcrumbs;
  protected abstract init(): void;
  toEntityLocator(): EntityLocator {
    return { type: this.entityType, id: this.entityId };
  }

  activeView: EditorView | null = null;
}
