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

import PDFHistory from './PDFHistory';
import './style.css';

interface Options {
  initialProgress?: string; // hash
  initialScale?: string;
  disableTextLayer?: boolean;
  onProgressUpdated?: () => void;
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
  private viewer?: BasePDFViewer;

  private history?: PDFHistory;

  private readonly abortController = new AbortController();

  public init(doc: PDFDocumentProxy, options: Options) {
    const eventBus = new EventBus();

    const linkService = new PDFLinkService({
      eventBus,
      externalLinkTarget: LinkTarget.BLANK,
    });

    const findController = new PDFFindController({
      linkService,
      eventBus,
    });

    const pdfViewer = new BasePDFViewer({
      container: options.container,
      viewer: options.view,
      linkService,
      eventBus,
      findController,
      textLayerMode: options.disableTextLayer ? 0 : 1,
      annotationEditorMode: AnnotationEditorType.DISABLE, // annotationEditor 是什么不太清楚，不过这个东西如果启用，会和我们 App 的拖拽功能起冲突。先给它禁用了
    });

    this.history = new PDFHistory({ linkService, eventBus });
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

    pdfViewer.firstPagePromise.then(() => {
      Promise.all([pageLayoutPromise, pageModePromise, openActionPromise, new Promise(requestAnimationFrame)])
        .then(async () => {
          this.history!.initialize({
            fingerprint: doc.fingerprints[0]!,
            resetHistory: true,
          });

          const hash = options.initialProgress || `zoom=${options.initialScale ?? 'auto'}`;
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
        })
        .then(() => {
          pdfViewer.update();
        });
    });

    eventBus._on(
      'resize',
      this.onResize.bind(this),
      // @ts-expect-error -- 类型不完善
      { signal: this.abortController.signal },
    );

    eventBus._on(
      'scalechanging',
      () => pdfViewer.update(),
      // @ts-expect-error -- 类型不完善
      { signal: this.abortController.signal },
    );

    this.viewer = pdfViewer;
    this.initPageLabels();
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
      viewer.currentScaleValue = scale ?? 'auto';
    }
  }

  private onResize() {
    assert(this.viewer);
    const currentScaleValue = this.viewer.currentScaleValue;
    if (currentScaleValue === 'auto' || currentScaleValue === 'page-fit' || currentScaleValue === 'page-width') {
      // Note: the scale is constant for 'page-actual'.
      this.viewer.currentScaleValue = currentScaleValue;
    }
    this.viewer.update();
  }

  public destroy() {
    this.viewer?.cleanup();
    this.history?.reset();
    this.abortController.abort();
  }
}
