import uniqueId from 'lodash/uniqueId';
import { container } from 'tsyringe';
import { computed, makeObservable } from 'mobx';
import EventEmitter from 'eventemitter2';

import { token as remoteToken } from 'infra/Remote';
import type Window from 'model/windowManager/Window';

export default abstract class EntityEditor<T> extends EventEmitter {
  protected readonly remote = container.resolve(remoteToken);
  readonly id = uniqueId('editor-');
  abstract title: string;
  abstract entity?: T;

  constructor(protected readonly window: Window, readonly entityId: string) {
    super();
    makeObservable(this);
  }

  protected abstract loadEntity(): Promise<void>;

  destroy() {
    this.removeAllListeners();
  }

  @computed
  get isActive() {
    return this.window.currentTab?.editor.id === this.id;
  }
}
