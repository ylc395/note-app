import assert from 'assert';
import { partial } from 'lodash-es';
import { action, makeObservable, observable } from 'mobx';
import { singleton } from 'tsyringe';

import type { PromptToken } from '@shared/domain/infra/ui';

@singleton()
export default class ModalManager {
  constructor() {
    makeObservable(this);
  }

  // for UX reason, only one active modal is allowed.
  @observable
  private currentModalId?: PromptToken<unknown>;

  @action.bound
  public close() {
    assert(this.currentModalId);
    this.currentModalId = undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private confirm?: (value: any) => void;

  public use<T>(token: PromptToken<T>) {
    const resolve = action((value: T | undefined) => {
      assert(this.confirm);
      this.confirm(value);
      this.currentModalId = undefined;
      this.confirm = undefined;
    });

    return {
      isOpen: this.currentModalId === token,
      cancel: partial(resolve, undefined),
      submit: resolve,
    };
  }

  @action.bound
  public show<T>(id: PromptToken<T>) {
    assert(!this.currentModalId, 'There is already a modal');
    this.currentModalId = id;

    return new Promise<T | undefined>((resolve) => {
      this.confirm = resolve;
    });
  }
}
