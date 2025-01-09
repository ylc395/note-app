import assert from 'assert';
import { keyBy } from 'lodash-es';
import { action, computed, observable } from 'mobx';

import EventBus from '../../infra/EventBus';

enum EventNames {
  'Created' = 'created',
  'Updated' = 'updated',
  'Removed' = 'removed',
}

export default class Collection<T extends { id: string }> {
  constructor(items?: T[]) {
    items && this.init(items);
  }

  private readonly events = new EventBus<{
    [EventNames.Created]: T;
    [EventNames.Updated]: T;
    [EventNames.Removed]: T;
  }>('collection');

  public readonly on = this.events.on.bind(this.events);

  @observable.shallow protected accessor itemsMap: Record<string, T> = {};

  @action
  private init(items: T[]) {
    this.itemsMap = keyBy(items, ({ id }) => id);
  }

  public has(item: T['id'] | T) {
    return Boolean(typeof item === 'string' ? this.itemsMap[item] : this.itemsMap[item.id]);
  }

  @computed
  public get value() {
    return Object.values(this.itemsMap);
  }

  @action
  public remove(item: T | T['id']) {
    assert(this.has(item), 'invalid id');

    const itemToRemove = typeof item === 'string' ? this.get(item) : item;
    delete this.itemsMap[itemToRemove.id];
    this.events.emit(EventNames.Removed, itemToRemove);
  }

  @action
  public add(item: T) {
    assert(!this.has(item), 'can not add twice');
    this.itemsMap[item.id] = item;
    this.events.emit(EventNames.Created, item);

    return this;
  }

  public get(id: T['id']) {
    const item = this.itemsMap[id];
    assert(item, 'invalid id');

    return item;
  }

  @action
  public update(id: T['id'], patch: Partial<T>) {
    this.itemsMap[id] = { ...this.get(id), ...patch };
    this.events.emit(EventNames.Updated, this.itemsMap[id]);
    return this;
  }

  public static readonly eventNames = EventNames;
}
