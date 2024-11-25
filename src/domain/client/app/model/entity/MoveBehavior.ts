import assert from 'assert';
import EventBus from '../../infra/EventBus';
import { EventNames, MoveEvent, type EntityLocator } from './events';
import { observable } from 'mobx';

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
