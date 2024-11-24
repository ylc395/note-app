import type { PDFDocumentProxy } from 'pdfjs-dist';
import { action, computed, observable, runInAction, when } from 'mobx';
import assert from 'assert';
import { flow, isObject } from 'lodash-es';

import type { AnnotationVO } from '#domain/shared/model/annotation';
import { container } from '#domain/shared/infra/singletons';
import MaterialEditor from '../MaterialEditor';
import DocumentFactory from './DocumentFactory';
import { create as createUIState } from './uiState';

interface Viewer {
  init: (doc: PDFDocumentProxy) => void;
  destroy: () => void;
}

export enum Panels {
  Outline,
  AnnotationList,
}

export default class PdfEditor extends MaterialEditor {
  private readonly docFactory = container.resolve(DocumentFactory);

  private doc?: PDFDocumentProxy; // this is view-independent

  @observable.ref public accessor viewer: Viewer | undefined;

  public readonly uiState = createUIState(this.entityLocator.entityId);

  protected async load(abortSignal: AbortController['signal']) {
    await super.load(abortSignal);
    assert(this.blob);

    const doc = await this.docFactory.create({
      materialId: this.entityLocator.entityId,
      blob: this.blob,
    });

    runInAction(() => {
      this.doc = doc;
    });
  }

  private disposeViewer?: () => void;

  public setViewer(viewer: NonNullable<PdfEditor['viewer']>) {
    this.viewer = viewer;

    const stopInitializing = when(
      () => Boolean(this.doc),
      () => viewer.init(this.doc!),
    );

    this.disposeViewer = flow([stopInitializing, viewer.destroy.bind(viewer)]);
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

  @computed
  public get outlines() {
    return this.docFactory.getOutline(this.entityLocator.entityId);
  }

  protected sortAnnotations(annotation1: AnnotationVO, annotation2: AnnotationVO) {
    const first1 = annotation1.selectors[0];
    const first2 = annotation2.selectors[0];

    if (isObject(first1) && isObject(first2) && 'page' in first1 && 'page' in first2) {
      return Number(first1.page) - Number(first2.page);
    }

    return 0;
  }

  public destroy() {
    super.destroy();
    this.disposeViewer?.();
    this.docFactory.revoke(this.entityLocator.entityId);
  }
}
