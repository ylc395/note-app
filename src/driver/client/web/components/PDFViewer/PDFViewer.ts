import { AnnotationEditorType, type PDFDocumentProxy } from 'pdfjs-dist';
import {
  EventBus,
  LinkTarget,
  PDFFindController,
  PDFLinkService,
  PDFViewer as _PDFViewer,
} from 'pdfjs-dist/web/pdf_viewer.mjs';

export interface Options {
  doc: PDFDocumentProxy;
  initialProgress?: string; // hash
  initialScale?: string;
  onProgressUpdated?: () => void;
}

export default class PDFViewer {
  constructor(
    private readonly options: Options & {
      view: HTMLDivElement;
      container: HTMLDivElement;
    },
  ) {
    this.viewer = this.init();
  }

  private readonly viewer: _PDFViewer;

  private readonly abortController = new AbortController();

  private init() {
    const eventBus = new EventBus();

    const linkService = new PDFLinkService({
      eventBus,
      externalLinkTarget: LinkTarget.BLANK,
    });

    const findController = new PDFFindController({
      linkService,
      eventBus,
    });

    const pdfViewer = new _PDFViewer({
      container: this.options.container,
      viewer: this.options.view,
      linkService,
      eventBus,
      findController,
      annotationEditorMode: AnnotationEditorType.DISABLE, // annotationEditor 是什么不太清楚，不过这个东西如果启用，会和我们 App 的拖拽功能起冲突。先给它禁用了
    });

    const pdfDocument = this.options.doc;

    linkService.setViewer(pdfViewer);
    linkService.setDocument(pdfDocument);
    pdfViewer.setDocument(pdfDocument);

    const pageLayoutPromise = pdfDocument.getPageLayout().catch(() => {
      /* Avoid breaking initial rendering; ignoring errors. */
    });
    const pageModePromise = pdfDocument.getPageMode().catch(() => {
      /* Avoid breaking initial rendering; ignoring errors. */
    });
    const openActionPromise = pdfDocument.getOpenAction().catch(() => {
      /* Avoid breaking initial rendering; ignoring errors. */
    });

    pdfViewer.firstPagePromise.then(() => {
      Promise.all([pageLayoutPromise, pageModePromise, openActionPromise, new Promise(requestAnimationFrame)])
        .then(async () => {
          if (!this.options.initialProgress) {
            return;
          }

          linkService.setHash(this.options.initialProgress);
          await pdfViewer.pagesPromise;

          if (pdfViewer.hasEqualPageSizes) {
            linkService.setHash(this.options.initialProgress);
          }
        })
        .then(() => {
          if (this.options.initialScale) {
            pdfViewer.currentScaleValue = this.options.initialScale;
          }

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

    return pdfViewer;
  }

  private onResize() {
    const currentScaleValue = this.viewer.currentScaleValue;
    if (currentScaleValue === 'auto' || currentScaleValue === 'page-fit' || currentScaleValue === 'page-width') {
      // Note: the scale is constant for 'page-actual'.
      this.viewer.currentScaleValue = currentScaleValue;
    }
    this.viewer.update();
  }

  public cleanup() {
    this.viewer.cleanup();
  }

  public destroy() {}
}
