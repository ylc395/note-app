import type { PDFDocumentProxy } from 'pdfjs-dist';
import assert from 'assert';
import { action, computed, observable, reaction, when } from 'mobx';
import { debounce, pick, sumBy } from 'lodash-es';

import type PdfEditor from './index';
import { extractDigest } from '#utils/string';

export type Digest = NonNullable<ReturnType<typeof extractDigest>>;

export interface PageSearchResult {
  page: number;
  digests: Digest[];
}

export default class TextSearcher {
  constructor(private readonly editor: PdfEditor) {
    reaction(
      () => this.editor.textSearcher.current?.page,
      (page) => {
        if (typeof page === 'number' && page !== this.currentPage) {
          this.jumpTo?.(page);
        }
      },
      { signal: this.destroyController.signal },
    );

    when(
      () => Boolean(this.editor.doc),
      async () => {
        this.texts = await TextSearcher.extractText(this.editor.doc!);
      },
      { signal: this.destroyController.signal },
    );

    const handlePageChanged = debounce(() => {
      if (this.options.isCurrentPageOnly) {
        this.search();
      }
    }, 500);

    reaction(() => this.currentPage, handlePageChanged, { signal: this.destroyController.signal });
    this.destroyController.signal.addEventListener('abort', handlePageChanged.cancel);
  }

  private jumpTo?: (page: number) => void;

  @observable private accessor currentIndex: number | undefined;

  @computed
  public get currentPage() {
    return this.editor.currentPage;
  }

  @observable.ref public accessor searchResult: PageSearchResult[] | undefined;

  @computed
  public get searchResultCount() {
    if (!this.searchResult) {
      return 0;
    }

    return sumBy(this.searchResult, ({ digests }) => digests.length);
  }

  @observable public accessor options = {
    keyword: '',
    isCurrentPageOnly: false,
    isCaseSensitive: false,
  };

  @computed public get current() {
    const index = this.currentIndex;
    let page = 0;

    if (this.searchResult && typeof index === 'number') {
      let totalCount = 0;

      for (const { page: _page, digests } of this.searchResult) {
        const count = digests.length;
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

  public async init(params: { jumpTo: (page: number) => void }) {
    this.jumpTo = params.jumpTo;
  }

  @action
  public toggle(key: 'isCurrentPageOnly' | 'isCaseSensitive') {
    this.options[key] = !this.options[key];
    this.search();
  }

  @action
  public setKeyword(value: string) {
    this.options.keyword = value;

    if (value) {
      this.search();
    } else {
      this.searchResult = undefined;
      this.currentIndex = undefined;
    }
  }

  @action
  public search() {
    if (!this.options.keyword || typeof this.currentPage !== 'number') {
      return;
    }

    assert(this.texts && typeof this.editor.currentPage === 'number');

    const result: PageSearchResult[] = [];
    const texts = this.options.isCurrentPageOnly ? pick(this.texts, [this.editor.currentPage]) : this.texts;
    const keyword = this.options.isCaseSensitive ? this.options.keyword : this.options.keyword.toLocaleLowerCase();

    for (const [page, _text] of Object.entries(texts)) {
      let index: number | undefined;
      const digests: Digest[] = [];
      const text = this.options.isCaseSensitive ? _text : _text.toLocaleLowerCase();

      while (index !== -1) {
        index = text.indexOf(keyword, typeof index === 'number' ? index + keyword.length : undefined);

        if (index !== -1) {
          const digest = extractDigest({
            fullText: _text,
            matchIndex: index,
            maxLength: 100,
            prefixMaxLength: 30,
            matchLength: keyword.length,
          });

          if (digest) {
            digests.push(digest);
          }
        }
      }

      if (digests.length > 0) {
        result.push({ page: Number(page), digests });
      }
    }

    this.searchResult = result;

    if (this.options.isCurrentPageOnly) {
      this.currentIndex = 0;
      return;
    }

    const currentPageResultIndex = result.findIndex(({ page }) => page >= (this.currentPage ?? 0));

    if (currentPageResultIndex === -1 || typeof currentPageResultIndex !== 'number') {
      this.currentIndex = undefined;
      return;
    }

    this.currentIndex = sumBy(result.slice(0, currentPageResultIndex), ({ digests }) => digests.length);
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
