import {
  EventBus,
  PDFViewer,
  PDFLinkService,
  PDFFindController,
  type PDFPageView,
} from 'pdfjs-dist/web/pdf_viewer.mjs';
import { AnnotationEditorType, AnnotationMode, type PDFPageProxy } from 'pdfjs-dist';
import { debounce, noop, range as numberRange } from 'lodash-es';
import { observable, when, action, computed, runInAction, reaction } from 'mobx';
import { z } from 'zod';
import assert from 'assert';

import type { default as PdfEditor, OutlineItem } from '#domain/client/app/model/note/editor/PdfEditor';
import { getPage, type AnnotationVO } from '#domain/client/app/model/annotation';
import HistoryStack, { Direction, type HistoryRecord } from '#domain/client/app/model/base/HistoryStack';
import PersistedMap from '#domain/client/shared/model/abstract/PersistedMap';
import { goToAnnotationCommand, goToPageCommand } from '#domain/client/app/model/note/editor/command';
import shell from '#web/infra/shell';
import { APP_NAME } from '#domain/shared/infra/constants';
import { withAbortSignal } from '#utils/function';

import TextFinder from './SearchBar/TextFinder';

interface Options {
  container: HTMLDivElement;
  viewer: HTMLDivElement;
  editor: PdfEditor;
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

export enum Events {
  CustomTextLayerRendered = `${APP_NAME}_customTextLayerRendered`,
}

export default class PdfViewer {
  constructor(options: Options) {
    this.editor = options.editor;
    this.pdfViewer = this.createViewer(options);
    this.textFinder = new TextFinder(this);
    this.state = new PersistedMap(
      `${options.editor.noteId}-view`,
      z.object({ hash: z.string().optional().catch(undefined) }),
    );

    when(
      () => this.editor.isReady && this.state.isReady,
      () => this.init(),
      { signal: this.destroyController.signal },
    );

    reaction(
      () => this.renderedPages,
      (pages) => pages && this.editor.texts.setRenderedPages(pages),
      { signal: this.destroyController.signal },
    );
  }

  private readonly pdfViewer: PDFViewer;

  public readonly editor: PdfEditor;

  private readonly destroyController = new AbortController();

  private readonly state;

  // 1. 这个数组里的页面未必存在于 DOM 里（异步更新的，和 DOM 实际情况存在时间差）
  // 2. 我们确保若页面确实存在，则其原生 textLayer 都是已经渲染完毕的。
  @observable.ref
  public accessor renderedPages: number[] | undefined;

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

  public readonly textFinder: TextFinder;

  @computed
  public get totalPage() {
    return this.editor.doc?.numPages;
  }

  public get pagesPromise() {
    return this.pdfViewer.pagesPromise;
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

    pdfViewer.eventBus.on('textlayerrendered', this.updateRenderedPage.bind(this)); // 注意，这个事件发生时不能确保 textLayer 已经渲染了

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
        }),
      );
    });

    return pdfViewer;
  }

  private async init() {
    const doc = this.editor.doc;
    assert(doc);

    (this.pdfViewer.linkService as PDFLinkService).setDocument(doc);
    this.pdfViewer.setDocument(doc);
    const hash = this.state.get('hash');

    if (hash) {
      // pdf.js 里的 app.js 里有更完整的实现（见 setInitialView）
      await Promise.all([
        doc.loadingTask,
        doc.getPageLayout().catch(noop),
        this.pdfViewer.pagesPromise,
        this.pdfViewer.onePageRendered,
      ]);

      requestAnimationFrame(() => {
        this.jumpTo({ hash });

        // 这里必须手动更新下，因为 jumpTo 方法很可能没有触发 pagechanging 事件
        const page = Number(new URLSearchParams(hash).get('page'));
        if (page) {
          this.updateCurrentPage(page);
        }
        runInAction(() => {
          this.isReady = true;
        });
      });
    } else {
      this.updateCurrentPage(1);

      runInAction(() => {
        this.isReady = true;
      });
    }

    this.hijackClick();
    when(() => this.isReady, this.initCommandHandler.bind(this), { signal: this.destroyController.signal });
  }

  private initCommandHandler() {
    const subscription = this.editor.command$.subscribe((command) => {
      if (goToPageCommand.is(command)) {
        this.jumpTo(command.payload);
      }

      if (goToAnnotationCommand.is(command)) {
        this.jumpToAnnotation(command.payload);
      }
    });

    this.destroyController.signal.addEventListener('abort', subscription.unsubscribe.bind(subscription));
  }

  @action
  private updateCurrentPage(pageNumber: number) {
    this.currentPage = pageNumber;
  }

  private pageElementObserver?: MutationObserver;

  private updateRenderedPage() {
    this.pageElementObserver?.disconnect();

    const pageViews = Array.from(this.pdfViewer.getCachedPageViews()) as PDFPageView[];
    const elementsToObserve = pageViews
      .map((view) => view.textLayer?.div)
      .filter((div) => !div?.querySelector('.endOfContent')) as HTMLDivElement[];

    const renderedPages = pageViews.map((view) => view.pdfPage.pageNumber as number);

    if (elementsToObserve.length > 0) {
      // 此时 textLayer 很可能还没就绪，而是在之后的某个时刻就绪（以 endOfContent 元素的出现为标志）
      let readyCount = 0;
      const observer = new MutationObserver((e) => {
        if (
          e.some(({ addedNodes }) =>
            Array.from(addedNodes).find(
              (node) => node instanceof HTMLElement && node.classList.contains('endOfContent'),
            ),
          )
        ) {
          readyCount += 1;

          if (readyCount === elementsToObserve.length) {
            runInAction(() => {
              this.renderedPages = renderedPages;
            });
            observer.disconnect();

            if (this.pageElementObserver === observer) {
              this.pageElementObserver = undefined;
            }
          }
        }
      });

      for (const el of elementsToObserve) {
        observer.observe(el, { childList: true });
      }

      this.pageElementObserver = observer;
    } else {
      runInAction(() => {
        this.renderedPages = renderedPages;
      });
      this.pageElementObserver = undefined;
    }
  }

  // 每一页总是会有 text layer，即使其中并没有文本
  public getPageTextLayerElement(page: number) {
    const div = (this.pdfViewer.getPageView(page - 1) as PDFPageView | undefined)?.textLayer?.div;
    return div;
  }

  public getPageInfo(page: number) {
    const pageView: PDFPageView = this.pdfViewer.getPageView(page - 1);
    const pdfPage: PDFPageProxy = pageView.pdfPage;
    const [x0, y0, x1, y1] = pdfPage.view;

    const { div: element } = pageView;
    return { height: y1! - y0!, width: x1! - x0!, element };
  }

  private hijackClick() {
    this.pdfViewer.viewer?.addEventListener(
      'click',
      (e) => {
        if (this.editor.annotation.svgEditor.isEnabled) {
          e.preventDefault();
          return;
        }

        if (e.target instanceof HTMLAnchorElement && e.target.href) {
          shell.openNewWindow(e.target.href);
          e.preventDefault();
        }
      },
      { signal: this.destroyController.signal },
    );
  }

  @action.bound
  public jumpTo(page: number | OutlineItem | { hash: string }, options?: { noHistory?: boolean }) {
    if (!this.totalPage || (typeof page === 'number' && (page < 1 || page > this.totalPage || Number.isNaN(page)))) {
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

    if (!options?.noHistory) {
      const hash = this.state.get('hash');
      assert(hash);
      // 记录跳转前的位置
      this.historyStack.push({ key: hash });

      // 记录跳转后的位置
      this.pdfViewer.eventBus.on(
        'updateviewarea',
        ({ location }: { location: { pdfOpenParams: string } }) => {
          this.historyStack.push({ key: PdfViewer.normalizeHash(location.pdfOpenParams) });
        },
        { once: true },
      );
    }
    return true;
  }

  private readonly jumpToAnnotation = withAbortSignal(async (signal, annotation: AnnotationVO | AnnotationVO['id']) => {
    let _annotation;
    const _signal = AbortSignal.any([signal, this.destroyController.signal]);

    if (typeof annotation === 'string') {
      await when(() => this.editor.annotation.items.result.isSuccess, { signal: _signal });
      _annotation = this.editor.annotation.items.result.data?.find(({ id }) => id === annotation);
    } else {
      _annotation = annotation;
    }

    assert(_annotation?.targetId === this.editor.noteId);

    const page = getPage(_annotation);
    this.jumpTo(page);

    await when(() => this.annotationElementMap.has(_annotation.id), { signal: _signal });
    const el = this.annotationElementMap.get(_annotation.id);
    assert(el);

    el.scrollIntoView({ block: 'center' });
  });

  @observable.shallow public accessor annotationElementMap = new Map<AnnotationVO['id'], HTMLElement | SVGElement>();

  private handleHistoryPop(e: { record: HistoryRecord; direction: Direction }) {
    const hash = this.state.get('hash');
    assert(hash);

    this.historyStack.push({ key: hash });
    this.jumpTo({ hash: e.record.key }, { noHistory: true });
  }

  public readonly goToNextPage = () => {
    return this.pdfViewer.nextPage();
  };

  public readonly goToPreviousPage = () => {
    return this.pdfViewer.previousPage();
  };

  public destroy() {
    this.textFinder.destroy();
    this.updateUIState.flush();
    this.pdfViewer.cleanup();
    this.destroyController.abort();
    this.pageElementObserver?.disconnect();
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

  private static normalizeHash(hash: string) {
    return hash
      .replace('zoom=null', 'zoom=100') // zoom 为 null 传到 setHash 里会报错
      .replace(/^#/, '');
  }
}
