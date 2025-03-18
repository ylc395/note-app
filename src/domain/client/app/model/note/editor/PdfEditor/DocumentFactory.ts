import assert from 'assert';
import { observable, runInAction } from 'mobx';
import { getDocument, GlobalWorkerOptions, type PDFDocumentLoadingTask, type PDFDocumentProxy } from 'pdfjs-dist';
import { isEmpty } from 'lodash-es';
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

import type { NoteVO } from '#domain/shared/model/note';
import { getAppUrl, RouteTypes } from '#domain/shared/infra/url';

interface OutlineItem {
  title: string;
  children: OutlineItem[];
  key: string;
  dest: unknown; // 传给 pdfjs 的跳转函数用的，具体类型不明，我们也不用管
}

export default class DocumentFactory {
  private readonly loadingTasksMap: Record<NoteVO['id'], { activeCount: number; task: PDFDocumentLoadingTask }> = {};

  @observable.shallow private accessor outlinesMap: Record<NoteVO['id'], OutlineItem[]> = {};

  public async create({ noteId, blob }: { noteId: NoteVO['id']; blob: ArrayBuffer }) {
    if (!GlobalWorkerOptions.workerPort) {
      // 一个 worker 与一个 PDFWorker 一一对应
      // 多个 loadingTask（及其对应的 document） 可共用同一个 PDFWorker
      // pdfjs 内部逻辑：当全局上存在 worker，则后续都不会再新建 PDFWorker，而是复用该全局 worker 对应的 PDFWorker
      GlobalWorkerOptions.workerPort = new PdfJsWorker(); // 这里创建的是一个 worker，而非 PDFWorker
    }

    const task = (this.loadingTasksMap[noteId] ||= {
      task: getDocument({
        data: blob.slice(0),
        cMapUrl: import.meta.env.VITE_WEB_PLATFORM === 'electron' ? getAppUrl(RouteTypes.Static, 'cmaps/') : '',
      }),
      activeCount: 0,
    });

    task.activeCount += 1;
    const doc = await task.task.promise;

    this.initOutline({ doc, noteId });
    return doc;
  }

  private async initOutline({ noteId, doc }: { noteId: NoteVO['id']; doc: PDFDocumentProxy }) {
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
      this.outlinesMap[noteId] = items;
    });
  }

  public revoke(noteId: NoteVO['id']) {
    const task = this.loadingTasksMap[noteId];

    assert(task, 'invalid materialId');

    task.activeCount -= 1;

    if (task.activeCount === 0) {
      task.task.destroy();
      delete this.loadingTasksMap[noteId];
    }

    if (isEmpty(this.loadingTasksMap)) {
      GlobalWorkerOptions.workerPort?.terminate();
      GlobalWorkerOptions.workerPort = null;
    }
  }

  public getOutline(noteId: NoteVO['id']) {
    return this.outlinesMap[noteId];
  }
}
