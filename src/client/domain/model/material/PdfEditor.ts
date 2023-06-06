import { computed, makeObservable, observable, runInAction } from 'mobx';
import groupBy from 'lodash/groupBy';
import remove from 'lodash/remove';
import { type PDFDocumentLoadingTask, type PDFDocumentProxy, PDFWorker, getDocument } from 'pdfjs-dist';
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.js?worker';
import type { RefProxy } from 'pdfjs-dist/types/src/display/api';

import {
  type EntityMaterialVO,
  type AnnotationVO,
  AnnotationTypes,
  HighlightAnnotationVO,
  HighlightAreaAnnotationVO,
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

export default class PdfEditor extends Editor<Pdf> {
  constructor(tile: Tile, materialId: EntityMaterialVO['id']) {
    super(tile, materialId);
    makeObservable(this);
  }

  @observable.ref
  outline?: OutlineItem[];

  private loadingTask?: PDFDocumentLoadingTask;

  readonly outlinePageNumberMap: Record<string, number> = {};

  @computed
  get highlights() {
    return this.annotations
      .map((annotation) => {
        if (annotation.type === AnnotationTypes.Highlight) {
          const pages = annotation.fragments.map(({ page }) => page);

          return { ...annotation, startPage: Math.min(...pages), endPage: Math.max(...pages) };
        }

        if (annotation.type === AnnotationTypes.HighlightArea) {
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

    const { body: annotations } = await this.remote.get<unknown, AnnotationVO[]>(
      `/materials/${this.entityId}/annotations`,
    );

    runInAction(() => {
      this.annotations.push(...annotations);
    });
  }

  @computed
  get highlightFragmentsByPage() {
    const highlights = this.annotations.filter(
      ({ type }) => type === AnnotationTypes.Highlight,
    ) as HighlightAnnotationVO[];

    const fragments = highlights.flatMap(({ fragments, color, id }) => {
      return fragments.map(({ page, rect }) => ({
        annotationId: id,
        page,
        rect,
        color,
        highlightId: `${id}-${JSON.stringify(rect)}`,
      }));
    });

    return groupBy(fragments, 'page');
  }

  @computed
  get highlightAreasByPage() {
    const highlightAreas = this.annotations.filter(
      ({ type }) => type === AnnotationTypes.HighlightArea,
    ) as HighlightAreaAnnotationVO[];

    return groupBy(highlightAreas, 'page');
  }

  async removeAnnotation(id: AnnotationVO['id']) {
    await this.remote.delete(`/materials/annotations/${id}`);
    runInAction(() => {
      remove(this.annotations, ({ id: _id }) => _id === id);
    });
  }

  async updateAnnotation(id: AnnotationVO['id'], patch: Record<string, unknown>) {
    const { body: annotation } = await this.remote.patch<Record<string, unknown>, AnnotationVO>(
      `/materials/annotations/${id}`,
      patch,
    );

    runInAction(() => {
      const index = this.annotations.findIndex(({ id: _id }) => _id === id);

      if (index < 0) {
        throw new Error('no annotation');
      }

      this.annotations[index] = annotation;
    });
  }

  getAnnotationById(id: AnnotationVO['id']) {
    const annotation = this.annotations.find(({ id: _id }) => _id === id);

    if (!annotation) {
      throw new Error('invalid id');
    }

    return annotation;
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
