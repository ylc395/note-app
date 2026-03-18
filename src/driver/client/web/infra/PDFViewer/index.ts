import { AnnotationEditorType, type PDFDocumentProxy, type PDFPageProxy } from 'pdfjs-dist';
import {
  EventBus,
  LinkTarget,
  PDFFindController,
  PDFLinkService,
  PDFViewer as BasePDFViewer,
  ScrollMode,
  SpreadMode,
  type PDFPageView,
} from 'pdfjs-dist/web/pdf_viewer.mjs';
import assert from 'assert';
import { range } from 'lodash-es';
import { action, computed, observable, runInAction } from 'mobx';

import shell from '../shell';
import PDFHistory from './PDFHistory';
import PDFTextFinder from './PDFTextFinder';
import './style.css';

export interface OutlineItem {
  title: string;
  children: OutlineItem[];
  parent?: OutlineItem;
  key: string;
  page: number | null;
  dest: unknown[] | null | string; // 传给 pdfjs 的跳转函数用的，具体类型不明，我们也不用管
}

export enum ScaleValues {
  Auto = 'auto',
  PageWidth = 'page-width',
  PageFit = 'page-fit',
  PageActual = 'page-actual',
}

export const SCALE_STEPS = [...range(0, 11).map((i) => i / 10), ...range(12, 30, 2).map((i) => i / 10)] as const;

export interface Options {
  initialProgress?: string; // hash
  initialScale?: string;
  disableTextLayer?: boolean;
  onProgressUpdated?: (e: {
    location: {
      pageNumber: number;
      pdfOpenParams: string;
    };
  }) => void;
  view: HTMLDivElement;
  container: HTMLDivElement;
}

function isValidRotation(angle: unknown): angle is number {
  return Number.isInteger(angle) && (angle as number) % 90 === 0;
}

function isValidScrollMode(mode: unknown): mode is number {
  return Number.isInteger(mode) && Object.values(ScrollMode).includes(mode as number) && mode !== ScrollMode.UNKNOWN;
}

function isValidSpreadMode(mode: unknown): mode is number {
  return Number.isInteger(mode) && Object.values(SpreadMode).includes(mode as number) && mode !== SpreadMode.UNKNOWN;
}

export default class PDFViewer {
  public history?: PDFHistory;

  protected readonly abortController = new AbortController();

  @observable.ref private accessor core: BasePDFViewer | undefined;

  public readonly eventBus = new EventBus();

  public readonly textFinder = new PDFTextFinder(this.eventBus);

  @observable public accessor scale: { value: number; text: string } | undefined;

  @observable public accessor currentPage: number | undefined;

  public get pagesPromise() {
    return this.core?.pagesPromise;
  }

  public get viewerElement() {
    return this.core?.viewer;
  }

  @observable
  public accessor isReady = false;

  @computed
  public get totalPage() {
    return this.isReady ? this.core?.pagesCount : undefined;
  }

  public async init(doc: PDFDocumentProxy, options: Options) {
    const linkService = new PDFLinkService({
      eventBus: this.eventBus,
      externalLinkTarget: LinkTarget.BLANK,
    });

    const findController = new PDFFindController({
      linkService,
      eventBus: this.eventBus,
      updateMatchesCountOnProgress: true,
    });

    const pdfViewer = new BasePDFViewer({
      container: options.container,
      viewer: options.view,
      linkService,
      eventBus: this.eventBus,
      findController,
      textLayerMode: options.disableTextLayer ? 0 : 1,
      annotationEditorMode: AnnotationEditorType.DISABLE, // annotationEditor 是什么不太清楚，不过这个东西如果启用，会和我们 App 的拖拽功能起冲突。先给它禁用了
    });

    this.history = new PDFHistory({ linkService, eventBus: this.eventBus });
    linkService.setHistory(this.history);

    linkService.setViewer(pdfViewer);
    linkService.setDocument(doc);
    pdfViewer.setDocument(doc);

    const pageLayoutPromise = doc.getPageLayout().catch(() => {
      /* Avoid breaking initial rendering; ignoring errors. */
    });
    const pageModePromise = doc.getPageMode().catch(() => {
      /* Avoid breaking initial rendering; ignoring errors. */
    });
    const openActionPromise = doc.getOpenAction().catch(() => {
      /* Avoid breaking initial rendering; ignoring errors. */
    });

    this.eventBus.on('resize', this.onResize.bind(this), { signal: this.abortController.signal });

    this.eventBus.on('pagechanging', ({ pageNumber }: { pageNumber: number }) => this.updateCurrentPage(pageNumber), {
      signal: this.abortController.signal,
    });

    this.eventBus.on(
      'scalechanging',
      action((e: { scale: number; presetValue?: string }) => {
        this.scale = {
          text: e.presetValue || `${e.scale * 100}%`,
          value: e.scale,
        };
        pdfViewer.update();
      }),
      { signal: this.abortController.signal },
    );

    options.view.addEventListener('click', this.hijackClick, { signal: this.abortController.signal });

    if (options.onProgressUpdated) {
      pdfViewer.onePageRendered.then(() => {
        pdfViewer.eventBus.on('updateviewarea', options.onProgressUpdated!, {
          signal: this.abortController.signal,
        });
      });
    }

    runInAction(() => {
      this.core = pdfViewer;
    });

    await Promise.all([
      this.initPageLabels(),
      pdfViewer.firstPagePromise.then(async () => {
        await Promise.all([pageLayoutPromise, pageModePromise, openActionPromise, new Promise(requestAnimationFrame)]);

        this.history!.initialize({
          fingerprint: doc.fingerprints[0]!,
          resetHistory: true,
        });

        const hash = options.initialProgress || `zoom=${options.initialScale ?? ScaleValues.Auto}`;
        this.setInitialView(hash, { scale: options.initialScale });

        await Promise.race([
          pdfViewer.pagesPromise,
          new Promise((resolve) => {
            setTimeout(resolve, 1000);
          }),
        ]);

        if (pdfViewer.hasEqualPageSizes) {
          return;
        }

        this.setInitialView(hash);
        pdfViewer.update();
      }),
    ]);

    runInAction(() => {
      this.isReady = true;
    });
  }

  private async initPageLabels() {
    assert(this.core);
    const labels = await this.core.pdfDocument?.getPageLabels();

    if (!labels) {
      return;
    }

    const numLabels = labels.length;

    let standardLabels = 0;
    let emptyLabels = 0;

    for (let i = 0; i < numLabels; i++) {
      const label = labels[i];
      if (label === (i + 1).toString()) {
        standardLabels++;
      } else if (label === '') {
        emptyLabels++;
      } else {
        break;
      }
    }

    if (standardLabels >= numLabels || emptyLabels >= numLabels) {
      return;
    }

    this.core.setPageLabels(labels);
  }

  private setInitialView(
    storedHash: string,
    {
      rotation,
      scrollMode,
      spreadMode,
      scale,
    }: { scale?: string; rotation?: unknown; scrollMode?: unknown; spreadMode?: unknown } = {},
  ) {
    const viewer = this.core;
    assert(viewer);

    const setRotation = (angle: unknown) => {
      if (isValidRotation(angle)) {
        viewer.pagesRotation = angle;
      }
    };
    const setViewerModes = (scroll: unknown, spread: unknown) => {
      if (isValidScrollMode(scroll)) {
        viewer.scrollMode = scroll;
      }
      if (isValidSpreadMode(spread)) {
        viewer.spreadMode = spread;
      }
    };

    setViewerModes(scrollMode, spreadMode);

    if (storedHash) {
      setRotation(rotation);

      viewer.linkService.setHash(storedHash);
    }

    if (!viewer.currentScaleValue) {
      viewer.currentScaleValue = scale ?? ScaleValues.Auto;
    }
  }

  private onResize() {
    assert(this.core);
    const currentScaleValue = this.core.currentScaleValue;
    if (
      currentScaleValue === ScaleValues.Auto ||
      currentScaleValue === ScaleValues.PageFit ||
      currentScaleValue === ScaleValues.PageWidth
    ) {
      // Note: the scale is constant for 'page-actual'.
      this.core.currentScaleValue = currentScaleValue;
    }
    this.core.update();
  }

  private hijackClick(e: MouseEvent) {
    if (e.target instanceof HTMLAnchorElement && e.target.href) {
      shell.openNewWindow(e.target.href);
      e.preventDefault();
    }
  }
  public getPageInfo(page: number) {
    const pageView: PDFPageView = this.core?.getPageView(page - 1);
    const pdfPage: PDFPageProxy = pageView.pdfPage;
    const [x0, y0, x1, y1] = pdfPage.view;

    const { div: element } = pageView;
    return { height: y1! - y0!, width: x1! - x0!, element };
  }

  public setScale(value: number | ScaleValues | 'up' | 'down') {
    assert(this.core);
    const { currentScale } = this.core;

    if (value === 'up') {
      this.core.currentScale = SCALE_STEPS.find((step) => step > currentScale) || currentScale;
    } else if (value === 'down') {
      this.core.currentScale = SCALE_STEPS.findLast((step) => step < currentScale) || currentScale;
    } else if (typeof value === 'number') {
      this.core.currentScale = value;
    } else {
      this.core.currentScaleValue = value;
    }
  }

  // 每一页总是会有 text layer，即使其中并没有文本
  public getPageTextLayerElement(page: number) {
    const div = (this.core?.getPageView(page - 1) as PDFPageView | undefined)?.textLayer?.div;
    return div;
  }

  @action
  private updateCurrentPage(pageNumber: number) {
    this.currentPage = pageNumber;
  }

  public readonly goToNextPage = () => {
    assert(this.core);
    return this.core.nextPage();
  };

  public readonly goToPreviousPage = () => {
    assert(this.core);
    return this.core.previousPage();
  };

  public jumpTo(page: number | OutlineItem | string) {
    assert(this.core?.pdfDocument);
    const totalPage = this.core.pdfDocument.numPages;

    if (!totalPage || (typeof page === 'number' && (page < 1 || page > totalPage || !Number.isInteger(page)))) {
      return false;
    }

    if (typeof page === 'number') {
      this.core.currentPageNumber = page;
    } else if (typeof page === 'string') {
      this.core.linkService.setHash(page);
    } else if (page.dest) {
      this.core.linkService.goToDestination(page.dest);
    }
  }

  public destroy() {
    this.core?.cleanup();
    this.history?.reset();
    this.textFinder.destroy();
    this.abortController.abort();
  }
}
