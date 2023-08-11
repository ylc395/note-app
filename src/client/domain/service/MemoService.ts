import { observable, makeObservable, runInAction, action } from 'mobx';
import { container, singleton } from 'tsyringe';

import { token as remoteToken } from 'infra/remote';
import type { ChildMemoVO, MemoDTO, MemoPatchDTO, ParentMemoVO } from 'model/Memo';

@singleton()
export default class MemoService {
  private readonly remote = container.resolve(remoteToken);
  constructor() {
    makeObservable(this);
  }
  @observable memos: ParentMemoVO[] = [];
  @observable newContent = '';

  async load() {
    const { body: memos } = await this.remote.get<void, ParentMemoVO[]>('/memos');

    runInAction(() => {
      this.memos = memos;
    });
  }

  async createMemo(childMemo?: { parent: ParentMemoVO; content: string }) {
    if (!this.newContent && !childMemo?.content) {
      throw new Error('can not be empty');
    }

    const { body: created } = await this.remote.post<MemoDTO, ParentMemoVO>(
      '/memos',
      childMemo ? { content: childMemo.content, parentId: childMemo.parent.id } : { content: this.newContent },
    );

    if (!childMemo) {
      runInAction(() => {
        this.newContent = '';
      });
      await this.load();
    } else {
      runInAction(() => {
        childMemo.parent.threads.unshift(created);
      });
    }
  }

  async toggleMemoPin(memo: ParentMemoVO) {
    await this.remote.patch<MemoPatchDTO, ParentMemoVO>(`/memos/${memo.id}`, {
      isPinned: !memo.isPinned,
    });

    await this.load();
  }

  async updateContent(memo: ParentMemoVO | ChildMemoVO, content: NonNullable<MemoPatchDTO['content']>) {
    if (!content) {
      throw new Error('can not be empty');
    }

    const { body: updated } = await this.remote.patch<MemoPatchDTO, ParentMemoVO>(`/memos/${memo.id}`, { content });

    runInAction(() => {
      memo.content = updated.content;
    });
  }

  @action
  reset() {
    this.memos = [];
  }

  @action.bound
  updateNewContent(content: string) {
    return (this.newContent = content);
  }
}
