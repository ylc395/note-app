import { computed, makeObservable, observable, runInAction } from 'mobx';
import groupBy from 'lodash/groupBy';
import remove from 'lodash/remove';
import { type PDFDocumentLoadingTask, type PDFDocumentProxy, PDFWorker, getDocument } from 'pdfjs-dist';
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.js?worker';

import { EntityTypes } from 'interface/entity';
import {
  type EntityMaterialVO,
  type AnnotationVO,
  type HighlightVO,
  type AnnotationDTO,
  type HighlightAreaVO,
  normalizeTitle,
  AnnotationTypes,
} from 'interface/material';
import Editor from 'model/abstract/Editor';
import type Tile from 'model/workbench/Tile';

interface Entity {
  metadata: EntityMaterialVO;
  doc: PDFDocumentProxy;
}

export interface OutlineItem {
  title: string;
  children: OutlineItem[];
  key: string;
}

export enum HighlightColors {
  Yellow = '#2596be',
  Red = '#ef0005',
  Blue = '#0008ef',
  Purple = '#b000ef',
  Gray = '#a2a2a2',
}

export default class PdfEditor extends Editor<Entity> {
  constructor(tile: Tile, materialId: EntityMaterialVO['id']) {
    super(tile, materialId);
    makeObservable(this);
    this.init();
  }

  @observable.ref
  outline?: OutlineItem[];

  private loadingTask?: PDFDocumentLoadingTask;

  @observable
  readonly outlinePageNumberMap: Record<string, number> = {};

  readonly entityType = EntityTypes.Material;

  @observable
  private readonly annotations: AnnotationVO[] = [];

  @computed
  get highlights() {
    return this.annotations
      .map(({ annotation, type, ...attr }) => {
        if (type === AnnotationTypes.Highlight) {
          const pages = annotation.fragments.map(({ page }) => page);

          return { ...attr, annotation, type, startPage: Math.min(...pages), endPage: Math.max(...pages) };
        }

        if (type === AnnotationTypes.HighlightArea) {
          return { ...attr, annotation, type, startPage: annotation.page, endPage: annotation.page };
        }

        throw new Error('invalid type');
      })
      .sort(({ startPage: startPage1 }, { startPage: startPage2 }) => startPage1 - startPage2);
  }

  @computed
  get breadcrumbs() {
    return [];
  }

  private async init() {
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
  get tabView() {
    return {
      title: this.entity ? normalizeTitle(this.entity.metadata) : '',
      icon: this.entity?.metadata.icon || null,
    };
  }

  async createAnnotation(annotation: AnnotationDTO) {
    const { body: createdAnnotation } = await this.remote.post<AnnotationDTO, AnnotationVO>(
      `/materials/${this.entityId}/annotations`,
      annotation,
    );

    runInAction(() => {
      this.annotations.push(createdAnnotation);
    });
  }

  @computed
  get highlightFragmentsByPage() {
    const highlights = this.annotations
      .filter(({ type }) => type === AnnotationTypes.Highlight)
      .map(({ annotation, id }) => ({ ...(annotation as HighlightVO), annotationId: id }));

    const fragments = highlights.flatMap(({ fragments, color, annotationId }) => {
      return fragments.map(({ page, rect }) => ({
        annotationId,
        page,
        rect,
        color,
        highlightId: `${annotationId}-${JSON.stringify(rect)}`,
      }));
    });

    return groupBy(fragments, 'page');
  }

  @computed
  get highlightAreasByPage() {
    const highlightAreas = this.annotations
      .filter(({ type }) => type === AnnotationTypes.HighlightArea)
      .map(({ annotation, id }) => ({ ...(annotation as HighlightAreaVO), id }));

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outlineDestsMap: Record<string, any> = {};
    const toOutlineItem = ({ items, dest, title }: RawOutlineItem, keys: number[]): OutlineItem => {
      const key = keys.join('-');
      outlineDestsMap[key] = dest;

      return {
        children: items.map((item, i) => toOutlineItem(item, [...keys, i])),
        title,
        key,
      };
    };

    const items = outline?.map((item, i) => toOutlineItem(item, [i])) || [];

    runInAction(() => {
      this.outline = items;
    });

    for (const [key, dest] of Object.entries(outlineDestsMap)) {
      if (dest?.[0]) {
        const index = await doc.getPageIndex(dest[0]);
        runInAction(() => {
          this.outlinePageNumberMap[key] = index + 1;
        });
      }
    }
  }
}
