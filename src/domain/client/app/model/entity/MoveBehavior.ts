import assert from 'assert';
import { observable } from 'mobx';

import EventBus from '../../infra/EventBus';
import type { EntityLocator } from '#domain/client/shared/model/entity';
import { EventNames, MoveEvent } from './events';

export default class MoveBehavior {
  public readonly events = new EventBus<{
    [EventNames.Move]: MoveEvent;
  }>('MoveBehavior');

  @observable.ref public accessor movingItems: EntityLocator[] | undefined;

  public start(items: EntityLocator[]) {
    assert(!this.movingItems, 'moving now');
    this.movingItems = items;
  }

  public perform(target: MoveEvent['target']) {
    assert(this.movingItems, 'can not perform');
    this.events.emit(EventNames.Move, { items: this.movingItems, target });
    this.cancel();
  }

  public cancel() {
    assert(this.movingItems, 'can not stop');
    this.movingItems = undefined;
  }

  public static readonly eventNames = EventNames;
}
