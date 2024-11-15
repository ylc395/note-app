import { observable, when } from 'mobx';
import type { PDFDocumentProxy } from 'pdfjs-dist';

import type EditablePdf from '../../editable/EditablePdf';
import assert from 'assert';

export interface Viewer {
  init: (doc: PDFDocumentProxy) => void;
  destroy: () => void;
}

export default class ViewerManager {
  constructor(private readonly editable: EditablePdf) {}

  @observable.ref public accessor viewer: Viewer | undefined;

  private readonly abortController = new AbortController();

  public set(viewer: Viewer) {
    assert(!this.viewer, 'can not set viewer again');

    this.viewer = viewer;
    when(
      () => Boolean(this.editable.doc),
      () => viewer.init(this.editable.doc!),
      { signal: this.abortController.signal },
    );
  }

  public destroy() {
    this.abortController.abort();
    this.viewer?.destroy();
  }
}
