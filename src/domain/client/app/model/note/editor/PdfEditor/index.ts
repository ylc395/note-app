import type { PDFDocumentProxy } from 'pdfjs-dist';
import { computed, observable, runInAction, when } from 'mobx';
import assert from 'assert';

import container from '#utils/singletonContainer';
import { MimeTypes } from '#domain/shared/model/file';

import BaseEditor, { type Options } from '../BaseEditor';
import DocumentFactory from './DocumentFactory';
import OutlineList from './OutlineList';
import AnnotationManager from './AnnotationManager';
import TextFinder from './TextFinder';

export type { OutlineItem } from './OutlineList';

export default class PdfEditor extends BaseEditor {
  constructor(options: Options) {
    super(options);
    when(() => this.blob.result.isSuccess, this.init.bind(this), { signal: this.destroyController.signal });
  }

  @computed
  public get isReady() {
    return Boolean(this.doc);
  }

  private readonly docFactory = container.resolve(DocumentFactory);

  public readonly annotation = new AnnotationManager(this.noteId);

  public readonly outline = new OutlineList(this.noteId, this.annotation);

  public readonly textFinder = new TextFinder();

  @observable.ref public accessor doc: PDFDocumentProxy | undefined; // this is view-independent

  public override readonly mimeType = MimeTypes.PDF;

  public texts?: Record<number, string>;

  private async init() {
    assert(this.blob.result.data);

    const doc = await this.docFactory.create({
      noteId: this.noteId,
      blob: this.blob.result.data,
    });

    this.annotation.init(doc);

    runInAction(() => {
      this.doc = doc;
    });

    this.texts = await PdfEditor.extractTexts(doc);
  }

  public override destroy() {
    super.destroy();
    this.docFactory.revoke(this.noteId);
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
