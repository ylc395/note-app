import { computed } from 'mobx';
import { createInfiniteQuery, createQuery } from 'mobx-tanstack-query/preset';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { MemoVO } from '#domain/shared/model/memo';

import DomainEventBus from '../EventBus';
import Filter from './Filter';
import assert from 'assert';

interface NextPageParams {
  isPinned?: boolean;
  limit?: number;
  endId?: string;
  startId?: string;
  keyword?: string;
}

export default class MemoList {
  constructor() {
    this.countQuery = createQuery(({ signal }) => this.remote.memo.queryCount.query(this.filter.params, { signal }), {
      options: () => ({
        queryKey: ['memos', 'count', this.filter.params] as const,
      }),
    });

    // 带搜索关键词时，直接在第一页中展示所有结果，不再分页
    this.childrenQuery = createInfiniteQuery(
      ({ signal, pageParam, queryKey: [_, params] }): Promise<MemoVO[]> =>
        this.remote.memo.queryList.query({ ...pageParam, ...params }, { signal }),
      {
        getNextPageParam: (lastPage, _, lastPageParam) =>
          this.getNextPageParams({ lastPage, lastPageParam: lastPageParam! }),
        initialPageParam: this.getNextPageParams(), // 这里不得不重复写一行来绕开非空的类型限制
        options: () => ({
          queryKey: ['memos', this.filter.params] as const,
          initialPageParam: this.getNextPageParams(),
          enabled: !this.filter.isRandom,
        }),
      },
    );

    this.eventBus.on([DomainEventBus.eventNames.Created, DomainEventBus.eventNames.Removed], () => {
      this.countQuery.invalidate();
    });
  }

  public readonly createNewMemo = async (value: string) => {
    const newMemo = await this.remote.memo.create.mutate({ body: value });
    this.eventBus.emit(DomainEventBus.eventNames.Created, newMemo);
    this.childrenQuery.invalidate();
  };

  private readonly canBeRandom = (): boolean => {
    return typeof this.count === 'number' && this.count > 30;
  };

  public readonly filter = new Filter({
    canBeRandom: this.canBeRandom,
  });

  private readonly eventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  private readonly countQuery;

  public readonly childrenQuery;

  @computed
  public get count() {
    return this.countQuery.result.data;
  }

  private getNextPageParams(params?: {
    lastPage: MemoVO[];
    lastPageParam: { limit?: number; isPinned?: boolean };
  }): NextPageParams | undefined {
    if (this.filter.isSearching()) {
      // 搜索时，只查一次（一页填满）。这里就直接返回了
      if (params) {
        return;
      }

      return {
        keyword: this.filter.keyword,
      };
    }

    const pageLimit = this.filter.params.limit;

    // 第一次请求
    if (!params) {
      return {
        isPinned: true,
        limit: pageLimit,
      };
    }

    const { lastPage, lastPageParam } = params;
    assert(lastPageParam.limit);

    if (lastPage.length < lastPageParam.limit) {
      // 上一次查 pinned，这一次则查非 pinned，补足 limit 个
      if (lastPageParam.isPinned) {
        return {
          isPinned: false,
          limit: pageLimit - lastPage.length,
        };
      }

      // 上一次查的是非 pinned，则数量不够说明已经请求完了
      return;
    }

    // 上一次查足量了，说明可以继续查
    const lastOne = lastPage.at(-1);

    if (lastOne) {
      const params = {
        limit: pageLimit,
        isPinned: lastPageParam.isPinned,
      };

      if (this.filter.order === 'asc') {
        return { ...params, startId: lastOne.id };
      } else {
        return { ...params, endId: lastOne.id };
      }
    }
  }
}
