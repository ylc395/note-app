import { createInfiniteQuery } from 'mobx-tanstack-query/preset';
import { last } from 'lodash-es';
import { action, computed, observable, reaction } from 'mobx';
import assert from 'assert';
import { z } from 'zod';

import { container } from '#domain/shared/infra/singletons';
import HierarchyEntity from '#domain/client/shared/model/abstract/HierarchyEntity';
import type { MemoVO } from '#domain/shared/model/memo';
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

    if (!this.isParent && !this.isRoot) {
      return;
    }

    if (this.isRoot) {
      this.newEditor = this.createNewEditor();
      this.calendar = container.resolve(Calendar);
    }

    this.uiState = new UIState(
      `memo-view-${this.id}`,
      z.object({
        lastId: z.string(),
        top: z.object({ id: z.string(), offset: z.number() }),
      }),
    );

    this.childrenQuery = createInfiniteQuery(
      ({ signal, pageParam: { endId, isPinned, limit } }) =>
        this.remote.memo.queryList.query(
          {
            parentId: this.value?.id,
            limit,
            endId,
            isPinned,
            order: 'desc',
            startTime: this.calendar?.selectedDuration?.startTime,
            endTime: endId ? undefined : this.calendar?.selectedDuration?.endTime,
          },
          { signal },
        ),
      {
        // 无限加载的列表就别 stale 了
        staleTime: Infinity,
        abortSignal: this.destroyController.signal,
        initialPageParam: {
          endId: undefined as MemoVO['id'] | undefined,
          isPinned: true,
          limit: MemoView.PAGE_MAX_LENGTH,
        },
        getNextPageParam: (lastPage, _, lastPageParam) => MemoView.getNextPageParams(lastPage, lastPageParam),
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
      return Number(memo2!.isPinned) - Number(memo1!.isPinned) || memo2!.createdAt - memo1!.createdAt;
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
    assert(!this.newEditor, 'can not create again');

    return new Editor({
      onSubmit: async (value) => {
        const newMemo = await this.remote.memo.create.mutate({ parentId: this.value?.id, body: value });
        this.childrenMap![newMemo.id] = new MemoView({ value: newMemo, parent: this });
        this.domainEventBus.emit(DomainEventBus.eventNames.Created, newMemo);
        this.newEditor?.reset();
      },
      onDestroyed: action(() => {
        this.newEditor = undefined;
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

  private static readonly PAGE_MAX_LENGTH = 30;

  private static getNextPageParams(lastPage: MemoVO[], lastPageParam: { limit: number; isPinned: boolean }) {
    if (lastPage.length < lastPageParam.limit) {
      if (lastPageParam.isPinned) {
        return {
          isPinned: false,
          endId: undefined,
          limit: MemoView.PAGE_MAX_LENGTH - lastPage.length,
        };
      }
      return;
    }

    const lastOne = last(lastPage);

    if (lastOne) {
      return {
        endId: lastOne.id,
        isPinned: lastOne.isPinned,
        limit: MemoView.PAGE_MAX_LENGTH,
      };
    }
  }
}
