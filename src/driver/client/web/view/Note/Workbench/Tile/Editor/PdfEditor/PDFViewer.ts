import {
  EventBus,
  PDFViewer,
  PDFLinkService,
  PDFFindController,
  type PDFPageView,
} from 'pdfjs-dist/web/pdf_viewer.mjs';
import { AnnotationEditorType, AnnotationMode } from 'pdfjs-dist';
import { debounce, intersection, memoize, range as numberRange } from 'lodash-es';
import { observable, when, action, computed } from 'mobx';
import assert from 'assert';

import type { default as PdfEditor, OutlineItem } from '#domain/client/app/model/note/editor/PdfEditor';
import HistoryStack, { Direction, type HistoryRecord } from '#domain/client/app/model/base/HistoryStack';
import shell from '#web/infra/shell';

import Searcher from './SearchBar/Searcher';
import PersistedMap from '#domain/client/shared/model/abstract/PersistedMap';
import { z } from 'zod';

interface Options {
  container: HTMLDivElement;
  viewer: HTMLDivElement;
  editor: PdfEditor;
}

export interface Position {
  startPage: number;
  startOffset: number;
  endPage: number;
  endOffset: number;
  toStart?: boolean;
}

export enum ScaleValues {
  Auto = 'auto',
  PageWidth = 'page-width',
  PageFit = 'page-fit',
  PageActual = 'page-actual',
}

export const SCALE_STEPS = [
  ...numberRange(0, 11).map((i) => i / 10),
  ...numberRange(12, 30, 2).map((i) => i / 10),
] as const;

export default class PdfViewer {
  constructor(options: Options) {
    this.editor = options.editor;
    this.pdfViewer = this.createViewer(options);
    this.searcher = new Searcher(this);
    this.state = new PersistedMap(`${options.editor.noteId}-view`, z.object({ hash: z.string().optional() }), {});

    when(
      () => this.editor.isReady && this.state.isReady,
      () => this.init(),
      { signal: this.destroyController.signal },
    );
  }

  public readonly annotationOpenStatus: Record<string, boolean> = {};

  private readonly pdfViewer: PDFViewer;

  public readonly editor: PdfEditor;

  private readonly destroyController = new AbortController();

  private readonly state;

  @observable
  public accessor renderedPages: number[] = [];

  /*
   * PDFLinkService 还能关联一个 PDFHistory 对象，其具有管理历史栈的功能。但它实际上在使用浏览器的 url 历史栈，这不是我们想要的
   * 因此我们自己实现一个历史栈进行管理
   *
   * 以下位置会被我们保存：
   * 1. 一进来时的位置
   * 2. 通过跳转操作离开前的位置
   * 3. 跳转来到的位置
   */
  public readonly historyStack = new HistoryStack({
    onPop: this.handleHistoryPop.bind(this),
  });

  public get viewerElement() {
    return this.pdfViewer.viewer;
  }

  public get eventBus() {
    return this.pdfViewer.eventBus;
  }

  @observable public accessor currentPage: number | undefined;

  @observable public accessor scale = {
    value: 1,
    text: '100%',
  };
  @observable public accessor isReady = false;

  public readonly searcher: Searcher;

  @computed
  public get totalPage() {
    return this.editor.doc?.numPages || 0;
  }

  private readonly updateUIState = debounce(
    action(({ location }: { location: { pdfOpenParams: string; pageNumber: number } }) => {
      this.state.set('hash', PdfViewer.normalizeHash(location.pdfOpenParams));
    }),
    500,
  );

  private createViewer(options: Options) {
    const eventBus = new EventBus();
    const linkService = new PDFLinkService({ eventBus, ignoreDestinationZoom: true });
    const findController = new PDFFindController({ eventBus, linkService });

    const pdfViewer = new PDFViewer({
      ...options,
      annotationMode: AnnotationMode.ENABLE_STORAGE,
      annotationEditorMode: AnnotationEditorType.DISABLE, // annotationEditor 是什么不太清楚，不过这个东西如果启用，会和我们 App 的拖拽功能起冲突。先给它禁用了
      eventBus,
      linkService,
      findController,
    });

    linkService.setViewer(pdfViewer);

    pdfViewer.eventBus.on('pagechanging', ({ pageNumber }: { pageNumber: number }) =>
      this.updateCurrentPage(pageNumber),
    );

    pdfViewer.eventBus.on(
      'textlayerrendered',
      action(({ pageNumber }: { pageNumber: number }) => {
        this.renderedPages.push(pageNumber);
      }),
    );

    pdfViewer.eventBus.on(
      'scalechanging',
      action((e: { scale: number; presetValue?: string }) => {
        this.scale.text = e.presetValue || `${e.scale * 100}%`;
        this.scale.value = e.scale;
      }),
    );

    pdfViewer.eventBus.on('pagesinit', () => {
      // onePageRendered 仅在初始化后才存在
      pdfViewer.onePageRendered.then(
        action(() => {
          pdfViewer.eventBus.on('updateviewarea', this.updateUIState);
          pdfViewer.eventBus.on('updateviewarea', this.updateRenderedPage.bind(this));
          this.isReady = true;
        }),
      );

      // 把 pdf 视图的位置移动到上一次离开的地方
      const hash = this.state.get('hash');
      if (hash) {
        this.jumpTo({ hash });
      }
    });

    this.destroyController.signal.addEventListener(
      'abort',
      () => {
        this.updateUIState.flush();
        pdfViewer.cleanup();
      },
      { once: true },
    );

    return pdfViewer;
  }

  private async init() {
    const doc = this.editor.doc;
    assert(doc);

    const hash = this.state.get('hash');

    this.currentPage = (hash && PdfViewer.getPageFromHash(hash)) || 1;
    this.pdfViewer.setDocument(doc);
    (this.pdfViewer.linkService as PDFLinkService).setDocument(doc);
    this.hijackClick();
  }

  @action
  private updateCurrentPage(pageNumber: number) {
    this.currentPage = pageNumber;
  }

  @action
  private updateRenderedPage() {
    const renderedPages = (Array.from(this.pdfViewer.getCachedPageViews()) as PDFPageView[]).map(
      (view) => view.pdfPage.pageNumber as number,
    );

    this.renderedPages = intersection(this.renderedPages, renderedPages);
  }

  public getPageTextLayerElement(page: number) {
    const div = (this.pdfViewer.getPageView(page - 1) as PDFPageView).textLayer?.div;
    assert(div);

    return div;
  }

  private hijackClick() {
    this.pdfViewer.viewer?.addEventListener(
      'click',
      (e) => {
        if (e.target instanceof HTMLAnchorElement && e.target.href) {
          shell.openNewWindow(e.target.href);
          e.preventDefault();
        }
      },
      { signal: this.destroyController.signal },
    );
  }

  @action.bound
  public jumpTo(page: number | OutlineItem | { hash: string }, noHistory = false) {
    if (typeof page === 'number' && (page < 1 || page > this.totalPage)) {
      return false;
    }

    this.updateUIState.flush(); // 在跳转之前，把最新的 UI 状态给保存下

    if (typeof page === 'number') {
      this.pdfViewer.currentPageNumber = page;
    } else if (typeof page === 'object' && 'hash' in page) {
      this.pdfViewer.linkService.setHash(page.hash);
    } else if (page.dest) {
      this.pdfViewer.linkService.goToDestination(page.dest);
    }

    if (!noHistory) {
      const hash = this.state.get('hash');
      assert(hash);
      // 记录跳转前的位置
      this.historyStack.push({ record: { key: hash } });

      // 记录跳转后的位置
      this.pdfViewer.eventBus.on(
        'updateviewarea',
        ({ location }: { location: { pdfOpenParams: string } }) => {
          this.historyStack.push({ record: { key: PdfViewer.normalizeHash(location.pdfOpenParams) } });
        },
        { once: true },
      );
    }

    return true;
  }

  private handleHistoryPop(e: { record: HistoryRecord; direction: Direction }) {
    const hash = this.state.get('hash');
    assert(hash);

    this.historyStack.push({ fromHistory: e.direction, record: { key: hash } });
    this.historyStack.push({ fromHistory: e.direction, record: e.record });
    this.jumpTo({ hash: e.record.key }, true);
  }

  public readonly goToNextPage = () => {
    return this.pdfViewer.nextPage();
  };

  public readonly goToPreviousPage = () => {
    return this.pdfViewer.previousPage();
  };

  public destroy() {
    this.searcher.destroy();
    this.destroyController.abort();
  }

  public setScale(value: string) {
    const { currentScale } = this.pdfViewer;

    if (value === 'up') {
      this.pdfViewer.currentScale = SCALE_STEPS.find((step) => step > currentScale) || currentScale;
    } else if (value === 'down') {
      this.pdfViewer.currentScale = SCALE_STEPS.findLast((step) => step < currentScale) || currentScale;
    } else {
      this.pdfViewer.currentScaleValue = value;
    }
  }

  private readonly createPageCanvas = memoize(async (page: number) => {
    assert(this.pdfViewer.pdfDocument);
    const pageView = await this.pdfViewer.pdfDocument.getPage(page);
    const viewport = pageView.getViewport({ scale: 1 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const renderTask = pageView.render({
      annotationMode: AnnotationMode.DISABLE,
      viewport,
      canvasContext: canvas.getContext('2d')!,
    });
    await renderTask.promise;

    return canvas;
  });

  public async getViewrectDataUrl(
    page: number,
    viewrect: { left: number; top: number; width: number; height: number },
  ) {
    const pageCanvas = await this.createPageCanvas(page);
    const rectCanvas = document.createElement('canvas');

    rectCanvas.width = viewrect.width;
    rectCanvas.height = viewrect.height;

    rectCanvas
      .getContext('2d')!
      .drawImage(
        pageCanvas,
        viewrect.left,
        viewrect.top,
        viewrect.width,
        viewrect.height,
        0,
        0,
        viewrect.width,
        viewrect.height,
      );
    const dataUrl = rectCanvas.toDataURL();

    return dataUrl;
  }

  public positionToRange(position: Position) {
    const range = new Range();
    const setBoundary = (page: number, totalOffset: number, isStart?: boolean) => {
      const textLayer = this.getPageTextLayerElement(page);
      const treeWalker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT);
      let offset = 0;

      let currentNode = treeWalker.nextNode() as Text | null;

      while (currentNode) {
        if (currentNode.length + offset >= totalOffset) {
          range[isStart ? 'setStart' : 'setEnd'](currentNode, totalOffset - offset);
          break;
        } else {
          offset += currentNode.length;
          currentNode = treeWalker.nextNode() as Text | null;
        }
      }
    };

    setBoundary(position.startPage, position.startOffset, true);
    setBoundary(position.endPage, position.endOffset);

    return range;
  }

  private static normalizeHash(hash: string) {
    return hash
      .replace('zoom=null', 'zoom=100') // zoom 为 null 传到 setHash 里会报错
      .replace(/^#/, '');
  }

  private static getPageFromHash(hash: string) {
    const page = hash.match(/page=(\d+)/)?.[1];
    return page ? Number(page) : null;
  }
}
