import { makeObservable, observable, runInAction } from 'mobx';
import assert from 'assert';
import { type PDFDocumentLoadingTask, type PDFDocumentProxy, getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import dayjs from 'dayjs';
import { mapValues } from 'lodash-es';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.js?worker';

import type { EntityMaterialVO } from '@shared/domain/model/material';
import type { AnnotationVO, FragmentSelector } from '@shared/domain/model/annotation';
import type { Tile } from '@domain/app/model/workbench';
import EditableMaterial from './EditableMaterial';
import PdfEditor from '../editor/PdfEditor';

export interface OutlineItem {
  title: string;
  children: OutlineItem[];
  key: string;
}

dayjs.extend(customParseFormat);

export default class EditablePdf extends EditableMaterial {
  constructor(materialId: EntityMaterialVO['id']) {
    super(materialId);
    makeObservable(this);
  }

  @observable.ref public outline?: OutlineItem[];
  @observable.ref public nativeAnnotations?: AnnotationVO[];
  private loadingTask?: PDFDocumentLoadingTask;
  private readonly outlineDestMap: Record<string, unknown> = {};

  public getOutlineDest(key: string) {
    return this.outlineDestMap[key];
  }

  @observable.ref public doc?: PDFDocumentProxy; // this is view-independent

  public createEditor(tile: Tile) {
    return new PdfEditor(this, tile);
  }

  protected async load() {
    await super.load();
    assert(this.blob);

    if (!GlobalWorkerOptions.workerPort) {
      // every PDFWorker will share one web worker when we do this
      GlobalWorkerOptions.workerPort = new PdfJsWorker();
    }
    this.loadingTask = getDocument(this.blob.slice(0));
    const doc = await this.loadingTask.promise;
    EditablePdf.activeCount += 1;

    runInAction(() => {
      this.doc = doc;
    });

    this.initOutline(doc);
  }

  public async destroy() {
    EditablePdf.activeCount -= 1;
    await this.loadingTask?.destroy();

    runInAction(() => {
      this.doc = undefined;
    });

    if (EditablePdf.activeCount === 0) {
      GlobalWorkerOptions.workerPort?.terminate();
      GlobalWorkerOptions.workerPort = null;
    }
  }

  private async initOutline(doc: PDFDocumentProxy) {
    const outline: Awaited<ReturnType<PDFDocumentProxy['getOutline']>> | undefined = await doc.getOutline();
    type RawOutlineItem = { title: string; items: RawOutlineItem[]; dest: unknown };

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

    runInAction(() => {
      const items = outline?.map((item, i) => toOutlineItem(item, [i])) || [];
      this.outline = items;
    });
  }

  public static parseFragment(fragment: FragmentSelector['value']) {
    const query = new URLSearchParams(fragment);
    const highlight = query.get('highlight');
    const page = Number(query.get('page'));
    assert(highlight);

    const [left, right, top, bottom] = highlight.split(',');
    return { page, highlight: mapValues({ left, right, top, bottom }, Number) };
  }

  private static activeCount = 0;
}
