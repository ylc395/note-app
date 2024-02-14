import { observable, makeObservable, runInAction, computed } from 'mobx';
import { container, singleton } from 'tsyringe';

import { token as rpcToken } from '@domain/common/infra/rpc';
import type { MemoDTO, MemoPatchDTO, MemoVO } from '@shared/domain/model/memo';
import { last } from 'lodash-es';
import { buildIndex } from '@shared/utils/collection';
import assert from 'assert';

@singleton()
export default class MemoService {
  private readonly remote = container.resolve(rpcToken);

  constructor() {
    makeObservable(this);
  }

  @computed
  public get memos() {
    return Object.values(this.memosMap).sort((memo1, memo2) => {
      if (memo1.isPinned !== memo2.isPinned) {
        return memo1.isPinned ? 1 : -1;
      }

      return memo1.createdAt - memo2.createdAt;
    });
  }

  @observable
  private readonly memosMap: Record<MemoVO['id'], MemoVO> = {};

  public async load() {
    const limit = 30;
    const lastMemo = last(this.memos);
    const memos = await this.remote.memo.query.query({ after: lastMemo?.id, limit });
    Object.assign(this.memosMap, buildIndex(memos));

    runInAction(() => {
      this.memos.push(...memos);
    });

    return memos.length === limit;
  }

  public async createMemo(memo: MemoDTO) {
    const newMemo = await this.remote.memo.create.mutate(memo);

    runInAction(() => {
      this.memosMap[newMemo.id] = newMemo;
    });
  }

  public async toggleMemoPin(id: MemoVO['id']) {
    const memo = this.memosMap[id];
    assert(memo);

    const isPinned = !memo.isPinned;
    await this.remote.memo.updateOne.mutate([id, { isPinned }]);

    runInAction(() => {
      memo.isPinned = isPinned;
    });
  }

  public async updateMemo(id: MemoVO['id'], patch: MemoPatchDTO) {
    await this.remote.memo.updateOne.mutate([id, patch]);

    runInAction(() => {
      const memo = this.memosMap[id];
      assert(memo);

      Object.assign(memo, patch);
    });
  }
}
