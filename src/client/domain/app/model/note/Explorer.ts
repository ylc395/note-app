import { action } from 'mobx';
import { compact, once } from 'lodash-es';

import NoteTree from '@domain/common/model/note/Tree';
import Explorer from '../abstract/Explorer';
import { singleton } from 'tsyringe';

export enum EventNames {
  Action = 'noteExplorer.action',
}

type Events = {
  [EventNames.Action]: [string];
};

@singleton()
export default class NoteExplorer extends Explorer<Events> {
  public readonly tree = new NoteTree();

  public loadRoot() {
    this.tree.root.loadChildren();
  }

  @action.bound
  public disableInvalidTargetNode() {
    for (const node of this.tree.selectedNodes) {
      if (node.isDisabled) {
        continue;
      }

      node.isDisabled = true;
      node.parent!.isDisabled = true;

      for (const descendant of node.descendants) {
        descendant.isDisabled = true;
      }
    }
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
