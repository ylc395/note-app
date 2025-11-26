import { action, autorun, computed, observable } from 'mobx';
import { createInfiniteQuery, createQuery } from 'mobx-tanstack-query/preset';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { MemoVO } from '#domain/shared/model/memo';

import DomainEventBus from '../EventBus';
import Filter from './Filter';
import Editor from '../Editor';

export default class MemoList {
  constructor() {
    this.countQuery = createQuery(({ signal }) => this.remote.memo.queryCount.query({ parentId: null }, { signal }), {
      options: () => ({
        enabled: this.filter.isEmpty && this.isActive,
        queryKey: ['memos', 'count'] as const,
      }),
    });

    this.childrenQuery = createInfiniteQuery(
      ({ signal, pageParam, queryKey: [_, params] }): Promise<MemoVO[]> =>
        this.remote.memo.queryList.query({ ...pageParam, ...params }, { signal }),
      {
        getNextPageParam: (lastPage, _, lastPageParam) =>
          this.getNextPageParams({ lastPage, lastPageParam: lastPageParam! }),
        select: (data) => ({
          ...data,
          pages: this.handleFetchedData(data.pages),
        }),
        initialPageParam: this.getNextPageParams(),
        options: () => ({
          enabled: false,
          queryKey: ['memos', this.filter.params] as const,
        }),
      },
    );

    this.init();
  }

  private init() {
    autorun(() => {
      this.filter.timeSelector.setActive(this.isActive);
    });

    this.eventBus.on([DomainEventBus.eventNames.Created, DomainEventBus.eventNames.Removed], () =>
      this.countQuery!.invalidate(),
    );
  }

  public readonly newEditor = new Editor({
    onSubmit: async (value) => {
      const newMemo = await this.remote.memo.create.mutate({ body: value });
      this.eventBus.emit(DomainEventBus.eventNames.Created, newMemo);
      this.childrenQuery.refetch();

      return 'reset';
    },
  });

  private handleFetchedData(pages: MemoVO[][]) {
    if (this.filter.isEmpty) {
      return pages;
    }

    // 对于过滤模式，pinned 排序需要在前端进行
    return pages.map((page) => {
      return page.toSorted((memo1, memo2) => Number(memo2.isPinned) - Number(memo1.isPinned));
    });
  }

  @observable private accessor isActive = false;

  @observable public accessor focusedId: MemoVO['id'] | undefined;

  public readonly filter = new Filter();

  private readonly eventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  private readonly countQuery;

  public readonly childrenQuery;

  @computed
  public get count() {
    return !this.filter.isEmpty ? this.childrenQuery.result.data?.pages[0]?.length : this.countQuery.result.data;
  }

  private getNextPageParams(params?: { lastPage: MemoVO[]; lastPageParam: { limit?: number; isPinned?: boolean } }):
    | {
        isPinned?: boolean;
        limit?: number;
        endId?: string;
        startId?: string;
      }
    | undefined {
    const pageLimit = this.filter.isEmpty ? 20 : undefined;

    // 第一次请求
    if (!params) {
      return {
        isPinned: this.filter.isEmpty ? true : undefined,
        limit: pageLimit,
      };
    }

    const { lastPage, lastPageParam } = params;

    if (!pageLimit || !lastPageParam.limit) {
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
        isPinned: lastOne.isPinned,
        limit: pageLimit,
      };

      if (this.filter?.order === 'asc') {
        return { ...params, startId: lastOne.id };
      } else {
        return { ...params, endId: lastOne.id };
      }
    }
  }

  @action
  public setActive(value: boolean) {
    this.isActive = value;
  }

  @action
  public setFocusId(id: MemoVO['id'] | undefined) {
    this.focusedId = id;
  }
}
