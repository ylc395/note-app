import { createQuery } from 'mobx-tanstack-query/preset';
import { action, computed, observable } from 'mobx';
import assert from 'assert';

import { container } from '#domain/shared/infra/singletons';
import type { MemoVO } from '#domain/shared/model/memo';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import Editor from './Editor';
import RevisionList from '../RevisionList';
import DomainEventBus from './EventBus';
import type MemoList from './List';
import type { MemoItem } from './List/item';

export default class MemoView {
  constructor(options: { memoId?: MemoVO['id']; value?: MemoVO; parent?: MemoView | MemoList }) {
    if (options.value) {
      this.setValue(options.value);
    }

    this.parent = options.parent;

    if (options.memoId) {
      this.valueQuery = createQuery(({ signal }) => this.remote.memo.queryOne.query(options.memoId!, { signal }), {
        abortSignal: this.destroyController.signal,
        queryKey: ['memo', options.memoId],
      });
    }

    this.childrenQuery = createQuery(
      ({ signal }) =>
        this.remote.memo.queryList.query(
          { parentId: options.memoId || this.value!.id, order: 'desc', orderBy: 'createdAt' },
          { signal },
        ),
      {
        refetchOnWindowFocus: false,
        abortSignal: this.destroyController.signal,
        options: () => ({
          queryKey: ['memos', { parentId: options.memoId || this.value!.id }],
          enabled: this.isParent && this.visiblePanel === 'followup',
        }),
      },
    );

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

  private readonly parent?: MemoView | MemoList;

  /** 以下两个属性，存在且仅存在一个*/
  @observable public accessor value: MemoItem | undefined;

  public readonly valueQuery;
  /************/

  private readonly eventBus = container.resolve(DomainEventBus);

  private readonly destroyController = new AbortController();

  private readonly remote = container.resolve(rpcToken);

  public readonly childrenQuery;

  public readonly referrersQuery;

  @observable.ref public accessor revisionList: RevisionList | undefined;

  @observable.ref public accessor selfEditor: Editor | undefined; // 用于编辑自己的 editor

  @observable.ref public accessor newEditor: Editor | undefined; // 用于创建新的子 memo 的 editor

  @observable public accessor visiblePanel: 'followup' | 'referrers' | undefined;

  @action
  public setValue(memo: MemoVO) {
    if (this.value) {
      assert(memo.id === this.value.id, 'can not setValue');
    }

    this.value = memo;
  }

  @computed
  public get isParent() {
    if (this.valueQuery) {
      return Boolean(this.valueQuery.result.data && !this.valueQuery.result.data.parentId);
    }

    return !this.value!.parentId;
  }

  @action
  public toggleFollowup() {
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
}
