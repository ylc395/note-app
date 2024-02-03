import { action, computed, makeObservable, observable } from 'mobx';

import type Tile from '@domain/app/model/workbench/Tile';
import MaterialEditor from './MaterialEditor';
import type EditablePdf from '../editable/EditablePdf';
import { AnnotationVO } from '@shared/domain/model/annotation';

interface UIState {
  hash: string | null; // pdfjs's hash, including page, scroll position, zoom etc; see https://datatracker.ietf.org/doc/html/rfc8118#section-3
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

  @observable
  public readonly panelsVisibility = {
    [Panels.Outline]: false,
    [Panels.AnnotationList]: true,
  };

  public readonly getOutlineDest = this.editable.getOutlineDest;

  @action
  public togglePanel(panel: Panels) {
    this.panelsVisibility[panel] = !this.panelsVisibility[panel];
  }

  @computed
  public get outline() {
    return this.editable.outline;
  }

  @computed
  public get doc() {
    return this.editable.doc;
  }

  @observable.ref
  public viewer?: unknown;

  @observable
  private visibleAnnotations: Record<AnnotationVO['id'], boolean> = {};

  @action
  public toggleVisibleAnnotation(id: AnnotationVO['id'], force = false) {
    if (this.visibleAnnotations[id] && !force) {
      return;
    }

    if (id in this.visibleAnnotations) {
      delete this.visibleAnnotations[id];
    } else {
      this.visibleAnnotations[id] = false;
    }
  }

  @action.bound
  public toggleAnnotationFixed(id: AnnotationVO['id']) {
    if (this.isVisible(id)) {
      this.visibleAnnotations[id] = !this.visibleAnnotations[id];
    }
  }

  public isVisible(id: AnnotationVO['id']) {
    return id in this.visibleAnnotations;
  }
}
