import { createInfiniteQuery } from 'mobx-tanstack-query/preset';
import { last } from 'lodash-es';
import { action, observable } from 'mobx';
import assert from 'assert';

import { container } from '#domain/shared/infra/singletons';
import type { MemoVO } from '#domain/shared/model/memo';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import { eventBus as domainEventBus, EventNames as DomainEventNames } from './eventBus';

import Editor from './Editor';

export default class MemoView {
  constructor(public readonly value: MemoVO) {
    if (this.isParent) {
      const LIMIT = 30;
      this.query = createInfiniteQuery(
        ({ signal, pageParam }) =>
          this.remote.memo.queryList.query(
            { parentId: this.value.parentId, limit: LIMIT, ...pageParam, order: 'desc' },
            { signal },
          ),
        {
          // 无限加载的列表就别 stale 了，refetch 的代价太大
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
    }
  }

  private readonly remote = container.resolve(rpcToken);

  private readonly query;

  private readonly destroyController = new AbortController();

  @observable.ref public accessor selfEditor: Editor | undefined; // 用于编辑自己的 editor

  @observable.ref public accessor newEditor: Editor | undefined; // 用于创建新的子 memo 的 editor

  @observable public accessor isExpand = false;

  @observable.ref public accessor children: MemoView[] | undefined;

  public async loadMore() {
    const result = await this.query?.fetchNextPage();

    if (!result?.data) {
      return;
    }

    const latest = last(result.data.pages);

    if (!latest) {
      return;
    }

    if (!this.children) {
      this.children = [];
    }

    this.children.push(...latest.map((memo) => new MemoView(memo)));
  }

  private get isParent() {
    return !this.value.parentId;
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
        const newMemo = await this.remote.memo.create.mutate({ parentId: this.value.id, body: value });
        this.children?.unshift(new MemoView(newMemo));
        this.newEditor?.reset();

        domainEventBus.emit(DomainEventNames.Created, newMemo);
      },
    });
  }

  @action
  public startEditing() {
    const onSubmit = async (value: string) => {
      await this.remote.memo.updateOne.mutate([this.value.id, { body: value }]);
      this.selfEditor?.destroy();
    };

    this.selfEditor = new Editor({
      initialValue: this.value.body,
      onSubmit,
      onDestroyed: action(() => {
        this.selfEditor = undefined;
      }),
    });
  }

  private destroy() {
    this.selfEditor?.destroy();
    this.newEditor?.destroy();

    if (this.children) {
      for (const child of this.children) {
        child.destroy();
      }
    }

    this.destroyController.abort();
  }
}
