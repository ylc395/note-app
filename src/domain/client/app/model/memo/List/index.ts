import { action, autorun, computed, observable, reaction } from 'mobx';
import assert from 'assert';
import { createInfiniteQuery, createQuery } from 'mobx-tanstack-query/preset';

import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { MemoVO } from '#domain/shared/model/memo';

import DomainEventBus from '../EventBus';
import Filter from './Filter';
import Editor from '../Editor';
import type { MemoItem } from './item';

export default class MemoList {
  constructor() {
    this.countQuery = createQuery(
      ({ signal }) => this.remote.memo.queryCount.query(this.filter!.countParams, { signal }),
      {
        abortSignal: this.destroyController.signal,
        refetchOnWindowFocus: false,
        options: () => ({
          enabled: !this.isSearchMode && this.isActive,
          queryKey: ['memos', 'count', this.filter.countParams],
        }),
      },
    );

    this.childrenQuery = createInfiniteQuery(
      ({ signal, pageParam: { endId, startId, ...params } }): Promise<MemoItem[]> =>
        this.remote.memo.queryList.query(
          {
            ...params,
            ...this.filter.params,
            endId,
            startId,
            durations: this.filter.params.durations,
          },
          { signal },
        ),
      {
        refetchOnWindowFocus: false,
        abortSignal: this.destroyController.signal,
        getNextPageParam: (lastPage, _, lastPageParam) => this.getNextPageParams({ lastPage, lastPageParam }),
        onDone: (data) => {
          const lastPage = data.pages.at(-1);
          if (lastPage && this.pageLimit && lastPage.length < this.pageLimit && data.pageParams.at(-1)?.isPinned) {
            this.childrenQuery?.fetchNextPage();
          }
        },
        select: (data) => ({
          ...data,
          pages: this.handleFetchedData(data.pages),
        }),
        options: () => ({
          enabled: this.isActive,
          initialPageParam: this.getNextPageParams(),
          queryKey: ['memos', this.filter.params],
        }),
      },
    );

    this.init();
  }

  private init() {
    reaction(
      () => this.filter.params,
      () => this.justCreatedMemos.clear(),
      { signal: this.destroyController.signal },
    );

    autorun(
      () => {
        this.filter.setActive(this.isActive);
      },
      { signal: this.destroyController.signal },
    );

    this.eventBus.on(
      [DomainEventBus.eventNames.Created, DomainEventBus.eventNames.Removed],
      () => this.countQuery!.invalidate(),
      { signal: this.destroyController.signal },
    );
  }

  public readonly newEditor = new Editor({
    onSubmit: async (value) => {
      const newMemo = await this.remote.memo.create.mutate({ body: value });
      this.eventBus.emit(DomainEventBus.eventNames.Created, newMemo);
      this.childrenQuery?.invalidate().then(this.addNewItem.bind(this, newMemo));

      return 'reset';
    },
  });

  private readonly justCreatedMemos = new Set<MemoVO['id']>();

  private handleFetchedData(pages: MemoItem[][]) {
    if (!this.isSearchMode && this.justCreatedMemos.size === 0) {
      return pages;
    }

    return pages.map((page) => {
      // 新创建的 memos 已经在特定的地方单独存在了（见 addNewItem 方法），这里不要再存在
      if (this.justCreatedMemos.size > 0) {
        page = page.filter(({ id }) => !this.justCreatedMemos.has(id));
      }

      // 对于关键字搜索模式，pinned 排序需要在前端进行
      if (this.isSearchMode) {
        return page.toSorted((memo1, memo2) => Number(memo2.isPinned) - Number(memo1.isPinned));
      }

      return page;
    });
  }

  @action
  private addNewItem(newItem: MemoVO) {
    if (!this.childrenQuery.result.data) {
      return;
    }

    this.childrenQuery.setData((data) => {
      if (!data) {
        return data;
      }

      let index: { page: number; item: number } | undefined;

      // 理论上可以不用遍历列表的全部位置，只看 4 个位置（pinned 区的开头结尾、非 pinned 区的开头结尾）即可。但代码写起来太麻烦了
      outer: for (let i = 0; i < data.pages.length; i++) {
        const page = data.pages[i]!;
        for (let j = 0; j < page.length; j++) {
          const item = page[j]!;

          if (item.id === newItem.id) {
            index = { page: i, item: j };
            break outer;
          }
        }
      }

      if (!index) {
        const [firstPage = [], ...pages] = data.pages;
        return { ...data, pages: [[{ ...newItem, justCreated: 'omit' }, ...firstPage], ...pages] };
      }

      return {
        ...data,
        pages: data.pages.with(
          index.page,
          data.pages[index.page]!.toSpliced(index.item, 1, { ...newItem, justCreated: 'keep' }),
        ),
      };
    });
  }

  @computed
  private get isSearchMode() {
    return Boolean(this.filter.keyword);
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
    return this.isSearchMode ? this.childrenQuery.result.data?.pages[0]?.length : this.countQuery.result.data;
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

    const lastOne = lastPage.at(-1);

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

  @action
  public setActive(value: boolean) {
    this.isActive = value;
  }

  @action
  public setFocusId(id: MemoVO['id'] | undefined) {
    this.focusedId = id;
  }

  public reload() {
    assert(this.childrenQuery, 'can not reload');
    this.childrenQuery.refetch();
  }

  public destroy() {
    this.destroyController.abort();
  }
}
