import { makeObservable, computed } from 'mobx';

import { IS_DEV } from 'infra/constants';
import EditorView, { type Breadcrumbs } from 'model/abstract/EditorView';
import type Tile from 'model/workbench/Tile';

import type NoteEditor from './Editor';
import type { NoteTreeNode } from 'model/note/Tree';

interface State {
  scrollTop: number;
  cursor: number;
}

export default class NoteEditorView extends EditorView<NoteEditor, State> {
  constructor(tile: Tile, editor: NoteEditor) {
    super(tile, editor, { cursor: 0, scrollTop: 0 });
    makeObservable(this);
  }

  @computed
  get tabView() {
    return {
      title:
        (IS_DEV ? `${this.id} ${this.editor.id} ${this.editor.entityId.slice(0, 3)} ` : '') +
        this.editor.entity?.metadata.title,
      icon: this.editor.entity?.metadata.icon || null,
    };
  }

  @computed
  get breadcrumbs() {
    const result: Breadcrumbs = [];
    const { editor } = this;

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
}
