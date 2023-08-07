import { normalizeTitle, type NoteVO } from '../interface/note';

import Tree, { type Options } from './Tree';

export default class NoteTree extends Tree<NoteVO> {
  protected toNode(note: NoteVO | null) {
    if (note) {
      return { title: normalizeTitle(note), isLeaf: note.childrenCount === 0 };
    }

    return { title: '根' };
  }

  static from(notes: NoteVO[], options?: Options) {
    const tree = new NoteTree(options);
    tree.setChildren(notes, null);
    return tree;
  }
}
