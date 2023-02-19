import { container } from 'tsyringe';
import uid from 'lodash/uniqueId';
import { computed, makeObservable } from 'mobx';
import EventEmitter from 'eventemitter2';

import { token as remoteToken } from 'infra/Remote';
import type Window from 'model/windowManager/Window';

export default abstract class EntityEditor extends EventEmitter {
  constructor(protected readonly window: Window, readonly entityId: string) {
    super();
    makeObservable(this);
  }
  readonly id = uid('editor-');
  protected readonly remote = container.resolve(remoteToken);
  abstract title: string;
  destroy() {
    this.removeAllListeners();
  }

  @computed
  get isCurrent() {
    return this.window.currentTab?.editor.id === this.id;
  }
}
