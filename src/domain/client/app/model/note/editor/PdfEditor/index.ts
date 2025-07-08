import type { PDFDocumentProxy } from 'pdfjs-dist';
import { computed, observable, runInAction, when } from 'mobx';
import assert from 'assert';

import container from '#utils/singletonContainer';
import { MimeTypes, type TextLocation } from '#domain/shared/model/file';

import BaseEditor, { type Options } from '../BaseEditor';
import DocumentFactory from './DocumentFactory';
import OutlineList from './OutlineList';
import AnnotationManager from './AnnotationManager';
import TextFinder from './TextFinder';
import { createQuery } from 'mobx-tanstack-query/preset';

export type { OutlineItem } from './OutlineList';

export default class PdfEditor extends BaseEditor {
  constructor(options: Options) {
    super(options);
    when(() => this.blob.result.isSuccess, this.init.bind(this), { signal: this.destroyController.signal });
  }

  @computed
  public get isReady() {
    return Boolean(this.doc) && this.texts.result.isSuccess;
  }

  private readonly docFactory = container.resolve(DocumentFactory);

  public readonly annotation = new AnnotationManager(this.noteId);

  public readonly outline = new OutlineList(this.noteId, this.annotation);

  public readonly textFinder = new TextFinder(this);

  @observable.ref public accessor doc: PDFDocumentProxy | undefined; // this is view-independent

  public override readonly mimeType = MimeTypes.PDF;

  public readonly texts = createQuery(
    () => {
      assert(this.doc);
      return PdfEditor.extractTexts(this.doc);
    },
    {
      queryKey: ['pdf-texts', this.noteId],
      options: () => ({ enabled: Boolean(this.doc) }),
    },
  );

  @observable
  public accessor pageTexts = new Map<number, TextLocation>();

  private readonly loadingPageTexts = new Set<number>();

  public async initPageTexts(pages: number[]) {
    const texts = this.texts.result.data;
    assert(texts);

    const pagesToQuery = pages.filter(
      (page) => !this.pageTexts.has(page) && !texts[page] && !this.loadingPageTexts.has(page),
    );

    if (pagesToQuery.length === 0) {
      return;
    }

    for (const page of pagesToQuery) {
      this.loadingPageTexts.add(page);
    }

    const pageTexts = await this.remote.note.queryFileTextRecord.query({ id: this.noteId, pages: pagesToQuery });

    for (const page of pagesToQuery) {
      this.loadingPageTexts.delete(page);
    }

    runInAction(() => {
      for (const location of pageTexts) {
        assert(location.page);
        this.pageTexts.set(location.page, location);
      }
    });
  }

  private async init() {
    assert(this.blob.result.data);

    const doc = await this.docFactory.create({
      noteId: this.noteId,
      blob: this.blob.result.data,
    });

    runInAction(() => {
      this.doc = doc;
    });
  }

  public override destroy() {
    super.destroy();
    this.docFactory.revoke(this.noteId);
    this.textFinder.destroy();
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
