import { action, computed, makeObservable, observable } from 'mobx';
import type { PDFViewer, PDFPageView } from 'pdfjs-dist/web/pdf_viewer';
import { groupBy, intersection, range as numberRange } from 'lodash-es';
import assert from 'assert';

import type PdfEditor from '@domain/app/model/material/editor/PdfEditor';
import { type AnnotationVO, type FragmentSelector, SelectorTypes } from '@shared/domain/model/annotation';
import SelectionManager, { type SelectionEvent } from '../../common/SelectionManager';

export default class AnnotationManager {
  constructor(private readonly pdfViewer: PDFViewer, private readonly editor: PdfEditor) {
    makeObservable(this);
    this.selectionManager = new SelectionManager({
      includes: (startNode, endNode) => this.isInTextLayer(startNode) && this.isInTextLayer(endNode),
      onChange: this.updateSelection,
    });
  }

  private readonly selectionManager: SelectionManager;

  @observable
  public currentSelection: SelectionEvent | null = null;

  @observable
  public currentAnnotationId?: AnnotationVO['id'];

  @observable.struct
  private visiblePages: number[] = [];

  @computed
  private get fragmentPageMap() {
    const selectors =
      this.editor.annotations?.flatMap(({ selectors, color, id, body }) =>
        selectors.map((selector, i) => ({
          ...selector,
          color,
          annotationId: id,
          withComment: Boolean(body) && i === selectors.length - 1,
        })),
      ) || [];

    const parseFragment = (fragment: FragmentSelector['value']) => {
      const query = new URLSearchParams(fragment);
      const highlight = query.get('highlight');
      assert(highlight);

      const [left, right, top, bottom] = highlight.split(',');

      return { page: Number(query.get('page')), left, right, top, bottom };
    };

    const fragments = selectors
      .filter((selector) => selector.type === SelectorTypes.Fragment)
      .map((selector) => ({
        ...parseFragment((selector as FragmentSelector).value),
        color: selector.color,
        annotationId: selector.annotationId,
        withComment: selector.withComment,
      }));

    return groupBy(fragments, 'page');
  }

  public getRectsOfPage(page: number) {
    const fragments = this.fragmentPageMap[page] || [];
    const { horizontalRatio, verticalRatio } = this.getPageRatio(page);

    return fragments.map(({ left, right, top, bottom, color, annotationId, withComment }) => ({
      left: Number(left) * horizontalRatio,
      right: Number(right) * horizontalRatio,
      top: Number(top) * verticalRatio,
      bottom: Number(bottom) * verticalRatio,
      color,
      annotationId,
      withComment,
    }));
  }

  @computed
  public get pages() {
    return intersection(Object.keys(this.fragmentPageMap).map(Number), this.visiblePages);
  }

  @action.bound
  private updateVisiblePages() {
    const { ids } = this.pdfViewer._getVisiblePages() as { ids: Set<number> };
    this.visiblePages = Array.from(ids);
  }

  private isInTextLayer(node: Node) {
    return Boolean((node instanceof HTMLElement ? node : node.parentElement)?.closest('.textLayer'));
  }

  @action.bound
  public updateSelection(e: SelectionEvent | null) {
    this.currentSelection = e;
  }

  public init() {
    this.pdfViewer.eventBus.on('updateviewarea', this.updateVisiblePages);
    this.pdfViewer.firstPagePromise.then(this.updateVisiblePages);
  }

  public destroy() {
    this.pdfViewer.eventBus.off('updateviewarea', this.updateVisiblePages);
    this.selectionManager.destroy();
  }

  public async createAnnotation(annotation: { body?: string; color: string }, selection?: SelectionEvent) {
    const range = selection?.range || this.currentSelection?.range;
    assert(range);

    await this.editor.createAnnotation({
      ...annotation,
      targetText: SelectionManager.getText(range),
      selectors: this.getFragments(range).map((f) => ({
        type: SelectorTypes.Fragment,
        value: `page=${f.page}&highlight=${f.left},${f.right},${f.top},${f.bottom}`,
      })),
    });

    SelectionManager.clearSelection();
  }

  public getPageRatio(page: number) {
    const {
      width: displayWith,
      height: displayHeight,
      viewport: { rawDims },
    } = this.pdfViewer.getPageView(page - 1) as PDFPageView;
    const horizontalRatio = displayWith / (rawDims as { pageWidth: number }).pageWidth;
    const verticalRatio = displayHeight / (rawDims as { pageHeight: number }).pageHeight;

    return { horizontalRatio, verticalRatio };
  }

  public static getPageOfNode(node: Node) {
    const el = node instanceof HTMLElement ? node : node.parentElement;
    const page = el?.closest('.page')?.getAttribute('data-page-number');
    assert(page);
    return Number(page);
  }

  public getFragments(range: Range) {
    const startPage = AnnotationManager.getPageOfNode(range.startContainer);
    const endPage = AnnotationManager.getPageOfNode(range.endContainer);
    const pages = numberRange(startPage, endPage + 1).map((i) => {
      const pageEl = (this.pdfViewer.getPageView(i - 1) as PDFPageView | undefined)?.div;
      assert(pageEl);
      return { el: pageEl, number: i };
    });

    const pageWidth = pages[0]?.el.clientWidth;
    assert(pageWidth);

    // todo: optimize
    // see https://github.com/agentcooper/react-pdf-highlighter/blob/c87474eb7dc61900a6cd1db5f82a1f7f35b7922c/src/lib/optimize-client-rects.ts
    const rects = Array.from(range.getClientRects()).filter(
      ({ width, height }) => width > 0 && height > 0 && width !== pageWidth,
    );
    const fragments: { left: number; right: number; top: number; bottom: number; page: number }[] = [];

    let i = 0;
    let j = 0;
    while (rects[i]) {
      const page = pages[j];
      const rect = rects[i];
      assert(page && rect);

      const pageElRect = page.el.getBoundingClientRect();
      const isInPageEl =
        rect.top >= pageElRect.top &&
        rect.bottom <= pageElRect.bottom &&
        rect.left >= pageElRect.left &&
        rect.right <= pageElRect.right;

      if (isInPageEl) {
        const { left, top, width, height } = rect;
        const { horizontalRatio, verticalRatio } = this.getPageRatio(page.number);
        const div = (this.pdfViewer.getPageView(page.number - 1) as PDFPageView | undefined)?.div;
        assert(div);
        const { left: pageLeft, top: pageTop, height: pageHeight } = div.getBoundingClientRect();

        fragments.push({
          page: page.number,
          left: (left - pageLeft) / horizontalRatio,
          right: (pageWidth - (left - pageLeft + width)) / horizontalRatio,
          top: (top - pageTop) / verticalRatio,
          bottom: (pageHeight - (top - pageTop + height)) / verticalRatio,
        });

        i++;
      } else {
        j++;
      }
    }

    return fragments;
  }
}
