import type { PDFDocumentProxy } from 'pdfjs-dist';
import { action, computed, observable, when } from 'mobx';
import assert from 'assert';
import { flow, isObject } from 'lodash-es';
import { z } from 'zod';

import type { AnnotationVO } from '#domain/shared/model/annotation';
import { container } from '#domain/shared/infra/singletons';
import { MimeTypes } from '#domain/shared/model/file';

import BaseEditor, { type Options } from '../BaseEditor';
import DocumentFactory from './DocumentFactory';

interface Viewer {
  init: (doc: PDFDocumentProxy) => void;
  destroy: () => void;
}

export enum Panels {
  Outline,
  AnnotationList,
}

const uiStateSchema = z.object({
  titleSelection: z.tuple([z.number(), z.number()]).optional(),
  bodySelection: z.tuple([z.number(), z.number()]).optional(),
  scrollTop: z.number().optional(),
});

export default class PdfEditor extends BaseEditor<z.infer<typeof uiStateSchema>> {
  constructor(options: Options) {
    super({ ...options, uiStateSchema });
    when(() => this.blob.result.isSuccess, this.init.bind(this), { signal: this.destroyController.signal });
  }

  private readonly docFactory = container.resolve(DocumentFactory);

  private doc?: PDFDocumentProxy; // this is view-independent

  public override readonly mimeType = MimeTypes.PDF;

  @observable.ref public accessor viewer: Viewer | undefined;

  private async init() {
    assert(this.blob.result.data);

    const doc = await this.docFactory.create({
      noteId: this.entityId,
      blob: this.blob.result.data,
    });

    this.doc = doc;
  }

  private disposeViewer?: () => void;

  public setViewer(viewer: NonNullable<PdfEditor['viewer']>) {
    this.viewer = viewer;

    const stopInitializing = when(
      () => Boolean(this.doc),
      () => viewer.init(this.doc!),
    );

    this.disposeViewer = flow([stopInitializing, viewer.destroy.bind(viewer)]);
  }

  @action
  public togglePanel(panel: Panels) {
    this.panelsVisibility[panel] = !this.panelsVisibility[panel];
  }

  @observable
  public accessor panelsVisibility = {
    [Panels.Outline]: false,
    [Panels.AnnotationList]: true,
  };

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
    this.disposeViewer?.();
    this.docFactory.revoke(this.entityId);
  }
}
