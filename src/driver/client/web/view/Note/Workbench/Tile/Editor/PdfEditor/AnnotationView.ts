import { reaction, when } from 'mobx';
import { render, createComponent } from 'solid-js/web';
import { difference } from 'lodash-es';

import type { AnnotationVO } from '#domain/shared/model/annotation';
import type PdfViewer from './PDFViewer';
import PageAnnotationLayer from './PageAnnotationLayer';

export default class AnnotationView {
  constructor(private readonly pdfViewer: PdfViewer) {
    pdfViewer.eventBus.on('textlayerrendered', ({ pageNumber }: { pageNumber: number }) => {
      when(
        () => Boolean(pdfViewer.editor.annotation.list),
        () => this.renderAnnotation(pageNumber),
        { signal: this.destroyController.signal },
      );
    });

    reaction(() => pdfViewer.renderedPages, this.dispose.bind(this), { signal: this.destroyController.signal });
  }

  public readonly openStatusMap: Record<AnnotationVO['id'], boolean> = {};

  private readonly destroyController = new AbortController();

  private pageSolidAppMap: Record<number, { root: HTMLElement; dispose: () => void }> = {};

  private dispose(newPages: number[] | undefined, oldPages: number[] | undefined) {
    if (!oldPages) {
      return;
    }

    const removedPages = newPages ? difference(oldPages, newPages) : oldPages;

    for (const page of removedPages) {
      if (this.pageSolidAppMap[page]) {
        this.pageSolidAppMap[page].dispose();
        delete this.pageSolidAppMap[page];
      }
    }
  }

  private renderAnnotation(page: number) {
    if (this.pageSolidAppMap[page]) {
      return;
    }

    const textLayerElement = this.pdfViewer.getPageTextLayerElement(page);

    if (!textLayerElement) {
      return;
    }

    const root = document.createElement('div');

    textLayerElement.append(root);
    this.pageSolidAppMap[page] = {
      root,
      dispose: render(() => createComponent(PageAnnotationLayer, { page, pdfViewer: this.pdfViewer }), root),
    };
  }

  public destroy() {
    for (const { dispose } of Object.values(this.pageSolidAppMap)) {
      dispose();
    }

    this.destroyController.abort();
  }
}
