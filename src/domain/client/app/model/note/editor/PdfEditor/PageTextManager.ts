import { action, computed, observable } from 'mobx';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { createQuery } from 'mobx-tanstack-query/preset';
import { memoize } from 'lodash-es';

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

  @observable.ref private accessor doc: PDFDocumentProxy | undefined;

  public readonly loadPageText = memoize((page: number) => {
    return createQuery(
      ({ signal }) =>
        this.remote.note.queryFileTextRecord.query({ id: this.options.noteId, pages: [page] }, { signal }),
      {
        select: (data) => data[0],
        abortSignal: this.destroyController.signal,
        queryKey: ['pdf-texts', { id: this.options.noteId, page }],
        retryDelay: 5000,
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
