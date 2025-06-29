import { action, observable } from 'mobx';

export default class Canvas {
  @observable public accessor isEnabled = false;

  @action
  public toggle() {
    this.isEnabled = !this.isEnabled;
  }
}
