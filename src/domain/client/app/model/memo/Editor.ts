import { action, observable } from 'mobx';
import assert from 'assert';

import type { MemoVO } from '#domain/shared/model/memo';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

export default class Editor {
  private readonly remote = container.resolve(rpcToken);

  constructor(private readonly options: { memo?: MemoVO; parentId?: MemoVO['parentId']; onDestroyed?: () => void }) {
    assert(!(options.memo && options.parentId), 'can not specify both memo and parentId');
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

    this.destroy();
  }

  public destroy() {
    this.options.onDestroyed?.();
  }
}
