import { createInfiniteQuery, createQuery } from 'mobx-tanstack-query/preset';

import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import DomainEventBus from '../EventBus';
import Filter from './Filter';
import TopicList from '../../TopicList';
import { EntityTypes } from '#domain/shared/model/entity';
import { computed } from 'mobx';
import { first, last } from 'lodash-es';
import type { MemoVO } from '#domain/shared/model/memo';
import assert from 'assert';
import Editor from '../Editor';

export default class MemoList {
  constructor() {
    this.countQuery = createQuery(
      ({ signal }) => this.remote.memo.queryCount.query(this.filter!.countParams, { signal }),
      {
        abortSignal: this.destroyController.signal,
        options: () => ({
          enabled: !this.isSearchMode,
          queryKey: ['memos', 'count', this.filter.countParams],
        }),
      },
    );

    this.childrenQuery = createInfiniteQuery(
      ({ signal, pageParam: { endId, startId, ...params } }) =>
        this.remote.memo.queryList.query(
          {
            ...params,
            ...this.filter.params,
            endId,
            startId,
            startTime: startId ? undefined : this.filter.params.startTime,
            endTime: endId ? undefined : this.filter.params.endTime,
          },
          { signal },
        ),
      {
        refetchOnWindowFocus: false,
        abortSignal: this.destroyController.signal,
        getNextPageParam: (lastPage, _, lastPageParam) => this.getNextPageParams({ lastPage, lastPageParam }),
        onDone: (data) => {
          const lastPage = last(data.pages);
          if (lastPage && this.pageLimit && lastPage.length < this.pageLimit && last(data.pageParams)?.isPinned) {
            this.childrenQuery?.fetchNextPage();
          }
        },
        options: () => ({
          initialPageParam: this.getNextPageParams(),
          queryKey: ['memos', this.filter.params],
        }),
      },
    );

    this.eventBus.on(
      [DomainEventBus.eventNames.Created, DomainEventBus.eventNames.Removed],
      () => this.countQuery!.invalidate(),
      { signal: this.destroyController.signal },
    );

    this.eventBus.on(
      [DomainEventBus.eventNames.Created, DomainEventBus.eventNames.Updated, DomainEventBus.eventNames.Removed],
      () => this.topicList.topicQuery.invalidate(),
    );
  }

  public newEditor = new Editor({
    onSubmit: async (value) => {
      const newMemo = await this.remote.memo.create.mutate({ body: value });
      this.eventBus.emit(DomainEventBus.eventNames.Created, newMemo);
      this.childrenQuery?.invalidate();

      return 'reset';
    },
  });

  @computed
  private get isSearchMode() {
    return Boolean(this.filter.keyword);
  }

  public readonly topicList = new TopicList(EntityTypes.Memo);

  public readonly filter = new Filter({ topicList: this.topicList });

  private readonly eventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  private readonly countQuery;

  public readonly childrenQuery;

  @computed
  public get count() {
    return this.isSearchMode ? first(this.childrenQuery.result.data?.pages)?.length : this.countQuery.result.data;
  }

  private get pageLimit() {
    return this.isSearchMode ? undefined : 30;
  }

  private getNextPageParams(params?: { lastPage: MemoVO[]; lastPageParam: { limit?: number; isPinned?: boolean } }):
    | {
        isPinned?: boolean;
        endId?: string;
        startId?: string;
        limit?: number;
      }
    | undefined {
    if (!params) {
      return {
        isPinned: this.isSearchMode ? undefined : true,
        limit: this.pageLimit,
      };
    }

    const { lastPage, lastPageParam } = params;

    if (!this.pageLimit || !lastPageParam.limit) {
      return;
    }

    if (lastPage.length < lastPageParam.limit) {
      if (lastPageParam.isPinned) {
        return {
          isPinned: false,
          limit: this.pageLimit - lastPage.length,
        };
      }
      return;
    }

    const lastOne = last(lastPage);

    if (lastOne) {
      const params = {
        isPinned: lastOne.isPinned,
        limit: this.pageLimit,
      };

      if (this.filter?.sortOptions.order === 'asc') {
        return { ...params, startId: lastOne.id };
      } else {
        return { ...params, endId: lastOne.id };
      }
    }
  }
  private destroyController = new AbortController();

  public reload() {
    assert(this.childrenQuery, 'can not reload');
    this.childrenQuery.refetch();
  }

  public destroy() {
    this.destroyController.abort();
  }
}
