import { action, computed, makeObservable, observable } from 'mobx';
import type { PDFViewer, PDFPageView } from 'pdfjs-dist/web/pdf_viewer';
import { compact, groupBy, intersection, range as numberRange } from 'lodash-es';
import assert from 'assert';

import PdfEditor from '@domain/app/model/material/editor/PdfEditor';
import EditablePdf from '@domain/app/model/material/editable/EditablePdf';
import { type FragmentSelector, SelectorTypes } from '@shared/domain/model/annotation';
import SelectionManager, { type SelectionEvent } from '../../common/SelectionManager';
import CommentArea from './CommentArea';

export default class AnnotationManager {
  constructor(private readonly pdfViewer: PDFViewer, public readonly editor: PdfEditor) {
    makeObservable(this);
    this.selectionManager = new SelectionManager({
      includes: (startNode, endNode) =>
        AnnotationManager.isInTextLayer(startNode) && AnnotationManager.isInTextLayer(endNode),
      onChange: this.updateSelection,
    });
  }

  public readonly commentArea = new CommentArea(this);
  private readonly selectionManager: SelectionManager;

  @observable
  public currentSelection: SelectionEvent | null = null;

  @observable.struct
  private visiblePages: number[] = [];

  @computed
  private get pageRectsMap() {
    const annotations = compact([...this.editor.annotations, this.commentArea.tempAnnotation]);
    const selectors =
      annotations.flatMap(({ selectors, id }) =>
        selectors.map((selector, i) => ({
          ...selector,
          annotationId: id,
          isLast: i === selectors.length - 1,
        })),
      ) || [];

    const rects = selectors
      .filter((selector) => selector.type === SelectorTypes.Fragment)
      .map((selector) => {
        const { page, highlight } = EditablePdf.parseFragment((selector as FragmentSelector).value);

        return {
          page,
          isLast: selector.isLast,
          annotationId: selector.annotationId,
          ...highlight,
        };
      });

    return groupBy(rects, 'page');
  }

  public getRectsOfPage(page: number) {
    const rects = this.pageRectsMap[page] || [];

    return rects.map(({ left, right, top, bottom, annotationId, isLast }) => ({
      left: Number(left),
      right: Number(right),
      top: Number(top),
      bottom: Number(bottom),
      isLast,
      annotationId,
    }));
  }

  @computed
  public get pages() {
    return intersection(Object.keys(this.pageRectsMap).map(Number), this.visiblePages);
  }

  @action.bound
  private updateVisiblePages() {
    const { ids } = this.pdfViewer._getVisiblePages() as { ids: Set<number> };
    this.visiblePages = Array.from(ids);
  }

  private static isInTextLayer(node: Node) {
    return Boolean((node instanceof HTMLElement ? node : node.parentElement)?.closest('.textLayer'));
  }

  @action.bound
  public updateSelection(e: SelectionEvent | null) {
    this.currentSelection = e;
  }

  public init() {
    assert(this.pdfViewer.firstPagePromise);
    this.pdfViewer.eventBus.on('updateviewarea', this.updateVisiblePages);
    this.pdfViewer.firstPagePromise.then(this.updateVisiblePages);
  }

  public destroy() {
    this.pdfViewer.eventBus.off('updateviewarea', this.updateVisiblePages);
    this.selectionManager.destroy();
    this.commentArea.close();
  }

  public async createAnnotation(annotation: { body?: string; color: string; range?: Range }) {
    const range = annotation.range || this.currentSelection?.range;
    assert(range);

    await this.editor.createAnnotation({
      ...annotation,
      targetText: SelectionManager.getText(range),
      selectors: this.rangeToSelectors(range),
    });

    SelectionManager.clearSelection();
  }

  public rangeToSelectors(range: Range) {
    const startPage = AnnotationManager.getPageOfNode(range.startContainer);
    const endPage = AnnotationManager.getPageOfNode(range.endContainer);
    const pages = numberRange(startPage, endPage + 1).map((i) => {
      const pageEl = (this.pdfViewer.getPageView(i - 1) as PDFPageView | undefined)?.div;
      assert(pageEl);
      return { el: pageEl, number: i };
    });

    // todo: optimize
    // see https://github.com/agentcooper/react-pdf-highlighter/blob/c87474eb7dc61900a6cd1db5f82a1f7f35b7922c/src/lib/optimize-client-rects.ts
    const rects = Array.from(range.getClientRects()).filter((rect) => {
      return rect.width > 0 && rect.height > 0;
    });

    const fragments: { left: number; right: number; top: number; bottom: number; page: number }[] = [];

    let i = 0;
    let j = 0;
    while (rects[i]) {
      const page = pages[j];
      const rect = rects[i];
      assert(page && rect);

      const pageElRect = page.el.getBoundingClientRect();
      const isInPageEl =
        rect.top >= pageElRect.top - 2 &&
        rect.bottom <= pageElRect.bottom + 2 && // range rects may be a little out of page rect
        rect.left >= pageElRect.left &&
        rect.right <= pageElRect.right;

      if (isInPageEl) {
        const { left, top, width, height } = rect;
        const {
          viewport: { scale },
          div,
        } = this.pdfViewer.getPageView(page.number - 1) as PDFPageView;
        const { left: pageLeft, top: pageTop, height: pageHeight, width: pageWidth } = div.getBoundingClientRect();

        fragments.push({
          page: page.number,
          left: (left - pageLeft) / scale,
          right: (pageWidth - (left - pageLeft + width)) / scale,
          top: (top - pageTop) / scale,
          bottom: (pageHeight - (top - pageTop + height)) / scale,
        });

        i++;
      } else {
        j++;
      }
    }

    return fragments.map((f) => ({
      type: SelectorTypes.Fragment as const,
      value: `page=${f.page}&highlight=${f.left},${f.right},${f.top},${f.bottom}`,
    }));
  }

  private static getPageOfNode(node: Node) {
    const el = node instanceof HTMLElement ? node : node.parentElement;
    const page = el?.closest('.page')?.getAttribute('data-page-number');
    assert(page);
    return Number(page);
  }
}
