import { makeObservable, observable, runInAction } from 'mobx';
import assert from 'assert';
import { type PDFDocumentLoadingTask, type PDFDocumentProxy, getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import dayjs from 'dayjs';
import { mapValues } from 'lodash-es';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.js?worker';

import type { EntityMaterialVO } from '@shared/domain/model/material';
import { SelectorTypes, type AnnotationVO, type FragmentSelector } from '@shared/domain/model/annotation';
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
    this.initNativeAnnotations(doc);
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

  private async initNativeAnnotations(doc: PDFDocumentProxy) {
    const result: AnnotationVO[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const annotations = (await page.getAnnotations()).filter((annotation) => {
        // see `AnnotationType` in pdfjs
        return annotation.annotationType !== 2 && !(annotation.annotationType === 16 && !annotation.contentsObj.str);
      });

      if (annotations.length === 0) {
        continue;
      }

      for (const annotation of annotations) {
        const updatedAt = dayjs(annotation.modificationDate.slice(2, 16), 'YYYYMMDDHHmmss').valueOf();
        const createdAt = annotation.creationDate
          ? dayjs(annotation.creationDate.slice(2, 16), 'YYYYMMDDHHmmss').valueOf()
          : updatedAt;

        console.log(page.pageNumber, annotation, annotation.rect);

        result.push({
          id: annotation.id,
          targetId: this.entityLocator.entityId,
          targetText: null,
          body: annotation.contentsObj.str,
          updatedAt,
          createdAt,
          color: `rgb(${Array.from(annotation.color).join(',')})`,
          selectors: [
            {
              type: SelectorTypes.Fragment,
              value: `page=${page.pageNumber}&viewrect=${annotation.rect.join(',')}`, // rect is not important. just put a random rect here
            },
          ],
        });
      }
    }

    runInAction(() => {
      this.nativeAnnotations = result;
    });
  }

  public static parseFragment(fragment: FragmentSelector['value']) {
    const query = new URLSearchParams(fragment);
    const highlight = query.get('highlight');
    const viewrect = query.get('viewrect');
    const page = Number(query.get('page'));

    if (highlight) {
      const [left, right, top, bottom] = highlight.split(',');
      return { page, highlight: mapValues({ left, right, top, bottom }, Number) };
    }

    if (viewrect) {
      const [left, top, width, height] = viewrect.split(',');
      return { page, viewrect: mapValues({ left, top, height, width }, Number) };
    }

    assert.fail('invalid fragment');
  }

  private static activeCount = 0;
}
