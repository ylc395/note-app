import { singleton } from 'tsyringe';
import { makeObservable, action } from 'mobx';
import WindowManager from 'model/windowManager/Manger';
import type { OpenableEntity } from 'model/windowManager/Window';

export type WindowId = string;

@singleton()
export default class WorkbenchService {
  readonly windowManager = new WindowManager();

  constructor() {
    makeObservable(this);
  }

  @action.bound
  openEntity(entity: OpenableEntity, type?: 'newTab' | 'newWindow') {
    const targetWindow = this.windowManager.getTargetWindow();

    if (type === 'newWindow') {
      if (targetWindow.isRoot && targetWindow.tabs.length === 0) {
        targetWindow.open(entity);
        return;
      }

      const newWindow = this.windowManager.splitWindow(targetWindow.id);
      newWindow.open(entity);
    } else {
      targetWindow.open(entity, type === 'newTab');
    }
  }
}
