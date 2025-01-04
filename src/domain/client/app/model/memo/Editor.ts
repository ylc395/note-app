import { action, observable } from 'mobx';
import assert from 'assert';

import type { MemoVO } from '#domain/shared/model/memo';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import { eventBus as domainEventBus, EventNames as DomainEventNames } from './eventBus';

export default class Editor {
  constructor(private readonly options: { memo?: MemoVO; parentId?: MemoVO['parentId']; onDestroyed?: () => void }) {
    assert(options.memo || options.parentId, 'memo or parentId can not both be undefined');
    assert(!(options.memo && options.parentId), 'can not specify both memo and parentId');

    this.update(options.memo?.body ?? '');
  }

  private readonly remote = container.resolve(rpcToken);

  @observable public accessor value!: string;

  @action
  public update(value: string) {
    this.value = value;
  }

  public async submit() {
    if (this.options.memo) {
      const payload = { body: this.value };
      await this.remote.memo.updateOne.mutate([this.options.memo.id, payload]);
      domainEventBus.emit(DomainEventNames.Updated, { id: this.options.memo.id, payload });
    }

    if (this.options.parentId !== undefined) {
      const newMemo = await this.remote.memo.create.mutate({ body: this.value, parentId: this.options.parentId });
      domainEventBus.emit(DomainEventNames.Created, newMemo);
    }

    this.destroy();
  }

  public destroy() {
    this.options.onDestroyed?.();
  }
}
