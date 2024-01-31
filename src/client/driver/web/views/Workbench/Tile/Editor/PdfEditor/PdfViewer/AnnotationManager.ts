import { action, computed, makeObservable, observable } from 'mobx';
import type { PDFViewer, PDFPageView } from 'pdfjs-dist/web/pdf_viewer';
import { groupBy, intersection, range as numberRange } from 'lodash-es';
import assert from 'assert';

import type PdfEditor from '@domain/app/model/material/editor/PdfEditor';
import {
  type AnnotationDTO,
  type AnnotationPatchDTO,
  type AnnotationVO,
  type SvgSelector,
  SelectorTypes,
} from '@shared/domain/model/annotation';
import RangeSelector, { type RangeSelectEvent } from '../../common/RangeSelector';

export default class AnnotationManager {
  constructor(private readonly pdfViewer: PDFViewer, private readonly editor: PdfEditor) {
    makeObservable(this);
    this.rangeSelector = new RangeSelector({
      includes: (startNode, endNode) => this.isInTextLayer(startNode) && this.isInTextLayer(endNode),
      onChange: this.updateRangeEvent,
    });
  }

  private readonly rangeSelector: RangeSelector;

  @observable
  public rangeEvent: RangeSelectEvent | null = null;

  @observable
  public currentAnnotationId?: AnnotationVO['id'];

  @observable.struct
  private visiblePages: number[] = [];

  @computed
  private get selectors() {
    const selectors =
      this.editor.annotations?.flatMap(({ selectors, color }) =>
        (selectors.filter((selector) => selector.type === SelectorTypes.Svg && selector.page) as SvgSelector[]).map(
          (selector) => ({ ...selector, color }),
        ),
      ) || [];

    return groupBy(selectors, 'page');
  }

  public getRectsOfPage(page: number) {
    const selectors = this.selectors[page] || [];
    const parser = new DOMParser();
    const { horizontalRatio, verticalRatio } = this.getPageRatio(page);

    return selectors.flatMap(({ value, color }) => {
      const rectEls = parser.parseFromString(value, 'image/svg+xml').querySelectorAll('rect');
      return Array.from(rectEls).map((rectEl) => ({
        x: Number(rectEl.getAttribute('x')) * horizontalRatio,
        y: Number(rectEl.getAttribute('y')) * verticalRatio,
        width: Number(rectEl.getAttribute('width')) * horizontalRatio,
        height: Number(rectEl.getAttribute('height')) * verticalRatio,
        color,
      }));
    });
  }

  @computed
  public get pageElements() {
    const pages = intersection(Object.keys(this.selectors).map(Number), this.visiblePages);
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
  private updateRangeEvent(e: RangeSelectEvent | null) {
    this.rangeEvent = e;
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
    this.rangeSelector.destroy();
  }

  public async createAnnotation(annotation: Pick<AnnotationDTO, 'body' | 'color'>) {
    assert(this.rangeEvent);
    const { range } = this.rangeEvent;

    await this.editor.createAnnotation({
      ...annotation,
      targetText: RangeSelector.getText(range),
      selectors: this.getSelectors(range),
    });

    RangeSelector.clearRange();
  }

  private getPageRatio(page: number) {
    const {
      width: displayWith,
      height: displayHeight,
      viewport: { rawDims },
    } = this.pdfViewer.getPageView(page - 1) as PDFPageView;
    const horizontalRatio = displayWith / (rawDims as { pageWidth: number }).pageWidth;
    const verticalRatio = displayHeight / (rawDims as { pageHeight: number }).pageHeight;

    return { horizontalRatio, verticalRatio };
  }

  private getSelectors(range: Range) {
    const getPageOfNode = (node: Node) => {
      const el = node instanceof HTMLElement ? node : node.parentElement;
      const page = el?.closest('.page')?.getAttribute('data-page-number');
      assert(page);
      return Number(page);
    };

    const startPage = getPageOfNode(range.startContainer);
    const endPage = getPageOfNode(range.endContainer);
    const pages = numberRange(startPage, endPage + 1).map((i) => {
      const pageEl = (this.pdfViewer.getPageView(i - 1) as PDFPageView | undefined)?.div;
      assert(pageEl);
      return { el: pageEl, number: i };
    });

    let i = 0;
    let j = 0;
    const pageWidth = pages[0]?.el.clientWidth;
    assert(pageWidth);

    // todo: optimize
    // see https://github.com/agentcooper/react-pdf-highlighter/blob/c87474eb7dc61900a6cd1db5f82a1f7f35b7922c/src/lib/optimize-client-rects.ts
    const rects = Array.from(range.getClientRects()).filter(
      ({ width, height }) => width > 0 && height > 0 && width !== pageWidth,
    );

    let pageSvgSelector: { page: number; svg: SVGSVGElement } | undefined;
    const pageSvgSelectors: { page: number; svg: SVGSVGElement }[] = [];

    while (rects[i]) {
      const page = pages[j];
      const rect = rects[i];
      assert(page && rect);

      if (!pageSvgSelector || pageSvgSelector.page !== page.number) {
        pageSvgSelector = {
          page: page.number,
          svg: document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
        };
        pageSvgSelectors.push(pageSvgSelector);
      }

      const pageElRect = page.el.getBoundingClientRect();
      const isInPageEl =
        rect.top >= pageElRect.top &&
        rect.bottom <= pageElRect.bottom &&
        rect.left >= pageElRect.left &&
        rect.right <= pageElRect.right;

      if (isInPageEl) {
        const { x, y, width, height } = rect;
        const canvas = (this.pdfViewer.getPageView(page.number - 1) as PDFPageView | undefined)?.canvas;
        assert(canvas && pageSvgSelector);

        const { x: pageX, y: pageY } = canvas.getBoundingClientRect();
        const { horizontalRatio, verticalRatio } = this.getPageRatio(page.number);

        const svgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        svgRect.setAttributeNS(null, 'x', String((x - pageX) / horizontalRatio));
        svgRect.setAttributeNS(null, 'y', String((y - pageY) / verticalRatio));
        svgRect.setAttributeNS(null, 'width', String(width / horizontalRatio));
        svgRect.setAttributeNS(null, 'height', String(height / horizontalRatio));

        pageSvgSelector.svg.appendChild(svgRect);

        i++;
      } else {
        j++;
      }
    }

    return pageSvgSelectors.map(
      ({ page, svg }) =>
        ({
          type: SelectorTypes.Svg,
          value: svg.outerHTML,
          page,
        } satisfies SvgSelector),
    );
  }
}
