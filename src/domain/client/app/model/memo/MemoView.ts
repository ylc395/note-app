import { createInfiniteQuery } from 'mobx-tanstack-query/preset';
import { last } from 'lodash-es';
import { action, computed, observable, reaction } from 'mobx';
import assert from 'assert';
import { z } from 'zod';

import { container } from '#domain/shared/infra/singletons';
import HierarchyEntity from '#domain/client/shared/model/abstract/HierarchyEntity';
import type { ClientMemoQuery, MemoVO } from '#domain/shared/model/memo';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import DomainEventBus from './EventBus';
import Editor from './Editor';
import UIState from '../common/UIState';
import Calendar from './Calendar';

export default class MemoView extends HierarchyEntity<MemoVO> {
  constructor(options?: { value: MemoVO; parent: MemoView }) {
    super();
    this.setValue(options?.value);
    this.parent = options?.parent;

    if (this.isRoot) {
      this.newEditor = this.createNewEditor();
      this.calendar = container.resolve(Calendar);
    }

    if (!this.isParent && !this.isRoot) {
      return;
    }

    this.uiState = new UIState(
      `memo-view-${this.id}`,
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

    reaction(
      () => this.childrenQuery?.result.data,
      (data) => data && this.setChildren(data.pages.flat()),
      { fireImmediately: true, signal: this.destroyController.signal },
    );
  }

  private readonly parent?: MemoView;

  @observable.shallow protected override accessor childrenMap: Record<string, MemoView> | undefined = undefined;

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
  protected override setValue(memo?: MemoVO) {
    super.setValue(memo);

    if (this.isRoot) {
      this.isExpand = true;
    }
  }

  @computed
  public get children() {
    if (!this.childrenMap) {
      return [];
    }

    return Object.values(this.childrenMap).sort(({ value: memo1 }, { value: memo2 }) => {
      const result = Number(memo2!.isPinned) - Number(memo1!.isPinned) || memo2!.createdAt - memo1!.createdAt;

      return this.sortOptions.order === 'desc' ? result : -result;
    });
  }

  @action
  protected override setChildren(pages: MemoVO[]) {
    super.setChildren(pages, (memo) => new MemoView({ value: memo, parent: this }));
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

  private get isParent() {
    return !this.isRoot && !this.value?.parentId;
  }

  private get isRoot() {
    return !this.value;
  }

  @action
  public toggleExpand() {
    assert(this.isParent, 'can not expand a child memo');

    this.isExpand = !this.isExpand;

    if (this.isExpand) {
      this.newEditor = this.createNewEditor();
    } else {
      this.newEditor?.destroy();
      this.newEditor = undefined;
    }
  }

  private createNewEditor() {
    return new Editor({
      onSubmit: async (value) => {
        const newMemo = await this.remote.memo.create.mutate({ parentId: this.value?.id, body: value });
        this.childrenMap![newMemo.id] = new MemoView({ value: newMemo, parent: this });
        this.domainEventBus.emit(DomainEventBus.eventNames.Created, newMemo);

        return true;
      },
      onDestroyed: action(() => {
        this.newEditor = this.createNewEditor();
      }),
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
  public override destroy() {
    super.destroy();
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
