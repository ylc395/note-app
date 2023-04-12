import { observable, makeObservable, computed, runInAction, action } from 'mobx';
import { container, singleton } from 'tsyringe';

import { token as remoteToken } from 'infra/Remote';
import type { ChildMemoVO, MemoDTO, MemoPatchDTO, MemoQuery, ParentMemoVO, PaginationMemeVO } from 'interface/Memo';

@singleton()
export default class MemoService {
  private readonly remote = container.resolve(remoteToken);
  constructor() {
    makeObservable(this);
  }
  @observable memos: ParentMemoVO[] = [];
  @observable totalCount = 0;
  @observable currentPage = 1;
  @observable pageSize = 10;
  @observable newContent = '';

  @computed
  get maxPage() {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  async load(page?: number) {
    const _page = page ?? this.currentPage;
    const {
      body: { total, list },
    } = await this.remote.get<MemoQuery, PaginationMemeVO>('/memos', { pageSize: this.pageSize, page: _page });

    runInAction(() => {
      this.totalCount = total;
      this.memos = list;
      this.currentPage = _page;
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
      this.newContent = '';
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
    this.totalCount = 0;
  }

  @action.bound
  updateNewContent(content: string) {
    return (this.newContent = content);
  }
}
