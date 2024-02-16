import { container } from 'tsyringe';
import { makeObservable, observable } from 'mobx';
import type { MemoVO } from '@shared/domain/model/memo';
import assert from 'assert';

import { token as rpcToken } from '@domain/common/infra/rpc';
import { action } from 'mobx';

export default class Editor {
  private readonly remote = container.resolve(rpcToken);

  constructor(
    private readonly options: {
      onSubmit?: (newMemo: MemoVO) => void;
      memo?: MemoVO;
    },
  ) {
    this.content = options.memo?.body || '';
    makeObservable(this);
  }

  public get memoId() {
    assert(this.options.memo);
    return this.options.memo?.id;
  }

  @observable
  public content: string;

  public readonly submit = async () => {
    const newMemo = this.options.memo
      ? await this.remote.memo.updateOne.mutate([this.options.memo.id, { body: this.content }])
      : await this.remote.memo.create.mutate({ body: this.content });
    this.options.onSubmit?.(newMemo);
    this.reset();
  };

  @action
  public updateContent(value: string) {
    this.content = value;
  }

  @action.bound
  public reset() {
    this.content = '';
  }
}
