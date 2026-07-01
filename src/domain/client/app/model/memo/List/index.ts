import { action, autorun, computed, observable } from 'mobx';
import { createInfiniteQuery, createQuery } from 'mobx-tanstack-query/preset';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { MemoVO } from '#domain/shared/model/memo';

import DomainEventBus from '../EventBus';
import Filter from './Filter';

export default class MemoList {
  constructor() {
    this.countQuery = createQuery(
      ({ signal }) => this.remote.memo.queryCount.query({ parentId: null, ...this.filter.params }, { signal }),
      {
        options: () => ({
          enabled: this.isActive,
          queryKey: ['memos', 'count', this.filter.params] as const,
        }),
      },
    );

    this.childrenQuery = createInfiniteQuery(
      ({ signal, pageParam, queryKey: [_, params] }): Promise<MemoVO[]> =>
        this.remote.memo.queryList.query({ ...pageParam, ...params }, { signal }),
      {
        getNextPageParam: (lastPage, _, lastPageParam) =>
          this.getNextPageParams({ lastPage, lastPageParam: lastPageParam! }),
        initialPageParam: this.getNextPageParams(),
        options: () => ({
          enabled: this.isActive,
          queryKey: ['memos', this.filter.params] as const,
        }),
      },
    );

    autorun(() => {
      this.filter.timeSelector.setActive(this.isActive);
    });

    this.eventBus.on([DomainEventBus.eventNames.Created, DomainEventBus.eventNames.Removed], () =>
      this.countQuery.invalidate(),
    );
  }

  public readonly createNewMemo = async (value: string) => {
    const newMemo = await this.remote.memo.create.mutate({ body: value });
    this.eventBus.emit(DomainEventBus.eventNames.Created, newMemo);
    this.childrenQuery.refetch();
  };

  @observable private accessor isActive = false;

  public readonly filter = new Filter();

  private readonly eventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  private readonly countQuery;

  public readonly childrenQuery;

  @computed
  public get count() {
    return this.countQuery.result.data;
  }

  private getNextPageParams(params?: { lastPage: MemoVO[]; lastPageParam: { limit?: number; isPinned?: boolean } }):
    | {
        isPinned?: boolean;
        limit?: number;
        endId?: string;
        startId?: string;
      }
    | undefined {
    const pageLimit = 20;

    // 第一次请求
    if (!params) {
      return {
        isPinned: this.filter.isEmpty ? true : undefined,
        limit: pageLimit,
      };
    }

    const { lastPage, lastPageParam } = params;

    if (!lastPageParam.limit) {
      return;
    }

    if (lastPage.length < lastPageParam.limit) {
      // pinned + 非 pinned，补足 limit 个
      if (lastPageParam.isPinned) {
        return {
          isPinned: false,
          limit: pageLimit - lastPage.length,
        };
      }
      return;
    }

    const lastOne = lastPage.at(-1);

    if (lastOne) {
      const params = {
        limit: pageLimit,
        isPinned: lastPageParam.isPinned,
      };

      if (this.filter?.order === 'asc') {
        return { ...params, startId: lastOne.id };
      } else {
        return { ...params, endId: lastOne.id };
      }
    }
  }

  @action
  public activate() {
    this.isActive = true;
  }

  @action
  public deactivate() {
    this.isActive = false;
  }
}
