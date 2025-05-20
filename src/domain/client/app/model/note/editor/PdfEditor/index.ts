import type { PDFDocumentProxy } from 'pdfjs-dist';
import { computed, observable, runInAction, when } from 'mobx';
import assert from 'assert';
import { z } from 'zod';

import container from '#utils/singletonContainer';
import { MimeTypes } from '#domain/shared/model/file';

import BaseEditor, { type Options } from '../BaseEditor';
import DocumentFactory from './DocumentFactory';
import OutlineList from './OutlineList';
import AnnotationList from './AnnotationList';

const uiStateSchema = z.object({
  hash: z.string().optional(),
  'annotation.panel': z.boolean().optional(),
  'annotation.native': z.boolean().optional(),
  'outline.expanded': z.string().array(),
  'outline.type': z.union([z.literal('text'), z.literal('image'), z.literal(null)]).optional(),
  'outline.scroll': z.object({ x: z.number(), y: z.number() }).optional(),
});

export type { OutlineItem } from './OutlineList';

export default class PdfEditor extends BaseEditor<z.infer<typeof uiStateSchema>> {
  constructor(options: Options) {
    super({
      ...options,
      uiState: {
        schema: uiStateSchema,
        defaultValue: { 'outline.expanded': [] },
      },
    });
    when(() => this.blob.result.isSuccess, this.init.bind(this), { signal: this.destroyController.signal });
  }

  @computed
  public get isReady() {
    return Boolean(this.uiState && this.doc);
  }

  private readonly docFactory = container.resolve(DocumentFactory);

  public readonly annotation = new AnnotationList(this.noteId);

  public readonly outline = new OutlineList(this.annotation);

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
