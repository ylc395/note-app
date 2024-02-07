import { action, computed, makeObservable, observable } from 'mobx';

import type Tile from '@domain/app/model/workbench/Tile';
import type { AnnotationVO } from '@shared/domain/model/annotation';
import MaterialEditor from './MaterialEditor';
import type EditablePdf from '../editable/EditablePdf';

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

  public readonly getOutlineDest = this.editable.getOutlineDest;

  @computed
  public get outline() {
    return this.editable.outline;
  }

  @computed
  public get doc() {
    return this.editable.doc;
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

  @observable.ref
  public viewer?: unknown;

  @observable
  private annotationsMap: Record<AnnotationVO['id'], { isVisible: boolean; isFixed?: boolean }> = {};

  @action
  public toggleAnnotationVisible(id: AnnotationVO['id']) {
    const status = this.annotationsMap[id];

    if (status?.isFixed) {
      return;
    }

    if (status) {
      status.isVisible = !status.isVisible;
    } else {
      this.annotationsMap[id] = { isVisible: true };
    }
  }

  public toggleAnnotationFixed(id: AnnotationVO['id']) {
    const status = this.annotationsMap[id];

    if (!status) {
      return;
    }

    status.isFixed = !status.isFixed;
  }

  public isAnnotationFixed(id: AnnotationVO['id']) {
    return Boolean(this.annotationsMap[id]?.isFixed);
  }

  public isAnnotationVisible(id: AnnotationVO['id']) {
    return Boolean(this.annotationsMap[id]?.isVisible);
  }
}
