import { normalizeTitle, type NoteVO } from '../interface/note';

import Tree from './Tree';

export default class NoteTree extends Tree<NoteVO> {
  protected toNode(note: NoteVO | null) {
    if (note) {
      return { title: normalizeTitle(note), isLeaf: note.childrenCount === 0 };
    }

    return { title: '根' };
  }

  static fromNotes(notes: NoteVO[]) {
    const tree = new NoteTree();

    for (const note of notes) {
      tree.updateTree(note);
    }

    return tree;
  }
}
