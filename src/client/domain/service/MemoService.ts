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
  @observable pageSize = 20;

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

  async createMemo(content: NonNullable<MemoDTO['content']>, parent?: ParentMemoVO) {
    if (!content) {
      throw new Error('can not be empty');
    }

    const { body: created } = await this.remote.post<MemoDTO, ParentMemoVO>('/memos', {
      content,
      ...(parent ? { parentId: parent.id } : null),
    });

    if (parent) {
      runInAction(() => {
        parent.threads.unshift(created);
      });
    } else {
      await this.load();
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
}
