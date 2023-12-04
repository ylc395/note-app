import { action, computed, makeObservable, observable } from 'mobx';

import MaterialEditor from './MaterialEditor';
import type Tile from '@domain/model/workbench/Tile';
import type EditablePdf from '../editable/EditablePdf';

interface UIState {
  hash: string | null; // pdfjs's hash, including page, scroll position, zoom etc;
}

export enum Panels {
  Outline,
  AnnotationList,
}

export default class PdfEditor extends MaterialEditor<EditablePdf, UIState> {
  constructor(editable: EditablePdf, tile: Tile) {
    super(editable, tile);
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

  @computed
  get outline() {
    return this.editable.outline;
  }

  get doc() {
    return this.editable.entity?.doc;
  }

  @computed
  get pdfAnnotations() {
    return this.editable.pdfAnnotations;
  }

  getOutlineDest(key: string) {
    return this.editable.outlineDestMap[key];
  }
}
