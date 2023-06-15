import { action, makeObservable, observable } from 'mobx';

import EditorView from './EditorView';
import type PdfEditor from './PdfEditor';
import type Tile from 'model/workbench/Tile';

interface State {
  hash: string | null; // pdfjs's hash, including page, scroll position, zoom etc;
}

export enum Panels {
  Outline,
  AnnotationList,
}

export default class PdfEditorView extends EditorView<PdfEditor, State> {
  constructor(tile: Tile, editor: PdfEditor) {
    super(tile, editor, { hash: null });
    makeObservable(this);
  }

  @observable readonly panelsVisibility = {
    [Panels.Outline]: false,
    [Panels.AnnotationList]: true,
  };

  @action
  togglePanel(panel: Panels) {
    this.panelsVisibility[panel] = !this.panelsVisibility[panel];
  }
}
