import { getDocument, GlobalWorkerOptions, type PDFDocumentLoadingTask, type PDFDocumentProxy } from 'pdfjs-dist';
import { isEmpty } from 'lodash-es';
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

import { IS_DEV } from '#domain/shared/infra/env';
import { getAppUrl, RouteTypes } from '#domain/shared/infra/url';

interface LoadingTaskEntry {
  activeCount: number;
  task: PDFDocumentLoadingTask;
  revoked: boolean; // 整个 entry 是否已被销毁（activeCount 归零时置为 true）
}

export interface PDFDocumentToken {
  /** 加载完成的 PDF 文档；若加载被取消则会 reject 一个 AbortError */
  readonly doc: Promise<PDFDocumentProxy>;
  /** 释放本次引用，可在 doc resolve 前后任意时刻调用，幂等 */
  dispose: () => void;
}

export default class PDFDocumentFactory {
  private readonly loadingTasksMap: Record<string, LoadingTaskEntry> = {};

  public create({ key, blob }: { key: string; blob: ArrayBuffer }): PDFDocumentToken {
    if (!GlobalWorkerOptions.workerPort) {
      // 一个 worker 与一个 PDFWorker 一一对应
      // 多个 loadingTask（及其对应的 document） 可共用同一个 PDFWorker
      // pdfjs 内部逻辑：当全局上存在 worker，则后续都不会再新建 PDFWorker，而是复用该全局 worker 对应的 PDFWorker
      GlobalWorkerOptions.workerPort = new PdfJsWorker(); // 这里创建的是一个 worker，而非 PDFWorker
    }

    const entry = (this.loadingTasksMap[key] ||= {
      task: getDocument({
        data: blob.slice(0),
        cMapUrl: IS_DEV ? '/pdf/cmaps/' : getAppUrl(RouteTypes.Static, 'pdf/cmaps/'),
        wasmUrl: IS_DEV ? '/pdf/wasm/' : getAppUrl(RouteTypes.Static, 'pdf/wasm/'),
      }),
      activeCount: 0,
      revoked: false,
    });

    entry.activeCount += 1;

    let cancelled = false;
    let released = false;

    const release = () => {
      if (released) {
        return;
      }
      released = true;

      entry.activeCount -= 1;
      if (entry.activeCount === 0) {
        entry.revoked = true;
        void entry.task.destroy();
        delete this.loadingTasksMap[key];
      }

      if (isEmpty(this.loadingTasksMap)) {
        GlobalWorkerOptions.workerPort?.terminate();
        GlobalWorkerOptions.workerPort = null;
      }
    };

    const { promise: doc, resolve, reject } = Promise.withResolvers<PDFDocumentProxy>();
    const cancel = () => reject(new DOMException('PDF loading was cancelled', 'AbortError'));

    entry.task.promise.then(
      (d) => {
        if (cancelled || entry.revoked) {
          cancel();
          return;
        }
        resolve(d);
      },
      (e) => {
        if (cancelled || entry.revoked) {
          cancel();
          return;
        }
        release();
        reject(e);
      },
    );

    const dispose = () => {
      cancelled = true;
      release();
    };

    return { doc, dispose };
  }
}
