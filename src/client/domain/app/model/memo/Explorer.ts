import { observable, makeObservable, action, toJS, computed } from 'mobx';
import { container, singleton } from 'tsyringe';
import { once } from 'lodash-es';
import assert from 'assert';

import { token as rpcToken } from '@domain/common/infra/rpc';
import { token as storageToken } from '@domain/app/infra/localStorage';
import type { Duration, MemoVO } from '@shared/domain/model/memo';
import MemoTree from '@domain/app/model/memo/Tree';
import Editor from './Editor';
import type { UpdateEvent } from './eventBus';
import type MemoTreeNode from './TreeNode';

interface UIState {
  scrollTop?: number;
  panel?: 'editor' | 'calendar' | '';
}

@singleton()
export default class MemoExplorer {
  private readonly remote = container.resolve(rpcToken);
  private readonly localStorage = container.resolve(storageToken);

  @observable.ref
  private tree = new MemoTree();

  public readonly newRootMemoEditor = new Editor({ onSubmit: this.tree.updateTree });

  constructor() {
    makeObservable(this);
  }

  @observable.ref public duration?: Duration;

  @observable.shallow
  private readonly newMemoEditors: Record<MemoVO['id'], Editor> = {};

  @observable.shallow
  private readonly childMemoEditors: Record<MemoVO['id'], Editor> = {};

  @observable
  public uiState = {
    ...{ panel: 'editor' },
    ...this.localStorage.get<UIState>('memo-ui'),
    ...{ scrollTop: 0 },
  };

  @action.bound
  public updateUIState(state: UIState) {
    Object.assign(this.uiState, state);
    this.localStorage.set('memo-ui', toJS(this.uiState));
  }

  public readonly togglePanel = (panel: 'editor' | 'calendar') => {
    this.updateUIState({ panel: this.uiState.panel === panel ? '' : panel });
  };

  public handleEntityUpdate(e: UpdateEvent) {
    const entity = this.tree.getNode(e.id, true)?.entity;

    if (!entity) {
      return;
    }

    this.tree.updateTree({ ...entity, ...e });
  }

  @action.bound
  public startEditing(id: MemoVO['id'], newChild?: boolean) {
    const editors = newChild ? this.childMemoEditors : this.newMemoEditors;

    editors[id] = new Editor({
      memo: newChild ? undefined : this.getMemo(id),
      parentId: newChild ? id : undefined,
      onSubmit: (result) => this.stopEditing(result, newChild),
    });
  }

  public getEditor(id: MemoVO['id'], newChild?: boolean) {
    return newChild ? this.childMemoEditors[id] : this.newMemoEditors[id];
  }

  @action.bound
  public stopEditing(memo: MemoVO | MemoVO['id'], newChild?: boolean) {
    const editors = newChild ? this.childMemoEditors : this.newMemoEditors;

    if (typeof memo === 'string') {
      delete editors[memo];
    } else {
      this.tree.updateTree(memo);
      delete editors[memo.id];
    }
  }

  public readonly init = once(async () => {
    this.tree.root.loadChildren();
  });

  @action.bound
  public setDuration(duration: Duration) {
    this.duration = duration;
    this.tree = new MemoTree();
    this.tree.loadByTime(duration);
  }

  // todo: reveal 一个子 memo 怎么搞
  public async reveal(id: MemoVO['id']) {
    if (this.tree.getNode(id, true)) {
      return;
    }

    const limit = 15;
    const [after, before] = await Promise.all([
      this.remote.memo.query.query({ after: id, limit, isPinned: false }),
      this.remote.memo.query.query({ before: id, limit, isPinned: false }),
    ]);
    let pinned: MemoVO[] = [];

    if (after.length < limit) {
      this.tree.root.isEnd.after = true;
      pinned = await this.remote.memo.query.query({ isPinned: true });
    }

    this.tree.root.isEnd.before = before.length < limit;
    this.tree = new MemoTree();
    this.tree.updateTree([...after, ...before, ...pinned]);
  }

  public async togglePin(id: MemoVO['id']) {
    const memo = this.getMemo(id);
    await this.remote.memo.updateOne.mutate([id, { isPinned: !memo.isPinned }]);
    this.tree.updateTree({ ...memo, isPinned: !memo.isPinned });
  }

  public getMemo(id: MemoVO['id']) {
    const entity = this.tree.getNode(id).entity;
    assert(entity);

    return entity;
  }

  @computed
  public get memos() {
    return this.tree.root.memos;
  }

  @computed
  public get isEnd() {
    return this.tree.root.isEnd;
  }

  public load(direction: 'before' | 'after') {
    this.tree.root.loadChildren(direction);
  }

  public getChildren(id: MemoVO['id']) {
    return (this.tree.getNode(id) as MemoTreeNode).memos;
  }

  public toggleExpand(id: MemoVO['id']) {
    const result = this.tree.getNode(id).toggleExpand();

    if (result) {
      this.startEditing(id, true);
    } else {
      this.stopEditing(id, true);
    }

    return result;
  }
}
