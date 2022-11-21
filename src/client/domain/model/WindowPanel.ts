import type { MaterialVO } from 'interface/Material';
import { action, makeObservable, observable } from 'mobx';
import uid from 'lodash/uniqueId';

import MaterialWindow from './window/MaterialWindow';

export default class WindowPanel {
  id = uid('panel-');
  constructor() {
    makeObservable(this);
  }

  @observable.ref currentTab?: MaterialWindow;
  @observable.shallow tabs: MaterialWindow[] = [];

  @action.bound
  createTab(entity: MaterialVO) {
    const tab = new MaterialWindow(entity);
    this.tabs.push(tab);
    this.currentTab = tab;
  }
}
