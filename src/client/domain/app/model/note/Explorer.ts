import { action, makeObservable } from 'mobx';
import { compact } from 'lodash-es';
import { singleton } from 'tsyringe';
import assert from 'assert';

import NoteTree, { NoteTreeNode } from '@domain/common/model/note/Tree';
import Explorer from '../abstract/Explorer';
import eventBus, { Events as NoteEvents, UpdateEvent } from './eventBus';

@singleton()
export default class NoteExplorer extends Explorer {
  constructor() {
    super();
    makeObservable(this);
    eventBus.on(NoteEvents.Updated, this.handleUpdate);
  }

  public readonly tree = new NoteTree();

  public load() {
    this.tree.root.loadChildren();
  }

  private readonly handleUpdate = ({ id, title, parentId }: UpdateEvent) => {
    const node = this.tree.getNode(id, true);

    if (node) {
      assert(node.entity);
      const patch = {
        title: title !== undefined ? title : node.entity.title,
        parentId: parentId !== undefined ? parentId : node.entity.parentId,
      };

      this.tree.updateNode({ ...node.entity, ...patch });
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
    const action = await this.ui.getActionFromMenu(
      compact([
        isMultiple && { label: `共${this.tree.selectedNodes.length}项`, disabled: true },
        isMultiple && { type: 'separator' },
        this.workbench.focusedTile && {
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
      eventBus.emit(NoteEvents.Action, { action, id: this.tree.getSelectedNodeIds() });
    }
  };
}
