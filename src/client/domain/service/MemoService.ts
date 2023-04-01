import { observable, makeObservable, computed, runInAction } from 'mobx';
import { container, singleton } from 'tsyringe';

import { token as remoteToken } from 'infra/Remote';
import type { MemoDTO, MemoPatchDTO, MemoQuery, MemoVO, PaginationMemeVO } from 'interface/Memo';

@singleton()
export default class MemoService {
  private readonly remote = container.resolve(remoteToken);
  constructor() {
    makeObservable(this);
  }
  @observable memos: MemoVO[] = [];
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

  async createMemo(memo: MemoDTO) {
    if (!memo.content) {
      throw new Error('can not be empty');
    }

    const { body: created } = await this.remote.post<MemoDTO, MemoVO>('/memos', memo);

    if (memo.parentId) {
      const parent = this.memos.find(({ id }) => id === memo.parentId);

      if (!parent) {
        throw new Error('no parent');
      }

      runInAction(() => {
        parent.threads.unshift(created);
      });
    } else {
      await this.load();
    }
  }

  async toggleMemoPin(memo: MemoVO) {
    await this.remote.patch<MemoPatchDTO, MemoVO>(`/memos/${memo.id}`, {
      isPinned: !memo.isPinned,
    });

    await this.load();
  }
}
