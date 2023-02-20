import uniqueId from 'lodash/uniqueId';
import { computed, makeObservable, observable } from 'mobx';
import EventEmitter from 'eventemitter2';

import type Window from 'model/windowManager/Window';
import type { EntityId } from 'interface/Entity';

export enum Events {
  Destroyed = 'entityEditor.destroyed',
}

export default abstract class EntityEditor<T = unknown> extends EventEmitter {
  readonly id = uniqueId('editor-');
  abstract title: string;
  @observable entity?: T;

  constructor(protected readonly window: Window, readonly entityId: EntityId) {
    super();
    makeObservable(this);
  }

  destroy() {
    this.emit(Events.Destroyed);
    this.removeAllListeners();
  }

  @computed
  get isActive() {
    return this.window.currentTab?.editor.id === this.id;
  }
}
