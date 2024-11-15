import { action, observable } from 'mobx';
import assert from 'assert';

import type { MemoVO } from '#domain/shared/model/memo';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import EventBus from '../../infra/EventBus';

export enum EventNames {
  Destroyed = 'destroyed',
  Submitted = 'Submitted',
}

type Events = {
  [EventNames.Destroyed]: undefined;
  [EventNames.Submitted]: undefined;
};

export default class Editor extends EventBus<Events> {
  private readonly remote = container.resolve(rpcToken);

  constructor(private readonly options: { memo?: MemoVO; parentId?: MemoVO['parentId'] }) {
    assert(!(options.memo && options.parentId), 'can not specify both memo and parentId');
    super(`memo-editor-${options.memo?.id ?? 'new'}`);
    this.content = options.memo?.body ?? '';
  }

  @observable public accessor content: string;

  @action
  public updateContent(value: string) {
    this.content = value;
  }

  public async submit() {
    if (this.options.memo) {
      await this.remote.memo.updateOne.mutate([this.options.memo.id, { body: this.content }]);
    } else {
      await this.remote.memo.create.mutate({ body: this.content, parentId: this.options.parentId });
    }

    this.emit(EventNames.Submitted);
    this.destroy();
  }

  public destroy() {
    this.emit(EventNames.Destroyed);
    this.clearListeners();
  }
}
