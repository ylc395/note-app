import { action, makeObservable, observable } from 'mobx';

import MaterialEditor from './MaterialEditor';
import type Tile from 'model/workbench/Tile';
import type EditablePdf from '../editable/EditablePdf';

interface UIState {
  hash: string | null; // pdfjs's hash, including page, scroll position, zoom etc;
}

export enum Panels {
  Outline,
  AnnotationList,
}

export default class PdfEditor extends MaterialEditor<EditablePdf, UIState> {
  constructor(tile: Tile, editor: EditablePdf) {
    super(tile, editor);
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
