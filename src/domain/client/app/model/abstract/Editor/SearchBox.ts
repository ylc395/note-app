import { action, observable } from 'mobx';

export default class SearchBox {
  @observable public accessor isEnabled = false;

  @action.bound
  public toggle() {
    this.isEnabled = !this.isEnabled;
  }

  @observable public accessor keyword = '';
}
