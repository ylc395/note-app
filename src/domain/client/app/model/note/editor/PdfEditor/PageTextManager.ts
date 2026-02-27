import { action, computed, observable, reaction, runInAction } from 'mobx';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { createQuery } from 'mobx-tanstack-query/preset';
import assert from 'assert';
import { debounce } from 'lodash-es';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { TextLocation } from '#domain/shared/model/file';
import type { NoteVO } from '#domain/shared/model/note';

// 从文档本体或是后端（OCR）获取 PDF 页面的文本
export default class PageTextManager {
  constructor(public readonly noteId: NoteVO['id']) {
    this.nativeTexts = createQuery(() => PageTextManager.extractTexts(this.doc!), {
      abortSignal: this.destroyController.signal,
      queryKey: ['pdf-texts', this.noteId],
      options: () => ({ enabled: Boolean(this.doc) }),
    });

    reaction(() => this.renderedPages, this.loadPageTexts.bind(this), { signal: this.destroyController.signal });
  }

  private readonly destroyController = new AbortController();

  public readonly nativeTexts;

  private readonly remote = container.resolve(rpcToken);

  @observable public accessor pageTexts = new Map<number, TextLocation>();

  private readonly loadingPages = new Set<number>();

  @observable.ref private accessor doc: PDFDocumentProxy | undefined;

  @observable.ref private accessor renderedPages: Readonly<number[]> | undefined;

  @computed public get isReady() {
    return this.nativeTexts.result.isSuccess;
  }

  @action
  public setDoc(doc: PDFDocumentProxy) {
    this.doc = doc;
  }

  @action
  public setRenderedPages(pages: number[]) {
    this.renderedPages = pages;
  }

  private loadingTimer?: ReturnType<typeof setTimeout>;

  private loadPageTexts = debounce(async () => {
    clearTimeout(this.loadingTimer);
    assert(this.renderedPages);

    const pagesToQuery = new Set(
      this.renderedPages.filter((page) => !this.pageTexts.has(page) && !this.loadingPages.has(page)),
    );

    if (pagesToQuery.size === 0) {
      return;
    }

    for (const page of pagesToQuery) {
      this.loadingPages.add(page);
    }

    const pageTexts = await this.remote.note.queryFileTextRecord.query({
      id: this.noteId,
      pages: Array.from(pagesToQuery),
    });

    for (const page of pagesToQuery) {
      this.loadingPages.delete(page);
    }

    runInAction(() => {
      for (const location of pageTexts) {
        assert(location.page);
        this.pageTexts.set(location.page, location);
      }
    });

    // 加载出的 pages 不完全，则反复重试
    if (pageTexts.length !== pagesToQuery.size) {
      this.loadingTimer = setTimeout(this.loadPageTexts, 60 * 1000);
    }
  }, 500);

  @action
  public destroy() {
    this.destroyController.abort();
    this.loadPageTexts.cancel();
  }

  private static async extractTexts(doc: PDFDocumentProxy) {
    const pageCount = doc.numPages;
    const result: Record<number, string> = {};

    for (let i = 0; i < pageCount; i++) {
      const page = await doc.getPage(i + 1);
      const text = await page.getTextContent({ disableNormalization: true });
      const strBuf: string[] = [];

      for (const textItem of text.items) {
        if ('str' in textItem) {
          strBuf.push(textItem.str);
        }
      }

      result[i + 1] = strBuf.join('');
    }

    return result;
  }
}
