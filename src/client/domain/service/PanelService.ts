import { singleton } from 'tsyringe';
import { observable, makeObservable, action } from 'mobx';

import WindowPanel from 'model/WindowPanel';
import type { MaterialVO } from 'interface/Material';

@singleton()
export default class PanelService {
  constructor() {
    makeObservable(this);
  }

  @observable.shallow panels: WindowPanel[] = [];

  @action.bound
  open(entity: MaterialVO) {
    const currentPanel = this.panels[0];

    if (currentPanel) {
      currentPanel.createTab(entity);
    } else {
      const newPanel = new WindowPanel();
      this.panels.push(newPanel);
      newPanel.createTab(entity);
    }
  }
}
