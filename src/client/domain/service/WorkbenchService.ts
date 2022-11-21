import { singleton } from 'tsyringe';
import { observable, makeObservable, action } from 'mobx';

import Window, { type Openable } from 'model/Window';

@singleton()
export default class WorkbenchService {
  @observable.shallow windows: Window[] = [];
  @observable.ref currentWindow?: Window;
  constructor() {
    makeObservable(this);
  }

  @action.bound
  open(entity: Openable) {
    if (!this.currentWindow) {
      const newWindow = new Window();
      this.windows.push(newWindow);
      this.currentWindow = newWindow;
    }

    this.currentWindow.open(entity);
  }
}
