import { runInAction } from 'mobx';
import { container } from 'tsyringe';
import { NoteVO } from '@domain/model/note';
import NoteTree from '@shared/domain/model/note/Tree';

import ExplorerNoteTree from './ExplorerTree';

export default class TargetTree extends NoteTree {
  private readonly from = container.resolve(ExplorerNoteTree);

  constructor() {
    super();

    runInAction(() => {
      Object.assign(this.root, this.entityToNode(this.root.entity));
    });
  }

  protected entityToNode(note: NoteVO | null) {
    return {
      ...super.entityToNode(note),
      isDisabled: this.isDisable(note),
    };
  }

  private isDisable(note: NoteVO | null) {
    if (!this.from) {
      return false;
    }

    const parentIds = this.from.selectedNodes.map(({ entity }) => entity?.parentId || null);

    if (!note) {
      return parentIds.includes(null);
    }

    if ([...parentIds, ...this.from.selectedNodeIds].includes(note.id)) {
      return true;
    }

    return this.getAncestors(note.parentId).some((node) => node.isDisabled);
  }
}
