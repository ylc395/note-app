import { makeObservable, computed, observable, action } from 'mobx';

import { IS_DEV } from 'infra/constants';
import Editor, { type Breadcrumbs } from 'model/abstract/Editor';
import type Tile from 'model/workbench/Tile';

import type EditableNote from './Editable';
import type { NoteTreeNode } from 'model/note/Tree';

interface UIState {
  scrollTop: number;
  cursor: number;
}

export default class NoteEditor extends Editor<EditableNote, UIState> {
  constructor(tile: Tile, editor: EditableNote) {
    super(tile, editor);
    makeObservable(this);
  }

  @observable searchEnabled = false;

  @computed
  get tabView() {
    return {
      title: (IS_DEV ? `${this.id} ${this.editable.entityId.slice(0, 3)} ` : '') + this.editable.entity?.metadata.title,
      icon: this.editable.entity?.metadata.icon || null,
    };
  }

  @computed
  get breadcrumbs() {
    const result: Breadcrumbs = [];
    const { editable: editor } = this;

    const nodeToBreadcrumb = (node: NoteTreeNode) => ({
      id: node.id,
      title: node.title,
      icon: node.attributes?.icon,
    });

    let node: NoteTreeNode | null = editor.noteTree.getNode(editor.entityId);

    while (node && node !== editor.noteTree.root) {
      result.unshift({
        ...nodeToBreadcrumb(node),
        siblings: editor.noteTree.getSiblings(node.id).map(nodeToBreadcrumb),
      });

      node = node.parent;
    }

    return result;
  }

  @action.bound
  toggleSearch() {
    this.searchEnabled = !this.searchEnabled;
  }
}
