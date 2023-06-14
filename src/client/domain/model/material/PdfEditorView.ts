import { makeObservable } from 'mobx';

import EditorView from './EditorView';
import type PdfEditor from './PdfEditor';
import type Tile from 'model/workbench/Tile';

interface State {
  hash: string | null; // pdfjs's hash, including page, scroll position, zoom etc;
}

export default class PdfEditorView extends EditorView<PdfEditor, State> {
  constructor(tile: Tile, editor: PdfEditor) {
    super(tile, editor, { hash: null });
    makeObservable(this);
  }
}
