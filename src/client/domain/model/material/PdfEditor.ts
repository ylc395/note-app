import { computed, makeObservable, observable, runInAction } from 'mobx';
import groupBy from 'lodash/groupBy';
import { type PDFDocumentLoadingTask, type PDFDocumentProxy, PDFWorker, getDocument } from 'pdfjs-dist';
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.js?worker';
import type { RefProxy } from 'pdfjs-dist/types/src/display/api';

import {
  type EntityMaterialVO,
  type PdfRangeAnnotationVO,
  type PdfAreaAnnotationVO,
  AnnotationTypes,
} from 'interface/material';
import type Tile from 'model/workbench/Tile';
import Editor from './Editor';

interface Pdf {
  metadata: EntityMaterialVO;
  doc: PDFDocumentProxy;
}

export interface OutlineItem {
  title: string;
  children: OutlineItem[];
  key: string;
}

function getDefaultState() {
  return { pageNumber: 0 };
}

type State = ReturnType<typeof getDefaultState>;

export default class PdfEditor extends Editor<Pdf, State> {
  constructor(tile: Tile, materialId: EntityMaterialVO['id']) {
    super(tile, materialId, getDefaultState());
    makeObservable(this);
  }

  @observable.ref
  outline?: OutlineItem[];

  private loadingTask?: PDFDocumentLoadingTask;
  readonly outlinePageNumberMap: Record<string, number> = {};

  @computed
  get pdfAnnotations() {
    return this.annotations
      .map((annotation) => {
        if (annotation.type === AnnotationTypes.PdfRange) {
          const pages = annotation.fragments.map(({ page }) => page);

          return { ...annotation, startPage: Math.min(...pages), endPage: Math.max(...pages) };
        }

        if (annotation.type === AnnotationTypes.PdfArea) {
          return { ...annotation, startPage: annotation.page, endPage: annotation.page };
        }

        throw new Error('invalid type');
      })
      .sort(({ startPage: startPage1 }, { startPage: startPage2 }) => startPage1 - startPage2);
  }

  protected async init() {
    const [{ body: metadata }, { body: blob }] = await Promise.all([
      this.remote.get<void, EntityMaterialVO>(`/materials/${this.entityId}`),
      this.remote.get<void, ArrayBuffer>(`/materials/${this.entityId}/blob`),
    ]);

    this.loadingTask = getDocument({ data: blob.slice(0), worker: new PDFWorker({ port: new PdfJsWorker() }) });
    const doc = await this.loadingTask.promise;

    this.load({ metadata, doc });
    this.initOutline(doc);
  }

  @computed
  get fragmentsByPage() {
    const annotations = this.annotations.filter(
      ({ type }) => type === AnnotationTypes.PdfRange,
    ) as PdfRangeAnnotationVO[];

    const fragments = annotations.flatMap(({ fragments, color, id }) => {
      return fragments.map(({ page, rect }) => ({
        annotationId: id,
        page,
        rect,
        color,
        fragmentId: `${id}-${JSON.stringify(rect)}`,
      }));
    });

    return groupBy(fragments, 'page');
  }

  @computed
  get areaAnnotationsByPage() {
    const areas = this.annotations.filter(({ type }) => type === AnnotationTypes.PdfArea) as PdfAreaAnnotationVO[];

    return groupBy(areas, 'page');
  }

  destroy() {
    super.destroy();
    this.loadingTask?.destroy();
  }

  private async initOutline(doc: PDFDocumentProxy) {
    const outline = await doc.getOutline();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type RawOutlineItem = { title: string; items: RawOutlineItem[]; dest: any };
    const pageRefsMap: Record<string, RefProxy> = {};
    const toOutlineItem = ({ items, dest, title }: RawOutlineItem, keys: number[]): OutlineItem => {
      const key = keys.join('-');

      if (dest?.[0]) {
        pageRefsMap[key] = dest[0];
      }

      return {
        children: items.map((item, i) => toOutlineItem(item, [...keys, i])),
        title,
        key,
      };
    };

    const items = outline?.map((item, i) => toOutlineItem(item, [i])) || [];

    for (const [key, ref] of Object.entries(pageRefsMap)) {
      const index = await doc.getPageIndex(ref);
      this.outlinePageNumberMap[key] = index + 1;
    }

    runInAction(() => {
      this.outline = items;
    });
  }
}
