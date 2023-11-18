import uniqueId from 'lodash/uniqueId';
import { container } from 'tsyringe';
import { makeObservable, action, observable } from 'mobx';
import { Emitter, type EventMap } from 'strict-event-emitter';

import type { EntityId, EntityLocator, EntityTypes } from 'model/entity';
import { token as remoteToken } from 'infra/remote';

export enum Events {
  Destroyed = 'editableEntity.destroyed',
}

interface CommonEditorEvents extends EventMap {
  [Events.Destroyed]: [];
}

export default abstract class Editable<T = unknown> extends Emitter<CommonEditorEvents> {
  protected remote = container.resolve(remoteToken);
  readonly id = uniqueId('editableEntity-');
  abstract readonly entityType: EntityTypes;
  @observable entity?: T;
  protected abstract init(): void;
  constructor(readonly entityId: EntityId) {
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

  toEntityLocator(): EntityLocator {
    return { entityType: this.entityType, entityId: this.entityId };
  }
}
