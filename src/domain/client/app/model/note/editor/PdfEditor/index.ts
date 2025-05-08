import type { PDFDocumentProxy } from 'pdfjs-dist';
import { observable, runInAction, when } from 'mobx';
import assert from 'assert';
import { isObject } from 'lodash-es';
import { z } from 'zod';

import type { AnnotationVO } from '#domain/shared/model/annotation';
import container from '#utils/singletonContainer';
import { MimeTypes } from '#domain/shared/model/file';

import BaseEditor, { type Options } from '../BaseEditor';
import DocumentFactory from './DocumentFactory';
import OutlineList from './OutlineList';
import AnnotationManager from './AnnotationManager';

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

  private readonly docFactory = container.resolve(DocumentFactory);

  public readonly outline = new OutlineList();

  public readonly annotation = new AnnotationManager(this.noteId);

  @observable.ref public accessor doc: PDFDocumentProxy | undefined; // this is view-independent

  public override readonly mimeType = MimeTypes.PDF;

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
  }

  protected sortAnnotations(annotation1: AnnotationVO, annotation2: AnnotationVO) {
    const first1 = annotation1.selectors[0];
    const first2 = annotation2.selectors[0];

    if (isObject(first1) && isObject(first2) && 'page' in first1 && 'page' in first2) {
      return Number(first1.page) - Number(first2.page);
    }

    return 0;
  }

  public override destroy() {
    super.destroy();
    this.docFactory.revoke(this.noteId);
  }
}
