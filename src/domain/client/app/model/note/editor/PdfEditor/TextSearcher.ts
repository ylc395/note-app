import type { PDFDocumentProxy } from 'pdfjs-dist';
import assert from 'assert';
import { action, computed, observable, when } from 'mobx';
import { pick, sumBy } from 'lodash-es';

import type PdfEditor from './index';
import { extractDigest } from '#utils/string';

export type Digest = NonNullable<ReturnType<typeof extractDigest>>;

export interface PageSearchResult {
  page: number;
  count: number;
  digests: Digest[];
}

export default class TextSearcher {
  constructor(private readonly editor: PdfEditor) {}

  @observable private accessor currentIndex: number | undefined;

  @observable public accessor keyword = '';

  @observable.ref public accessor searchResult: PageSearchResult[] | undefined;

  @computed
  public get searchResultCount() {
    if (!this.searchResult) {
      return 0;
    }

    return sumBy(this.searchResult, ({ count }) => count);
  }

  @observable.ref public accessor isCurrentPageOnly = false;

  @computed public get current() {
    const index = this.currentIndex;
    let page = 0;

    if (this.searchResult && typeof index === 'number') {
      let totalCount = 0;

      for (const { page: _page, count } of this.searchResult) {
        if (index >= totalCount && index < totalCount + count) {
          page = Number(_page);

          return {
            index,
            indexInPage: index - totalCount,
            page,
          };
        }
        totalCount += count;
      }
    }

    return null;
  }

  private texts?: Record<number, string>;

  private readonly destroyController = new AbortController();

  public async init() {
    if (this.texts) {
      return;
    }

    when(
      () => Boolean(this.editor.doc),
      async () => {
        this.texts = await TextSearcher.extractText(this.editor.doc!);
      },
      { signal: this.destroyController.signal },
    );
  }

  @action
  public search() {
    if (!this.keyword) {
      this.searchResult = undefined;
      return;
    }

    assert(this.texts && typeof this.editor.currentPage === 'number');

    const result: PageSearchResult[] = [];
    const texts = this.isCurrentPageOnly ? pick(this.texts, [this.editor.currentPage]) : this.texts;

    for (const [page, text] of Object.entries(texts)) {
      let count = 0;
      let index: number | undefined;
      const digests: Digest[] = [];

      while (index !== -1) {
        index = text.indexOf(this.keyword, typeof index === 'number' ? index + this.keyword.length : undefined);

        if (index !== -1) {
          count += 1;

          const digest = extractDigest({
            fullText: text,
            matchIndex: index,
            maxLength: 100,
            prefixMaxLength: 30,
            matchLength: this.keyword.length,
          });

          if (digest) {
            digests.push(digest);
          }
        }
      }

      if (count > 0) {
        result.push({ page: Number(page), count, digests });
      }
    }

    this.searchResult = result;
    this.currentIndex = 0;
  }

  @action
  public reset() {
    this.currentIndex = undefined;
  }

  @action
  public goNext() {
    assert(typeof this.currentIndex === 'number' && this.currentIndex < this.searchResultCount - 1);
    this.currentIndex += 1;
  }

  @action
  public goPrevious() {
    assert(typeof this.currentIndex === 'number' && this.currentIndex > 0);
    this.currentIndex -= 1;
  }

  private static async extractText(doc: PDFDocumentProxy) {
    const pageToText: Record<number, string> = {};

    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();

      let text = '';

      for (const item of textContent.items) {
        if ('str' in item) {
          text += item.str;
        }
      }

      pageToText[pageNum] = text;
    }

    return pageToText;
  }

  public destroy() {
    this.destroyController.abort();
  }
}
