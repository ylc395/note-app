import { action, computed, makeObservable, observable } from 'mobx';
import assert from 'assert';

import type Tile from '@domain/app/model/workbench/Tile';
import { SelectorTypes, type AnnotationVO } from '@shared/domain/model/annotation';
import MaterialEditor from './MaterialEditor';
import EditablePdf from '../editable/EditablePdf';

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

  public get annotations() {
    return super.annotations.sort(({ selectors: selectors1 }, { selectors: selectors2 }) => {
      const firstSelector1 = selectors1[0];
      const firstSelector2 = selectors2[0];

      assert(firstSelector1?.type === SelectorTypes.Fragment && firstSelector2?.type === SelectorTypes.Fragment);
      const { page: page1 } = EditablePdf.parseFragment(firstSelector1.value);
      const { page: page2 } = EditablePdf.parseFragment(firstSelector2.value);

      return page1 - page2;
    });
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
  public setAnnotationVisible(id: AnnotationVO['id'], isVisible: boolean) {
    const status = this.annotationsMap[id];

    if (status?.isFixed) {
      return;
    }

    this.annotationsMap[id] = { isVisible };
  }

  @action
  public toggleAnnotationFixed(id: AnnotationVO['id']) {
    const status = this.annotationsMap[id];

    if (!status) {
      return;
    }

    status.isFixed = !status.isFixed;
  }

  public isAnnotationVisible(id: AnnotationVO['id']) {
    return Boolean(this.annotationsMap[id]?.isVisible);
  }
}
