import uniqueId from 'lodash/uniqueId';
import { container } from 'tsyringe';
import { makeObservable, action, observable } from 'mobx';
import { Emitter } from 'strict-event-emitter';

import type { EditableEntityLocator, EntityId, EditableEntityTypes } from 'model/entity';
import { token as remoteToken } from 'infra/remote';

type Events = {
  metadataUpdated: [];
};

export default abstract class EditableEntity<T = unknown, E extends Events = Events> extends Emitter<E> {
  protected readonly remote = container.resolve(remoteToken);
  readonly id = uniqueId('editableEntity-');
  abstract readonly entityType: EditableEntityTypes;
  protected abstract init(): void;

  @observable entity?: T;

  constructor(public readonly entityId: EntityId) {
    super();
    makeObservable(this);
    this.init();
  }

  @action
  protected load(entity: T) {
    this.entity = entity;
  }

  toEntityLocator(): EditableEntityLocator {
    return { entityType: this.entityType, entityId: this.entityId };
  }

  destroy() {
    this.removeAllListeners();
  }
}
