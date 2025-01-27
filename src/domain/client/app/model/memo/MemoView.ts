import { createInfiniteQuery, createQuery } from 'mobx-tanstack-query/preset';
import { last } from 'lodash-es';
import { action, observable } from 'mobx';
import assert from 'assert';

import { container } from '#domain/shared/infra/singletons';
import type { ClientMemoQuery, MemoVO } from '#domain/shared/model/memo';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import Editor from './Editor';
import TimeSelector from './TimeSelector';
import RevisionList from '../RevisionList';
import DomainEventBus from './EventBus';

export default class MemoView {
  constructor(options?: { value: MemoVO; parent: MemoView }) {
    this.setValue(options?.value);
    this.parent = options?.parent;

    if (this.isRoot) {
      this.initNewEditor();
      this.timeSelector = container.resolve(TimeSelector);
    }

    if (this.isParent || this.isRoot) {
      this.childrenQuery = createInfiniteQuery(
        ({ signal, pageParam: { endId, startId, ...params } }) =>
          this.remote.memo.queryList.query(
            {
              ...params,
              parentId: this.value?.id,
              endId,
              startId,
              startTime: startId ? undefined : this.timeSelector?.selectedDuration?.startTime,
              endTime: endId ? undefined : this.timeSelector?.selectedDuration?.endTime,
              ...this.sortOptions,
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
            queryKey: [
              'memos',
              {
                ...this.sortOptions,
                parentId: options?.value.id,
                startTime: this.timeSelector?.selectedDuration?.startTime,
                endTime: this.timeSelector?.selectedDuration?.endTime,
              },
            ],
            enabled: this.isRoot || this.visiblePanel === 'followup',
          }),
        },
      );
    }

    if (this.value) {
      this.referrersQuery = createQuery(
        ({ signal }) => this.remote.memo.queryReferrers.query(this.value!.id, { signal }),
        {
          queryKey: ['memos', 'referrers', this.value.id],
          options: () => ({
            enabled: this.visiblePanel === 'referrers' && this.value!.referrersCount > 0,
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

  private readonly eventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  public readonly childrenQuery;

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

  private readonly timeSelector?: TimeSelector;

  @action
  public setValue(memo?: MemoVO | ((oldValue: MemoVO | undefined) => MemoVO | undefined)) {
    const newValue = typeof memo === 'function' ? memo(this.value) : memo;
    this.value = newValue;
  }

  public get timeParams() {
    return this.timeSelector?.selectedDuration;
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
  public toggleFollowup() {
    assert(this.isParent, 'can not expand a child memo');
    this.visiblePanel = this.visiblePanel === 'followup' ? undefined : 'followup';

    if (this.visiblePanel) {
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

        if (this.isParent || this.timeSelector?.isBetweenSelectedDuration(newMemo.createdAt)) {
          this.childrenQuery?.invalidate();
        }

        if (this.timeSelector?.isRecent(newMemo.createdAt)) {
          this.timeSelector.recentCounts.invalidate();
        }

        if (this.value) {
          this.value.followupsCount += 1;
        }

        if (this.isRoot) {
          this.timeSelector?.edgeTime.invalidate();
          this.timeSelector?.count.invalidate();
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
