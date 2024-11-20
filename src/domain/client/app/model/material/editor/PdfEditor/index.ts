import type { PDFDocumentProxy } from 'pdfjs-dist';
import { action, computed, observable, runInAction, when } from 'mobx';
import assert from 'assert';

import { container } from '#domain/shared/infra/singletons';
import MaterialEditor from '../MaterialEditor';
import DocumentFactory from './DocumentFactory';
import { flow } from 'lodash-es';

interface UIState {
  hash: string | null; // pdfjs's hash, including page, scroll position, zoom etc; see https://datatracker.ietf.org/doc/html/rfc8118#section-3
}

interface Viewer {
  init: (doc: PDFDocumentProxy) => void;
  destroy: () => void;
}

export enum Panels {
  Outline,
  AnnotationList,
}

export default class PdfEditor extends MaterialEditor<UIState> {
  private readonly docFactory = container.resolve(DocumentFactory);
  private doc?: PDFDocumentProxy; // this is view-independent
  @observable.ref public accessor viewer: Viewer | undefined;

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

  public destroy() {
    super.destroy();
    this.disposeViewer?.();
    this.docFactory.revoke(this.entityLocator.entityId);
  }
}
