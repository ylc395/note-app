import { computed, observable, runInAction } from 'mobx';
import assert from 'assert';
import { type PDFDocumentLoadingTask, type PDFDocumentProxy, getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

import type { AnnotationVO } from '#domain/shared/model/annotation';
import EditableMaterial from './EditableMaterial';

export interface OutlineItem {
  title: string;
  children: OutlineItem[];
  key: string;
  dest: unknown; // 传给 pdfjs 的跳转函数用的，具体类型不明，我们也不用管
}

export default class EditablePdf extends EditableMaterial {
  @observable.ref public outline?: OutlineItem[];
  @observable.ref public nativeAnnotations?: AnnotationVO[];
  private loadingTask?: PDFDocumentLoadingTask;

  @observable.ref public doc?: PDFDocumentProxy; // this is view-independent

  @computed
  public get annotations() {
    return super.annotations.toSorted(({ selectors: selectors1 }, { selectors: selectors2 }) => {
      const firstSelector1 = selectors1[0];
      const firstSelector2 = selectors2[0];

      if (firstSelector1 && 'page' in firstSelector1 && firstSelector2 && 'page' in firstSelector2) {
        return Number(firstSelector1.page) - Number(firstSelector2.page);
      }

      return 0;
    });
  }

  protected async _load(abortSignal: AbortController['signal']) {
    EditablePdf.activeCount += 1;

    await super._load(abortSignal);
    assert(this.blob);

    if (!GlobalWorkerOptions.workerPort) {
      // 一个 worker 与一个 PDFWorker 一一对应
      // 多个 loadingTask（及其对应的 document） 可共用同一个 PDFWorker
      // pdfjs 内部逻辑：当全局上存在 worker，则后续都不会再新建 PDFWorker，而是复用该全局 worker 对应的 PDFWorker
      GlobalWorkerOptions.workerPort = new PdfJsWorker(); // 这里创建的是一个 worker，而非 PDFWorker
    }

    this.loadingTask = getDocument(this.blob.slice(0));

    const doc = await this.loadingTask.promise;
    this.loadingTask = undefined;

    runInAction(() => {
      this.doc = doc;
    });
    this.initOutline(doc);
  }

  public async destroy() {
    super.destroy();
    EditablePdf.activeCount -= 1;

    await this.loadingTask?.destroy();

    if (EditablePdf.activeCount === 0) {
      GlobalWorkerOptions.workerPort?.terminate();
      GlobalWorkerOptions.workerPort = null;
    }

    runInAction(() => {
      this.doc = undefined;
    });
  }

  private async initOutline(doc: PDFDocumentProxy) {
    const outline: Awaited<ReturnType<PDFDocumentProxy['getOutline']>> | undefined = await doc.getOutline();
    type RawOutlineItem = { title: string; items: RawOutlineItem[]; dest: unknown };

    const toOutlineItem = ({ items, dest, title }: RawOutlineItem, keys: number[]): OutlineItem => {
      return {
        children: items.map((item, i) => toOutlineItem(item, [...keys, i])),
        title,
        key: keys.join('-'),
        dest,
      };
    };

    runInAction(() => {
      const items = outline?.map((item, i) => toOutlineItem(item, [i])) || [];
      this.outline = items;
    });
  }

  private static activeCount = 0;
}
