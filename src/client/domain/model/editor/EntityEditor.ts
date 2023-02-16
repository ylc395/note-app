import { container } from 'tsyringe';
import uid from 'lodash/uniqueId';

import { token as remoteToken } from 'infra/Remote';
import type Window from 'model/Window';
import { computed, makeObservable } from 'mobx';

export default abstract class EntityEditor {
  constructor(protected readonly window: Window, readonly entityId: string) {
    makeObservable(this);
  }
  readonly id = uid('editor-');
  protected readonly remote = container.resolve(remoteToken);
  abstract title: string;
  abstract destroy(): void;

  @computed
  get isVisible() {
    return this.window.currentTab?.editor.id === this.id;
  }
}
