import assert from 'assert';
import { action, makeObservable, observable } from 'mobx';
import { singleton } from 'tsyringe';

@singleton()
export default class ModalManager {
  constructor() {
    makeObservable(this);
  }

  // for UX reason, only one active modal is allowed.
  @observable
  public currentModalId?: symbol;

  @action.bound
  public close() {
    assert(this.currentModalId);
    this.currentModalId = undefined;
  }

  @action.bound
  public show(id: symbol) {
    assert(!this.currentModalId);
    this.currentModalId = id;
  }
}
