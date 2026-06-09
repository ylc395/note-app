import { action, computed, observable } from 'mobx';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { createQuery } from 'mobx-tanstack-query/preset';
import { memoize } from 'lodash-es';
import assert from 'assert';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { NoteVO } from '#domain/shared/model/note';

// 从文档本体或是后端（OCR）获取 PDF 页面的文本
export default class PageTextManager {
  constructor(private readonly options: { noteId: NoteVO['id']; shouldFetch: (page: number) => boolean }) {
    this.nativeTexts = createQuery(() => PageTextManager.extractTexts(this.doc!), {
      abortSignal: this.destroyController.signal,
      queryKey: ['pdf-texts', options.noteId],
      options: () => ({ enabled: Boolean(this.doc) }),
    });

    this.loadPageText.cache = new Map();
  }

  private readonly remote = container.resolve(rpcToken);

  private readonly destroyController = new AbortController();

  @observable
  public accessor displayText = false; // 用于 DEV 调试

  @observable.ref private accessor doc: PDFDocumentProxy | undefined;

  public get totalPages() {
    assert(this.doc);
    return this.doc.numPages;
  }

  public readonly loadPageText = memoize((page: number) => {
    // 或许应当判断一下 nativeText 里有没有文本。但有的 PDF 文档中，nativeText 有少量的文本，但和真正的内容关系却不大
    // 前端没法判断，只好总是请求
    return createQuery(
      async ({ signal }) => {
        const text = await this.remote.note.queryFileTextRecord.query({ id: this.options.noteId, page }, { signal });
        assert(text); // 利用异常来触发 retry
        return text;
      },
      {
        abortSignal: this.destroyController.signal,
        queryKey: ['pdf-texts', { id: this.options.noteId, page }],
        retryDelay: 5000,
        staleTime: Infinity,
        retry: this.options.shouldFetch.bind(null, page),
        options: () => ({ enabled: this.options.shouldFetch(page) }),
      },
    );
  });

  // 从文档本身获取的文本
  public readonly nativeTexts;

  @computed public get isReady() {
    return this.nativeTexts.result.isSuccess;
  }

  @action
  public setDoc(doc: PDFDocumentProxy) {
    this.doc = doc;
  }

  @action
  public destroy() {
    this.destroyController.abort();
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
