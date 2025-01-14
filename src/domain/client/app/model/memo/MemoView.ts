import { createInfiniteQuery } from 'mobx-tanstack-query/preset';
import { last } from 'lodash-es';
import { action, computed, observable, reaction } from 'mobx';
import assert from 'assert';

import { container } from '#domain/shared/infra/singletons';
import HierarchyEntity from '#domain/client/shared/model/abstract/HierarchyEntity';
import type { MemoVO } from '#domain/shared/model/memo';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import DomainEventBus from './EventBus';
import Editor from './Editor';

export default class MemoView extends HierarchyEntity<MemoVO> {
  constructor(value?: MemoVO) {
    super();
    this.setValue(value);

    if (!this.isParent && !this.isRoot) {
      return;
    }

    const LIMIT = 30;
    this.childrenQuery = createInfiniteQuery(
      ({ signal, pageParam }) =>
        this.remote.memo.queryList.query(
          { parentId: this.value?.id, limit: LIMIT, ...pageParam, order: 'desc' },
          { signal },
        ),
      {
        queryKey: ['memos', { parentId: value?.id }],
        // 无限加载的列表就别 stale 了
        staleTime: Infinity,
        abortSignal: this.destroyController.signal,
        initialPageParam: {
          endTime: undefined as number | undefined,
          endId: undefined as MemoVO['id'] | undefined,
        },
        getNextPageParam: (lastPage) => {
          const lastOne = last(lastPage);

          if (lastPage.length < LIMIT || !lastOne) {
            return;
          }

          return {
            endTime: lastOne.createdAt,
            endId: lastOne.id,
          };
        },
        options: () => ({
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

  private readonly domainEventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  private readonly childrenQuery;

  private readonly destroyController = new AbortController();

  @observable.ref public accessor selfEditor: Editor | undefined; // 用于编辑自己的 editor

  @observable.ref public accessor newEditor = this.isRoot ? this.createNewEditor() : undefined; // 用于创建新的子 memo 的 editor

  @observable public accessor isExpand = false;

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

    return Object.values(this.childrenMap).sort(
      ({ value: memo1 }, { value: memo2 }) => memo2!.createdAt - memo1!.createdAt,
    ) as MemoView[];
  }

  @action
  protected override setChildren(pages: MemoVO[]) {
    super.setChildren(pages, (memo) => new MemoView(memo));
  }

  @computed
  public get canLoadMore() {
    return this.childrenQuery && (!this.childrenQuery?.result || this.childrenQuery.result.hasNextPage);
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
    }
  }

  private createNewEditor() {
    return new Editor({
      onDestroyed: action(() => {
        this.newEditor = undefined;
      }),
      onSubmit: async (value) => {
        const newMemo = await this.remote.memo.create.mutate({ parentId: this.value?.id, body: value });
        this.newEditor?.reset();

        this.childrenMap![newMemo.id] = new MemoView(newMemo);
        this.domainEventBus.emit(DomainEventBus.eventNames.Created, newMemo);
      },
    });
  }

  @action
  public startEditing() {
    assert(this.value, 'can not edit');

    const { id, body } = this.value;

    this.selfEditor = new Editor({
      initialValue: body,
      onSubmit: async (value: string) => {
        await this.remote.memo.updateOne.mutate([id, { body: value }]);
        this.selfEditor?.destroy(true);
      },
      onDestroyed: action(() => {
        this.selfEditor = undefined;
      }),
    });
  }

  @action
  public override destroy() {
    super.destroy();
    this.selfEditor?.destroy();
    this.newEditor?.destroy();
    this.destroyController.abort();
  }
}
