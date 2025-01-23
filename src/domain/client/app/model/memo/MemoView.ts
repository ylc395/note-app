import { createInfiniteQuery } from 'mobx-tanstack-query/preset';
import { last } from 'lodash-es';
import { action, computed, observable } from 'mobx';
import assert from 'assert';
import { z } from 'zod';

import { container } from '#domain/shared/infra/singletons';
import type { ClientMemoQuery, MemoVO } from '#domain/shared/model/memo';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import DomainEventBus from './EventBus';
import Editor from './Editor';
import UIState from '../common/UIState';
import Calendar from './TimeSelector';

export default class MemoView {
  constructor(options?: { value: MemoVO; parent: MemoView }) {
    this.setValue(options?.value);
    this.parent = options?.parent;

    if (this.isRoot) {
      this.initNewEditor();
      this.calendar = container.resolve(Calendar);
    }

    if (!this.isParent && !this.isRoot) {
      return;
    }

    this.uiState = new UIState(
      `memo-view-${this.value?.id ?? 'root'}`,
      z.object({
        lastId: z.string(),
        top: z.object({ id: z.string(), offset: z.number() }),
      }),
    );

    this.childrenQuery = createInfiniteQuery(
      ({ signal, pageParam: { endId, startId, ...params } }) =>
        this.remote.memo.queryList.query(
          {
            ...params,
            parentId: this.value?.id,
            endId,
            startId,
            startTime: startId ? undefined : this.calendar?.selectedDuration?.startTime,
            endTime: endId ? undefined : this.calendar?.selectedDuration?.endTime,
            ...this.sortOptions,
          },
          { signal },
        ),
      {
        // 无限加载的列表就别 stale 了
        staleTime: Infinity,
        abortSignal: this.destroyController.signal,
        initialPageParam: this.getNextPageParams(),
        getNextPageParam: (lastPage, _, lastPageParam) => this.getNextPageParams({ lastPage, lastPageParam }),
        onDone: (data) => {
          const lastPage = last(data.pages);
          if (lastPage && lastPage.length < MemoView.PAGE_MAX_LENGTH && last(data.pageParams)?.isPinned) {
            this.loadMore();
          }
        },
        options: () => ({
          queryKey: [
            'memos',
            {
              ...this.sortOptions,
              parentId: options?.value.id,
              startTime: this.calendar?.selectedDuration?.startTime,
              endTime: this.calendar?.selectedDuration?.endTime,
            },
          ],
          enabled: this.isExpand,
        }),
      },
    );
  }

  private readonly parent?: MemoView;

  @observable public accessor value: MemoVO | undefined;

  private readonly domainEventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  private readonly childrenQuery;

  private readonly destroyController = new AbortController();

  public readonly uiState;

  @observable.ref public accessor selfEditor: Editor | undefined; // 用于编辑自己的 editor

  @observable.ref public accessor newEditor: Editor | undefined; // 用于创建新的子 memo 的 editor

  @observable public accessor isExpand = false;

  @observable.ref public accessor sortOptions: Readonly<Pick<ClientMemoQuery, 'order' | 'orderBy'>> = {
    orderBy: 'createdAt',
    order: 'desc',
  };

  private readonly calendar?: Calendar;

  @action
  private setValue(memo?: MemoVO | ((oldValue: MemoVO | undefined) => MemoVO | undefined)) {
    const newValue = typeof memo === 'function' ? memo(this.value) : memo;
    this.value = newValue;

    if (this.isRoot) {
      this.isExpand = true;
    }
  }

  @computed
  public get children() {
    return this.childrenQuery?.result.data?.pages.flat();
  }

  @computed
  public get canLoadMore() {
    return Boolean(this.childrenQuery?.result.hasNextPage);
  }

  @computed
  public get isLoading() {
    return Boolean(this.childrenQuery?.result.isLoading);
  }

  public get timeParams() {
    return this.calendar?.selectedDuration;
  }

  public async loadMore() {
    await this.childrenQuery?.fetchNextPage();
  }

  public get isParent() {
    return !this.isRoot && !this.value?.parentId;
  }

  public get isRoot() {
    return !this.value;
  }

  @action
  public toggleExpand() {
    assert(this.isParent, 'can not expand a child memo');

    this.isExpand = !this.isExpand;

    if (this.isExpand) {
      this.initNewEditor();
    } else {
      this.newEditor?.destroy();
      this.newEditor = undefined;
    }
  }

  @action
  private initNewEditor() {
    this.newEditor = new Editor({
      onSubmit: async (value) => {
        const newMemo = await this.remote.memo.create.mutate({ parentId: this.value?.id, body: value });
        this.childrenQuery?.invalidate();
        this.domainEventBus.emit(DomainEventBus.eventNames.Created, newMemo);
        this.value!.childrenCount += 1;

        return true;
      },
      onDestroyed: this.initNewEditor.bind(this),
    });
  }

  @action
  public startEditing() {
    const memo = this.value;
    assert(memo, 'can not edit');
    assert(!this.selfEditor, 'editing!');

    this.selfEditor = new Editor({
      initialValue: memo.body,
      onSubmit: async (value: string) => {
        await this.remote.memo.updateOne.mutate([memo.id, { body: value }]);
        this.setValue({ ...memo, body: value });

        return true;
      },
      onDestroyed: action(() => {
        this.selfEditor = undefined;
      }),
    });
  }

  public async togglePin() {
    assert(this.value && this.parent?.childrenQuery, 'can not pin root');

    await this.remote.memo.updateOne.mutate([this.value.id, { isPinned: !this.value.isPinned }]);
    this.parent.childrenQuery.invalidate();
  }

  @action
  public destroy() {
    this.selfEditor?.destroy();
    this.newEditor?.destroy();
    this.destroyController.abort();
  }

  public reload() {
    assert(this.childrenQuery, 'can not reload');
    this.childrenQuery.refetch();
  }

  @action
  public setOrder(value: MemoView['sortOptions']) {
    this.sortOptions = value;
  }

  private static readonly PAGE_MAX_LENGTH = 30;

  private getNextPageParams(params?: { lastPage: MemoVO[]; lastPageParam: { limit: number; isPinned: boolean } }):
    | {
        isPinned: boolean;
        endId?: string;
        startId?: string;
        limit: number;
      }
    | undefined {
    if (!params) {
      return {
        isPinned: true,
        limit: MemoView.PAGE_MAX_LENGTH,
      };
    }

    const { lastPage, lastPageParam } = params;

    if (lastPage.length < lastPageParam.limit) {
      if (lastPageParam.isPinned) {
        return {
          isPinned: false,
          limit: MemoView.PAGE_MAX_LENGTH - lastPage.length,
        };
      }
      return;
    }

    const lastOne = last(lastPage);

    if (lastOne) {
      const params = {
        isPinned: lastOne.isPinned,
        limit: MemoView.PAGE_MAX_LENGTH,
      };

      if (this.sortOptions.order === 'desc') {
        return { ...params, endId: lastOne.id };
      } else {
        return { ...params, startId: lastOne.id };
      }
    }
  }
}
