import { createQuery } from 'mobx-tanstack-query/preset';
import { action, computed, observable, runInAction } from 'mobx';
import assert from 'assert';

import container from '#utils/singletonContainer';
import type { MemoVO } from '#domain/shared/model/memo';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import DomainEventBus from './EventBus';

export enum Tabs {
  Followup = 'followup',
  Referrers = 'referrers',
}

// 用这个类来包装来自列表中的 memoVO
export default class Memo {
  private readonly eventBus = container.resolve(DomainEventBus);

  private readonly destroyController = new AbortController();

  private readonly remote = container.resolve(rpcToken);

  constructor(value: MemoVO, uiState?: Memo['uiState']) {
    this.setValue(value);

    runInAction(() => {
      this.uiState = uiState || {};
    });

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

  public readonly update = async (value: string) => {
    await this.remote.memo.updateOne.mutate([this.value.id, { body: value }]);

    runInAction(() => {
      this.value = { ...this.value, body: value };
      this.eventBus.emit(DomainEventBus.eventNames.Updated, this.value);
    });

    this.uiState.isEditing = false;
  };

  public async createNewMemo(value: string) {
    const newMemo = await this.remote.memo.create.mutate({ parentId: this.value.id, body: value });

    this.eventBus.emit(DomainEventBus.eventNames.Created, newMemo);
    this.childrenQuery?.invalidate();

    runInAction(() => {
      this.value.followupsCount += 1;
    });
  }

  public destroy() {
    this.destroyController.abort();
  }
}
