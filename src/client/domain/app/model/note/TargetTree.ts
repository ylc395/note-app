import { runInAction } from 'mobx';
import { NoteVO } from '@shared/domain/model/note';
import NoteTree from '@domain/common/model/note/Tree';

export default class TargetTree extends NoteTree {
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
    return false;
    // if (!this.from) {
    //   return false;
    // }

    // const parentIds = this.from.selectedNodes.map(({ entity }) => entity?.parentId || null);

    // if (!note) {
    //   return parentIds.includes(null);
    // }

    // if ([...parentIds, ...this.from.selectedNodeIds].includes(note.id)) {
    //   return true;
    // }

    // return this.getAncestors(note.parentId).some((node) => node.isDisabled);
  }
}
