import { action, computed } from 'mobx';
import assert from 'assert';

import type { MemoVO } from '#domain/shared/model/memo';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { eventBus, EventNames } from '../eventBus';
import { create as createUIState } from './uiState';

export default class Editor {
  private readonly remote = container.resolve(rpcToken);

  private readonly uiState;

  constructor(private readonly options: { memo?: MemoVO; parentId?: MemoVO['parentId']; onDestroyed?: () => void }) {
    assert(options.memo || options.parentId, 'memo or parentId can not both be undefined');
    assert(!(options.memo && options.parentId), 'can not specify both memo and parentId');

    const id = options.parentId ? options.parentId : options.memo!.id;
    this.uiState = createUIState(`${id}${options.parentId ? '-new-child' : ''}`);
    this.updateBody(options.memo?.body ?? '');
  }

  @computed
  public get body() {
    assert(typeof this.uiState.value?.body === 'string');
    return this.uiState.value?.body;
  }

  @action
  public updateBody(value: string) {
    this.uiState.update({ body: value });
  }

  public async submit() {
    if (this.options.memo) {
      const payload = { body: this.body };
      await this.remote.memo.updateOne.mutate([this.options.memo.id, payload]);
      eventBus.emit(EventNames.Updated, { id: this.options.memo.id, payload, trigger: this });
    } else {
      const newMemo = await this.remote.memo.create.mutate({ body: this.body, parentId: this.options.parentId });
      eventBus.emit(EventNames.Created, newMemo);
    }

    this.destroy();
  }

  public destroy() {
    this.uiState.clear();
    this.options.onDestroyed?.();
  }
}
