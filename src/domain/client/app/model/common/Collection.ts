import assert from 'assert';
import { keyBy } from 'lodash-es';
import { action, computed, observable } from 'mobx';

export default class Collection<T extends { id: string }> {
  constructor(items?: T[]) {
    items && this.init(items);
  }

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
    delete this.itemsMap[typeof item === 'string' ? item : item.id];
  }

  @action
  public add(item: T) {
    assert(!this.has(item), 'can not add twice');
    this.itemsMap[item.id] = item;

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
    return this;
  }
}
