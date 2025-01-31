import { createInfiniteQuery, createQuery } from 'mobx-tanstack-query/preset';
import { last, pick } from 'lodash-es';
import { action, computed, observable, toJS } from 'mobx';
import assert from 'assert';

import { container } from '#domain/shared/infra/singletons';
import type { ClientMemoQuery, MemoVO } from '#domain/shared/model/memo';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import Editor from './Editor';
import RevisionList from '../RevisionList';
import DomainEventBus from './EventBus';
import type TimeSelector from './TimeSelector';
import type TopicList from '../TopicList';

export default class MemoView {
  constructor(options: {
    memoId?: MemoVO['id'];
    value?: MemoVO;
    parent?: MemoView;
    timeSelector?: TimeSelector;
    topicList?: TopicList;
  }) {
    this.setValue(options.value);
    this.parent = options.parent;
    this.timeSelector = options.timeSelector;
    this.topicList = options.topicList;

    if (options.memoId) {
      this.valueQuery = createQuery(({ signal }) => this.remote.memo.queryOne.query(options.memoId!, { signal }), {
        abortSignal: this.destroyController.signal,
        queryKey: ['memo', options.memoId],
      });
    }

    if (this.isRoot) {
      this.initNewEditor();

      this.eventBus.on(
        [DomainEventBus.eventNames.Created, DomainEventBus.eventNames.Removed],
        () => this.countQuery!.invalidate(),
        { signal: this.destroyController.signal },
      );

      this.countQuery = createQuery(({ signal }) => this.remote.memo.queryCount.query(this.countParams, { signal }), {
        abortSignal: this.destroyController.signal,
        options: () => ({
          queryKey: ['memos', 'count', this.countParams],
        }),
      });
    }

    if (this.isParent || this.isRoot || this.valueQuery) {
      this.childrenQuery = createInfiniteQuery(
        ({ signal, pageParam: { endId, startId, ...params } }) =>
          this.remote.memo.queryList.query(
            {
              ...params,
              ...this.params,
              endId,
              startId,
              startTime: startId ? undefined : this.timeSelector?.selectedDuration?.startTime,
              endTime: endId ? undefined : this.timeSelector?.selectedDuration?.endTime,
            },
            { signal },
          ),
        {
          refetchOnWindowFocus: false,
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
            queryKey: ['memos', this.params],
            enabled: this.isRoot || this.visiblePanel === 'followup',
          }),
        },
      );
    }

    if (this.value || this.valueQuery) {
      this.referrersQuery = createQuery(
        ({ signal }) => this.remote.memo.queryReferrers.query(this.value!.id, { signal }),
        {
          queryKey: ['memos', 'referrers', options.value?.id ?? options.memoId],
          abortSignal: this.destroyController.signal,
          options: () => ({
            enabled:
              this.visiblePanel === 'referrers' &&
              ((this.value && this.value.referrersCount > 0) ||
                (this.valueQuery?.result.data && this.valueQuery.result.data.referrersCount > 0)),
          }),
        },
      );

      this.eventBus.on(
        [DomainEventBus.eventNames.Created, DomainEventBus.eventNames.Removed, DomainEventBus.eventNames.Updated],
        () => this.referrersQuery?.invalidate(),
        { signal: this.destroyController.signal },
      );
    }
  }

  private readonly parent?: MemoView;

  @observable public accessor value: MemoVO | undefined;

  public readonly valueQuery;

  @computed
  public get params() {
    return {
      ...this.sortOptions,
      ...this.timeSelector?.selectedDuration,
      tags: toJS(this.topicList?.selectedTopics),
      parentId: this.value?.id,
    };
  }

  @computed
  private get countParams() {
    return pick(this.params, ['startTime', 'endTime', 'tags']);
  }

  private readonly eventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  public readonly childrenQuery;

  public readonly countQuery;

  public readonly referrersQuery;

  private readonly destroyController = new AbortController();

  @observable.ref public accessor revisionList: RevisionList | undefined;

  @observable.ref public accessor selfEditor: Editor | undefined; // 用于编辑自己的 editor

  @observable.ref public accessor newEditor: Editor | undefined; // 用于创建新的子 memo 的 editor

  @observable public accessor visiblePanel: 'followup' | 'referrers' | undefined;

  @observable.ref public accessor sortOptions: Readonly<Pick<ClientMemoQuery, 'order' | 'orderBy'>> = {
    orderBy: 'createdAt',
    order: 'desc',
  };

  private readonly timeSelector?: TimeSelector; // root 才有

  private readonly topicList?: TopicList; // root 才有

  @action
  public setValue(memo?: MemoVO | ((oldValue: MemoVO | undefined) => MemoVO | undefined)) {
    const newValue = typeof memo === 'function' ? memo(this.value) : memo;
    this.value = newValue;
  }

  public async loadMore() {
    await this.childrenQuery?.fetchNextPage();
  }

  @computed
  public get isParent() {
    if (this.valueQuery) {
      return Boolean(this.valueQuery.result.data && !this.valueQuery.result.data.parentId);
    }

    return !this.isRoot && !this.value?.parentId;
  }

  public get isRoot() {
    return !this.value && !this.valueQuery;
  }

  @action
  public toggleFollowup() {
    assert(this.isParent, 'can not expand a child memo');
    this.visiblePanel = this.visiblePanel === 'followup' ? undefined : 'followup';

    if (this.visiblePanel === 'followup') {
      this.initNewEditor();
    } else {
      this.newEditor?.destroy();
      this.newEditor = undefined;
    }
  }

  @action
  public toggleReferrers() {
    assert(!this.isRoot, 'can not toggleReferrers');
    this.visiblePanel = this.visiblePanel === 'referrers' ? undefined : 'referrers';
  }

  @action
  private initNewEditor() {
    this.newEditor = new Editor({
      onSubmit: async (value) => {
        const newMemo = await this.remote.memo.create.mutate({ parentId: this.value?.id, body: value });
        this.eventBus.emit(DomainEventBus.eventNames.Created, newMemo);
        this.childrenQuery?.invalidate();

        if (this.value) {
          this.value.followupsCount += 1;
        }

        return 'reset';
      },
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

        this.parent?.childrenQuery?.invalidate();
        this.revisionList?.data.invalidate();
        this.setValue({ ...memo, body: value });
        this.eventBus.emit(DomainEventBus.eventNames.Updated, this.value!);

        return 'destroy';
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

  @action
  public toggleRevisionList() {
    if (this.revisionList) {
      this.revisionList.destroy();
      this.revisionList = undefined;
    } else {
      assert(this.value, 'no value');
      this.revisionList = new RevisionList(this.value.id, this.destroyController.signal);
    }
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
