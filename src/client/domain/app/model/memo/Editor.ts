import { container } from 'tsyringe';
import { makeObservable, observable } from 'mobx';
import type { MemoVO } from '@shared/domain/model/memo';
import { action } from 'mobx';

import { token as rpcToken } from '@domain/common/infra/rpc';
import type { EntityParentId } from '../entity';

export default class Editor {
  private readonly remote = container.resolve(rpcToken);
  constructor(
    private readonly options: {
      onSubmit: (newMemo: MemoVO) => void;
      onCancel: () => void;
      initial?: string;
      memo?: MemoVO;
      parentId?: EntityParentId;
    },
  ) {
    this.content = options.initial || options.memo?.body || '';
    makeObservable(this);
  }

  public readonly cancel = () => {
    this.options.onCancel();
  };

  public get isDirty() {
    if (this.options.memo) {
      return this.options.memo.body === this.content;
    }

    return Boolean(this.content);
  }

  @observable
  public content: string;

  public get memoId() {
    return this.options.memo?.id;
  }

  public readonly submit = async () => {
    const newMemo = this.options.memo
      ? await this.remote.memo.updateOne.mutate([this.options.memo.id, { body: this.content }])
      : await this.remote.memo.create.mutate({ body: this.content, parentId: this.options.parentId });
    this.options.onSubmit(newMemo);
  };

  @action
  public updateContent(value: string) {
    this.content = value;
  }
}
