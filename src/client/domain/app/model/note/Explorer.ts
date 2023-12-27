import { action, makeObservable } from 'mobx';
import { compact } from 'lodash-es';
import { singleton } from 'tsyringe';
import assert from 'assert';

import NoteTree, { NoteTreeNode } from '@domain/common/model/note/Tree';
import Explorer from '../abstract/Explorer';
import type EditableEntity from '../abstract/EditableEntity';
import EditableNote from './Editable';
import { EventNames as EditableEntityEvents } from '../manager/EditableEntityManager';

export enum EventNames {
  Action = 'noteExplorer.action',
}

type Events = {
  [EventNames.Action]: [string];
};

@singleton()
export default class NoteExplorer extends Explorer<Events> {
  constructor() {
    super();
    makeObservable(this);
    this.editableEntityManager.on(EditableEntityEvents.entityUpdated, this.handleEntityUpdated);
  }

  public readonly tree = new NoteTree();

  public loadRoot() {
    this.tree.root.loadChildren();
  }

  protected readonly handleEntityUpdated = (editableEntity: EditableEntity) => {
    if (!(editableEntity instanceof EditableNote)) {
      return;
    }

    const node = this.tree.getNode(editableEntity.entityId, true);

    if (node) {
      assert(node.entity);
      this.tree.updateNode({ ...node.entity, ...editableEntity.entity });
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

  public async showContextmenu() {
    const isMultiple = this.tree.selectedNodes.length > 1;
    const action = await this.ui.getActionFromMenu(
      compact([
        isMultiple && { label: `共${this.tree.selectedNodes.length}项`, disabled: true },
        isMultiple && { type: 'separator' },
        { label: '移动至...', key: 'move' },
        !isMultiple && { label: '制作副本', key: 'duplicate' },
        { type: 'separator' },
        { label: '删除', key: 'delete' },
      ]),
    );

    if (action) {
      this.emit(EventNames.Action, action);
    }
  }
}
