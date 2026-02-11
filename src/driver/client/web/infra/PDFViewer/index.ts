import { AnnotationEditorType, type PDFDocumentProxy } from 'pdfjs-dist';
import {
  EventBus,
  LinkTarget,
  PDFFindController,
  PDFLinkService,
  PDFViewer as BasePDFViewer,
  ScrollMode,
  SpreadMode,
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
  private history?: PDFHistory;

  protected readonly abortController = new AbortController();

  @observable.ref public accessor viewer: BasePDFViewer | undefined;

  private readonly eventBus = new EventBus();

  public readonly textFinder = new PDFTextFinder(this.eventBus);

  @observable public accessor scale: { value: number; text: string } | undefined;

  @observable public accessor currentPage: number | undefined;

  @computed
  public get totalPage() {
    return this.viewer?.pagesCount;
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
      this.viewer = pdfViewer;
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
  }

  private async initPageLabels() {
    assert(this.viewer);
    const labels = await this.viewer.pdfDocument?.getPageLabels();

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

    this.viewer.setPageLabels(labels);
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
    const viewer = this.viewer;
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
    assert(this.viewer);
    const currentScaleValue = this.viewer.currentScaleValue;
    if (
      currentScaleValue === ScaleValues.Auto ||
      currentScaleValue === ScaleValues.PageFit ||
      currentScaleValue === ScaleValues.PageWidth
    ) {
      // Note: the scale is constant for 'page-actual'.
      this.viewer.currentScaleValue = currentScaleValue;
    }
    this.viewer.update();
  }

  private hijackClick(e: MouseEvent) {
    if (e.target instanceof HTMLAnchorElement && e.target.href) {
      shell.openNewWindow(e.target.href);
      e.preventDefault();
    }
  }

  public setScale(value: number | ScaleValues | 'up' | 'down') {
    assert(this.viewer);
    const { currentScale } = this.viewer;

    if (value === 'up') {
      this.viewer.currentScale = SCALE_STEPS.find((step) => step > currentScale) || currentScale;
    } else if (value === 'down') {
      this.viewer.currentScale = SCALE_STEPS.findLast((step) => step < currentScale) || currentScale;
    } else if (typeof value === 'number') {
      this.viewer.currentScale = value;
    } else {
      this.viewer.currentScaleValue = value;
    }
  }

  @action
  private updateCurrentPage(pageNumber: number) {
    this.currentPage = pageNumber;
  }

  public readonly goToNextPage = () => {
    assert(this.viewer);
    return this.viewer.nextPage();
  };

  public readonly goToPreviousPage = () => {
    assert(this.viewer);
    return this.viewer.previousPage();
  };

  public jumpTo(page: number | OutlineItem | string) {
    assert(this.viewer?.pdfDocument);
    const totalPage = this.viewer.pdfDocument.numPages;

    if (!totalPage || (typeof page === 'number' && (page < 1 || page > totalPage || !Number.isInteger(page)))) {
      return false;
    }

    if (typeof page === 'number') {
      this.viewer.currentPageNumber = page;
    } else if (typeof page === 'string') {
      this.viewer.linkService.setHash(page);
    } else if (page.dest) {
      this.viewer.linkService.goToDestination(page.dest);
    }
  }

  public destroy() {
    this.viewer?.cleanup();
    this.history?.reset();
    this.textFinder.destroy();
    this.abortController.abort();
  }
}
