import { observable, makeObservable, action, toJS, runInAction, autorun } from 'mobx';
import { container, singleton } from 'tsyringe';
import { once } from 'lodash-es';

import { token as rpcToken } from '@domain/client/common/infra/rpc';
import { token as storageToken } from '@domain/client/app/infra/localStorage';
import type { Duration, MemoVO } from '@domain/shared/model/memo';
import { EntityTypes, WithId } from '../entity';
import MemoTreeNode from './TreeNode';
import StarManager, { Events as StarEvents } from '../StarManager';

interface UIState {
  scrollTop?: number;
  editorContent?: string;
  panel?: 'editor' | 'calendar' | '';
}

export type Order = 'asc' | 'desc';

@singleton()
export default class MemoExplorer {
  private readonly remote = container.resolve(rpcToken);
  public readonly entityType = EntityTypes.Memo;
  private readonly localStorage = container.resolve(storageToken);
  private readonly starManager = container.resolve(StarManager);
  public readonly nodesMap: Record<MemoVO['id'], MemoTreeNode> = {};

  @observable public order: Order = 'desc'; // only work for children nodes

  @observable.ref
  public root = new MemoTreeNode({ explorer: this });

  constructor() {
    makeObservable(this);
    this.starManager.on(StarEvents.Toggle, this.updateNode);
  }

  @action.bound
  public setOrder(order: Order) {
    this.order = order;
  }

  @observable.ref
  public duration?: Duration;

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

  @action.bound
  public togglePanel(panel: 'editor' | 'calendar') {
    this.updateUIState({ panel: this.uiState.panel === panel ? '' : panel });

    if (this.uiState.panel === 'editor' && !this.root.newChildEditor) {
      this.root.startEditingNewChild(this.uiState.editorContent);
    }
  }

  private readonly updateUIStateByRootChildEditor = () => {
    if (!this.root.newChildEditor && this.uiState.panel === 'editor') {
      this.updateUIState({ panel: '' });
    }

    this.updateUIState({ editorContent: this.root.newChildEditor?.content });
  };

  public readonly init = once(() => {
    if (this.uiState.panel === 'editor') {
      this.root.startEditingNewChild(this.uiState.editorContent);
    }
    autorun(this.updateUIStateByRootChildEditor);
    this.root.load();
  });

  @action.bound
  private updateNode({ id, ...memo }: WithId<MemoVO>) {
    const node = this.nodesMap[id];

    if (!node?.memo) {
      return;
    }

    Object.assign(node.memo, memo);
  }

  public async reveal(id: MemoVO['id']) {
    const memos = await this.remote.memo.queryTreeFragment.query({ to: id, limit: 15 });

    runInAction(() => {
      this.root = MemoTreeNode.from(memos, this);
    });
  }
}
