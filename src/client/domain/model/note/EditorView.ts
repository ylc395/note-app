import EditorView from 'model/abstract/EditorView';
import type NoteEditor from './Editor';
import type Tile from 'model/workbench/Tile';

interface State {
  scrollOffset: 0;
  cursor: number;
}

export default class NoteEditorView extends EditorView<NoteEditor, State> {
  constructor(tile: Tile, editor: NoteEditor) {
    super(tile, editor, { cursor: 0, scrollOffset: 0 });
  }
}
