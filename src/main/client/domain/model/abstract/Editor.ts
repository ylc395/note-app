import uniqueId from 'lodash/uniqueId';
import { container } from 'tsyringe';
import { makeObservable, action, observable } from 'mobx';
import { Emitter, type EventMap } from 'strict-event-emitter';

import type Tile from 'model/workbench/Tile';
import type { EntityId, EntityTypes } from 'interface/entity';
import { token as remoteToken } from 'infra/remote';

import { token as editorManagerToken } from './EditorManager';

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
export default abstract class EntityEditor<
  T = unknown,
  E extends CommonEditorEvents = CommonEditorEvents,
> extends Emitter<E> {
  protected remote = container.resolve(remoteToken);
  protected editorManager = container.resolve(editorManagerToken);
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

  @action
  protected load(entity: T) {
    if (this.entity) {
      throw new Error('can not reload entity');
    }

    this.entity = entity;
  }
}
