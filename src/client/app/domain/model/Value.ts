import { action, observable, makeObservable, computed } from 'mobx';

export default class Value<T> {
  constructor(value?: T) {
    if (typeof value !== 'undefined') {
      this._value = value;
    }

    makeObservable(this);
  }

  @observable private _value?: T;

  @action.bound
  set(value: T) {
    this._value = value;
  }

  @computed
  get value() {
    return this._value;
  }

  @action.bound
  reset() {
    this._value = undefined;
  }
}
