import { computed, makeObservable, observable, runInAction } from 'mobx';
import { groupBy } from 'lodash-es';
import { type PDFDocumentLoadingTask, type PDFDocumentProxy, getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.js?worker';

import {
  type MaterialEntityVO,
  type PdfRangeAnnotationVO,
  type PdfAreaAnnotationVO,
  AnnotationTypes,
} from '@shared/domain/model/material';
import type { Tile } from '@domain/app/model/workbench';
import EditableMaterial from './EditableMaterial';
import PdfEditor from '../editor/PdfEditor';

interface Pdf {
  metadata: MaterialEntityVO;
  doc: PDFDocumentProxy;
}

export interface OutlineItem {
  title: string;
  children: OutlineItem[];
  key: string;
}

export default class EditablePdf extends EditableMaterial<Pdf> {
  constructor(materialId: MaterialEntityVO['id']) {
    super(materialId);
    makeObservable(this);
  }

  @observable.ref outline?: OutlineItem[];
  private loadingTask?: PDFDocumentLoadingTask;
  readonly outlineDestMap: Record<string, unknown> = {};

  protected getEditor(tile: Tile) {
    return new PdfEditor(this, tile);
  }

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

  async load() {
    EditablePdf.activeCount += 1;

    if (!GlobalWorkerOptions.workerPort) {
      // every PDFWorker will share one web worker when we do this
      GlobalWorkerOptions.workerPort = new PdfJsWorker();
    }

    const [{ body: metadata }, { body: blob }] = await Promise.all([
      this.remote.get<void, MaterialEntityVO>(`/materials/${this.entityId}`),
      this.remote.get<void, ArrayBuffer>(`/materials/${this.entityId}/blob`),
    ]);

    this.loadingTask = getDocument(blob.slice(0));
    const doc = await this.loadingTask.promise;

    runInAction(() => (this.entity = { metadata, doc }));
    this.initOutline(doc);
  }

  @computed
  get fragmentsByPage() {
    const annotations = this.annotations.filter(
      ({ type }) => type === AnnotationTypes.PdfRange,
    ) as PdfRangeAnnotationVO[];

    const fragments = annotations.flatMap(({ fragments, color, id }) => {
      return fragments.map(({ page, rect }, i) => ({
        annotationId: id,
        page,
        rect,
        color,
        fragmentId: `${id}-${JSON.stringify(rect)}`,
        isLast: i === fragments.length - 1,
      }));
    });

    return groupBy(fragments, 'page');
  }

  @computed
  get areaAnnotationsByPage() {
    const areas = this.annotations.filter(({ type }) => type === AnnotationTypes.PdfArea) as PdfAreaAnnotationVO[];

    return groupBy(areas, 'page');
  }

  async destroy() {
    super.destroy();

    EditablePdf.activeCount -= 1;
    await this.loadingTask?.destroy();

    if (EditablePdf.activeCount === 0) {
      GlobalWorkerOptions.workerPort?.terminate();
      GlobalWorkerOptions.workerPort = null;
    }
  }

  private async initOutline(doc: PDFDocumentProxy) {
    const outline = await doc.getOutline();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type RawOutlineItem = { title: string; items: RawOutlineItem[]; dest: any };
    const toOutlineItem = ({ items, dest, title }: RawOutlineItem, keys: number[]): OutlineItem => {
      const key = keys.join('-');

      if (dest) {
        this.outlineDestMap[key] = dest;
      }

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
  }

  private static activeCount = 0;
}
