import assert from 'assert';
import { action, observable } from 'mobx';

import EventBus from '../../infra/EventBus';
import type { EntityLocator } from '#domain/client/shared/model/entity';
import { EventNames, MoveEvent } from './events';

export default class MoveBehavior {
  public readonly events = new EventBus<{
    [EventNames.Move]: MoveEvent;
  }>('MoveBehavior');

  @observable.ref public accessor movingItems: EntityLocator[] | undefined;

  @action.bound
  public start(items: EntityLocator[]) {
    assert(!this.movingItems, 'moving now');
    this.movingItems = items;
  }

  public perform(target: MoveEvent['target']) {
    assert(this.movingItems, 'can not perform');
    this.events.emit(EventNames.Move, { items: this.movingItems, target });
    this.cancel();
  }

  @action.bound
  public cancel() {
    this.movingItems = undefined;
  }

  public static readonly eventNames = EventNames;
}
