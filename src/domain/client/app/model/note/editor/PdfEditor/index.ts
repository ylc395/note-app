import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { RefProxy } from 'pdfjs-dist/types/src/display/api';
import { action, observable, runInAction, when } from 'mobx';
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
  annotationPanel: z.boolean().optional(),
  'outline.expanded': z.string().array().optional(),
  'outline.type': z.union([z.literal('text'), z.literal('image'), z.literal(null)]).optional(),
  'outline.scroll': z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
});

export interface OutlineItem {
  title: string;
  children: OutlineItem[];
  key: string;
  dest: unknown[] | null | string; // 传给 pdfjs 的跳转函数用的，具体类型不明，我们也不用管
}

export default class PdfEditor extends BaseEditor<z.infer<typeof uiStateSchema>> {
  constructor(options: Options) {
    super({ ...options, uiStateSchema });
    when(() => this.blob.result.isSuccess, this.init.bind(this), { signal: this.destroyController.signal });
  }

  private readonly docFactory = container.resolve(DocumentFactory);

  @observable.ref public accessor doc: PDFDocumentProxy | undefined; // this is view-independent

  public override readonly mimeType = MimeTypes.PDF;

  @observable.ref public accessor outlines: OutlineItem[] | undefined;

  private readonly outlineItemsMap = new Map<number, OutlineItem>();

  @observable public accessor focusedOutlineItemKey: OutlineItem['key'] | undefined;

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

  @action.bound
  public focusOutlineItem(page: number) {
    if (this.outlineItemsMap.size === 0) {
      return;
    }

    for (let i = page; i >= 0; i--) {
      const item = this.outlineItemsMap.get(i);

      if (item) {
        this.focusedOutlineItemKey = item.key;
        return;
      }
    }

    this.focusedOutlineItemKey = undefined;
  }

  public async initOutline() {
    if (this.outlines) {
      return;
    }

    const doc = this.doc;
    assert(doc);

    const outline = await doc.getOutline();

    type RawOutlineItem = { title: string; items: RawOutlineItem[]; dest: string | unknown[] | null };

    const toOutlineItem = ({ items, dest, title }: RawOutlineItem, keys: number[]): OutlineItem => {
      const page = Array.isArray(dest) && dest[0] ? doc.cachedPageNumber(dest[0] as RefProxy) : null;
      const item = {
        children: items.map((item, i) => toOutlineItem(item, [...keys, i])),
        title,
        key: keys.join('-'),
        dest,
      };

      if (page) {
        this.outlineItemsMap.set(page, item);
      }

      return item;
    };

    const items = outline?.map((item, i) => toOutlineItem(item, [i])) || [];

    runInAction(() => {
      this.outlines = items;
    });
  }
}
