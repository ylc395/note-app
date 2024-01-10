import { action, makeObservable } from 'mobx';
import { compact, first } from 'lodash-es';
import { singleton } from 'tsyringe';
import assert from 'assert';

import NoteTree, { NoteTreeNode } from '@domain/common/model/note/Tree';
import Explorer from '../abstract/Explorer';
import { eventBus, Events as NoteEvents, UpdateEvent } from './eventBus';

export enum EventNames {
  Action = 'noteExplorer.action',
}

export interface ActionEvent {
  action: string;
  id: NoteTreeNode['id'][];
}

type Events = {
  [EventNames.Action]: ActionEvent;
};

@singleton()
export default class NoteExplorer extends Explorer<Events> {
  constructor() {
    super('noteExplorer');
    makeObservable(this);
    eventBus.on(NoteEvents.Updated, this.handleUpdate);
  }

  public readonly tree = new NoteTree();

  public load() {
    this.tree.root.loadChildren();
  }

  private readonly handleUpdate = ({ id, ...patch }: UpdateEvent) => {
    const node = this.tree.getNode(id, true);

    if (node) {
      assert(node.entity);
      this.tree.updateNode(Object.assign(node.entity, patch));
    }
  };

  @action.bound
  public updateTreeForDropping(movingId?: NoteTreeNode['id']) {
    const nodes = movingId ? [this.tree.getNode(movingId)] : this.tree.selectedNodes;

    for (const node of nodes) {
      node.isDisabled = true;
      node.parent!.isDisabled = true;

      for (const descendant of node.descendants) {
        descendant.isDisabled = true;
      }
    }

    this.status = 'toDrop';
  }

  public readonly showContextmenu = async () => {
    const isMultiple = this.tree.selectedNodes.length > 1;
    const oneNode = first(this.tree.selectedNodes);
    assert(oneNode);

    const canOpenInNewTab = !this.workbench.currentTile?.findByEntity(oneNode.entityLocator);
    const action = await this.ui.getActionFromMenu(
      compact([
        isMultiple && { label: `共${this.tree.selectedNodes.length}项`, disabled: true },
        isMultiple && { type: 'separator' },
        canOpenInNewTab && { label: '新标签页打开', key: 'openInNewTab' },
        this.workbench.currentTile && {
          label: '打开至...',
          submenu: [
            { label: '左边', key: 'openToLeft' },
            { label: '右边', key: 'openToRight' },
            { label: '上边', key: 'openToTop' },
            { label: '下边', key: 'openToBottom' },
          ],
        },
        { label: '移动至...', key: 'move' },
        !isMultiple && { label: '制作副本', key: 'duplicate' },
        { type: 'separator' },
        { label: '删除', key: 'delete' },
      ]),
    );

    if (action) {
      this.emit(EventNames.Action, { action, id: this.tree.getSelectedNodeIds() });
    }
  };
}
