import { action, computed, makeObservable, observable } from 'mobx';
import type { PDFViewer, PDFPageView } from 'pdfjs-dist/web/pdf_viewer';
import { groupBy, intersection, range as numberRange } from 'lodash-es';
import assert from 'assert';

import type PdfEditor from '@domain/app/model/material/editor/PdfEditor';
import {
  type AnnotationDTO,
  type AnnotationPatchDTO,
  type AnnotationVO,
  SelectorTypes,
  FragmentSelector,
} from '@shared/domain/model/annotation';
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
      this.editor.annotations?.flatMap(({ selectors, color }) =>
        selectors.map((selector) => ({ ...selector, color })),
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
      .map((selector) => ({ ...parseFragment((selector as FragmentSelector).value), color: selector.color }));

    return groupBy(fragments, 'page');
  }

  public getRectsOfPage(page: number) {
    const fragments = this.fragmentPageMap[page] || [];
    const { horizontalRatio, verticalRatio } = this.getPageRatio(page);

    return fragments.map(({ left, right, top, bottom, color }) => ({
      left: Number(left) * horizontalRatio,
      right: Number(right) * horizontalRatio,
      top: Number(top) * verticalRatio,
      bottom: Number(bottom) * verticalRatio,
      color,
    }));
  }

  @computed
  public get pageElements() {
    const pages = intersection(Object.keys(this.fragmentPageMap).map(Number), this.visiblePages);
    const elements = pages.map((page) => {
      const div = (this.pdfViewer.getPageView(page - 1) as PDFPageView | undefined)?.div;
      assert(div);
      return { page, div };
    });

    return elements;
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
    this.pdfViewer.eventBus.on('updateviewarea', action(this.updateVisiblePages));
    this.pdfViewer.firstPagePromise.then(this.updateVisiblePages);
  }

  @action
  public setCurrent(id: AnnotationVO['id']) {
    this.currentAnnotationId = id;
  }

  public async updateAnnotation(patch: AnnotationPatchDTO) {
    assert(this.currentAnnotationId);
    await this.editor.updateAnnotation(this.currentAnnotationId, patch);
    this.currentAnnotationId = undefined;
  }

  public destroy() {
    this.selectionManager.destroy();
  }

  public async createAnnotation(annotation: Pick<AnnotationDTO, 'body' | 'color'>) {
    assert(this.currentSelection);
    const { range } = this.currentSelection;

    await this.editor.createAnnotation({
      ...annotation,
      targetText: SelectionManager.getText(range),
      selectors: this.getSelectors(range),
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

  public getPageRect(page: number) {
    const div = (this.pdfViewer.getPageView(page - 1) as PDFPageView | undefined)?.div;
    assert(div);

    return div.getBoundingClientRect();
  }

  private getSelectors(range: Range) {
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
    const fragments: string[] = [];

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
        const { left: pageLeft, top: pageTop, height: pageHeight } = this.getPageRect(page.number);

        fragments.push(
          `page=${page.number}&highlight=${(left - pageLeft) / horizontalRatio},${
            (pageWidth - (left - pageLeft + width)) / horizontalRatio
          },${(top - pageTop) / verticalRatio},${(pageHeight - (top - pageTop + height)) / verticalRatio}`,
        );

        i++;
      } else {
        j++;
      }
    }

    return fragments.map((fragment) => ({ type: SelectorTypes.Fragment as const, value: fragment }));
  }
}
