import { action } from 'mobx';
import { getDocument, GlobalWorkerOptions, type PDFDocumentLoadingTask } from 'pdfjs-dist';
import { isEmpty } from 'lodash-es';
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';
import assert from 'assert';

import { IS_DEV } from '#domain/shared/infra/env';
import { getAppUrl, RouteTypes } from '#domain/shared/infra/url';

export default class PDFDocumentFactory {
  private readonly loadingTasksMap: Record<string, { activeCount: number; task: PDFDocumentLoadingTask }> = {};

  public async create({ key, blob }: { key: string; blob: ArrayBuffer }) {
    if (!GlobalWorkerOptions.workerPort) {
      // 一个 worker 与一个 PDFWorker 一一对应
      // 多个 loadingTask（及其对应的 document） 可共用同一个 PDFWorker
      // pdfjs 内部逻辑：当全局上存在 worker，则后续都不会再新建 PDFWorker，而是复用该全局 worker 对应的 PDFWorker
      GlobalWorkerOptions.workerPort = new PdfJsWorker(); // 这里创建的是一个 worker，而非 PDFWorker
    }

    const task = (this.loadingTasksMap[key] ||= {
      task: getDocument({
        data: blob.slice(0),
        cMapUrl: IS_DEV ? '/cmaps/' : getAppUrl(RouteTypes.Static, 'cmaps/'),
      }),
      activeCount: 0,
    });

    task.activeCount += 1;
    const doc = await task.task.promise;

    return doc;
  }

  @action
  public revoke(key: string) {
    const task = this.loadingTasksMap[key];

    assert(task);
    task.activeCount -= 1;

    if (task.activeCount === 0) {
      task.task.destroy();
      delete this.loadingTasksMap[key];
    }

    if (isEmpty(this.loadingTasksMap)) {
      GlobalWorkerOptions.workerPort?.terminate();
      GlobalWorkerOptions.workerPort = null;
    }
  }
}
