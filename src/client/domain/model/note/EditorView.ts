import { makeObservable, computed } from 'mobx';

import { IS_DEV } from 'infra/constants';
import EditorView, { type Breadcrumbs } from 'model/abstract/EditorView';
import type Tile from 'model/workbench/Tile';
import { normalizeTitle, type NoteVO } from 'interface/Note';

import type NoteEditor from './Editor';

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
        normalizeTitle(this.editor.entity?.metadata),
      icon: this.editor.entity?.metadata.icon || null,
    };
  }

  @computed
  get breadcrumbs() {
    const result: Breadcrumbs = [];
    const { editor } = this;
    let note = editor.noteTree.getNode(editor.entityId, true)?.entity;
    const noteToBreadcrumb = (note: NoteVO) => ({
      id: note.id,
      title: normalizeTitle(note),
      icon: note.icon || undefined,
    });

    while (note) {
      result.unshift({
        ...noteToBreadcrumb(note),
        siblings: editor.noteTree.getSiblings(note.id).map(({ entity: note }) => noteToBreadcrumb(note)),
      });

      note = note.parentId ? editor.noteTree.getNode(note.parentId).entity : undefined;
    }

    return result;
  }
}
