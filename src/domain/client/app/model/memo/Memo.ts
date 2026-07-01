import { createQuery } from 'mobx-tanstack-query/preset';
import { action, computed, observable, runInAction } from 'mobx';
import assert from 'assert';

import container from '#utils/singletonContainer';
import type { MemoVO } from '#domain/shared/model/memo';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import DomainEventBus from './EventBus';
import type MemoList from './List';

export enum Tabs {
  Followup = 'followup',
  Referrers = 'referrers',
}

// 用这个类来包装来自列表中的 memoVO
export default class Memo {
  private readonly eventBus = container.resolve(DomainEventBus);

  private readonly destroyController = new AbortController();

  private readonly remote = container.resolve(rpcToken);

  constructor(value: MemoVO, { uiState, parent }: { uiState?: Memo['uiState']; parent: Memo | MemoList }) {
    this.setValue(value);

    runInAction(() => {
      this.uiState = uiState || {};
    });

    this.parent = parent;

    if (this.isParent) {
      this.childrenQuery = createQuery(
        ({ signal }) => this.remote.memo.queryList.query({ parentId: this.value.id, order: 'desc' }, { signal }),
        {
          refetchOnWindowFocus: false,
          abortSignal: this.destroyController.signal,
          queryKey: ['memos', { parentId: this.value.id }],
          options: () => ({
            enabled: this.uiState.tab === Tabs.Followup,
          }),
        },
      );
    }

    this.referrersQuery = createQuery(
      ({ signal }) => this.remote.memo.queryReferrers.query(this.value.id, { signal }),
      {
        queryKey: ['memos', 'referrers', this.value.id],
        abortSignal: this.destroyController.signal,
        options: () => ({
          enabled: this.uiState.tab === Tabs.Referrers,
        }),
      },
    );
  }

  @observable public accessor value!: MemoVO;

  private readonly parent;

  @observable public accessor uiState!: {
    tab?: string;
    revision?: boolean;
    isEditing?: boolean;
  };

  public readonly childrenQuery;

  public readonly referrersQuery;

  @computed
  public get isParent() {
    return !this.value.parentId;
  }

  @action
  public setValue(value: MemoVO) {
    assert(!this.value || this.value.id === value.id);
    this.value = value;
  }

  public readonly togglePin = async () => {
    const isPinned = !this.value.isPinned;
    await this.remote.memo.updateOne.mutate([this.value.id, { isPinned }]);

    runInAction(() => {
      this.value.isPinned = isPinned;
    });

    this.parent.childrenQuery?.invalidate();
  };

  public readonly update = async (value: string) => {
    await this.remote.memo.updateOne.mutate([this.value.id, { body: value }]);

    runInAction(() => {
      this.value.body = value;
    });

    this.uiState.isEditing = false;
  };

  public readonly createNewMemo = async (value: string) => {
    const newMemo = await this.remote.memo.create.mutate({ parentId: this.value.id, body: value });

    this.eventBus.emit(DomainEventBus.eventNames.Created, newMemo);
    this.childrenQuery?.invalidate();

    runInAction(() => {
      this.value.followupsCount += 1;
    });
  };

  public async remove() {
    await this.remote.recyclable.batchCreate.mutate([{ entityId: this.value.id }]);
    this.eventBus.emit(DomainEventBus.eventNames.Removed, this.value);
    this.parent.childrenQuery?.invalidate();
  }

  public destroy() {
    this.destroyController.abort();
  }
}
