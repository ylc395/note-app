import { action } from 'mobx';
import { getDocument, GlobalWorkerOptions, type PDFDocumentLoadingTask } from 'pdfjs-dist';
import { isEmpty } from 'lodash-es';
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

import type { NoteVO } from '#domain/shared/model/note';
import { getAppUrl, RouteTypes } from '#domain/shared/infra/url';

export default class DocumentFactory {
  private readonly loadingTasksMap: Record<NoteVO['id'], { activeCount: number; task: PDFDocumentLoadingTask }> = {};

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

    return doc;
  }

  @action
  public revoke(noteId: NoteVO['id']) {
    const task = this.loadingTasksMap[noteId];

    if (!task) {
      return;
    }

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
}
