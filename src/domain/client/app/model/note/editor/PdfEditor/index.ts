import type { PDFDocumentProxy } from 'pdfjs-dist';
import { computed, observable, runInAction, when } from 'mobx';
import assert from 'assert';
import { isObject } from 'lodash-es';
import { z } from 'zod';

import type { AnnotationVO } from '#domain/shared/model/annotation';
import { container } from '#domain/shared/infra/singletons';
import { MimeTypes } from '#domain/shared/model/file';

import BaseEditor, { type Options } from '../BaseEditor';
import DocumentFactory from './DocumentFactory';

const uiStateSchema = z.object({
  hash: z.string().optional(),
  expandedOutlineItems: z.string().array().optional(),
  outlinePanel: z.union([z.literal('text'), z.literal('image'), z.literal(null)]).optional(),
  annotationPanel: z.boolean().optional(),
});

export default class PdfEditor extends BaseEditor<z.infer<typeof uiStateSchema>> {
  constructor(options: Options) {
    super({ ...options, uiStateSchema });
    when(() => this.blob.result.isSuccess, this.init.bind(this), { signal: this.destroyController.signal });
  }

  private readonly docFactory = container.resolve(DocumentFactory);

  @observable.ref public accessor doc: PDFDocumentProxy | undefined; // this is view-independent

  public override readonly mimeType = MimeTypes.PDF;

  private async init() {
    assert(this.blob.result.data);

    const doc = await this.docFactory.create({
      noteId: this.entityId,
      blob: this.blob.result.data,
    });

    runInAction(() => {
      this.doc = doc;
    });
  }

  @computed
  public get outlines() {
    return this.docFactory.getOutline(this.entityId);
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
    this.docFactory.revoke(this.entityId);
  }
}
