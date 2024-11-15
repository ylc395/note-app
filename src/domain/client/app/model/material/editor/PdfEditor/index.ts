import { action, computed, observable } from 'mobx';

import type Tile from '#domain/client/app/model/workbench/Tile';
import EditablePdf from '../../editable/EditablePdf';
import ViewerManager from './ViewerManager';
import Editor from '../../../abstract/Editor';

interface UIState {
  hash: string | null; // pdfjs's hash, including page, scroll position, zoom etc; see https://datatracker.ietf.org/doc/html/rfc8118#section-3
}

export enum Panels {
  Outline,
  AnnotationList,
}

export default class PdfEditor extends Editor<EditablePdf, UIState> {
  constructor(editable: EditablePdf, tile: Tile) {
    super(editable, tile);
  }

  private viewerManager = new ViewerManager(this.editable);

  @computed
  public get outline() {
    return this.editable.outline;
  }

  @action
  public togglePanel(panel: Panels) {
    this.panelsVisibility[panel] = !this.panelsVisibility[panel];
  }

  @observable
  public readonly panelsVisibility = {
    [Panels.Outline]: false,
    [Panels.AnnotationList]: true,
  };

  public destroy() {
    this.viewerManager.destroy();
    super.destroy();
  }
}
