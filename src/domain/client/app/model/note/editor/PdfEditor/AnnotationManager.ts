import { computed, observable, runInAction } from 'mobx';
import { type PDFDocumentProxy, AnnotationType } from 'pdfjs-dist';
import { createQuery } from 'mobx-tanstack-query/preset';

import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { NoteVO } from '#domain/shared/model/note';
import type { AnnotationVO } from '#domain/shared/model/annotation';

export interface NativeAnnotation {
  annotationType: number;
  id: string;
  rect: [number, number, number, number];
  popupRef?: string;
  contentsObj?: {
    str: string;
  };
}

export default class AnnotationManager {
  constructor(private readonly noteId: NoteVO['id']) {}

  private readonly remote = container.resolve(rpcToken);

  private readonly annotations = createQuery(() => this.remote.annotation.queryByEntityId.query(this.noteId), {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  @observable.ref private accessor nativeAnnotations: NativeAnnotation[] | undefined;

  public async init(doc: PDFDocumentProxy) {
    this.annotations.refetch();

    const nativeAnnotations: NativeAnnotation[] = [];
    // 想要获取所有 PDF 自带的 annotations，似乎只能通过遍历所有页来进行。而且这些 annotations 的信息未必完全
    // see https://github.com/mozilla/pdf.js/issues/17509
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      nativeAnnotations.push(...(await page.getAnnotations()));
    }

    runInAction(() => {
      this.nativeAnnotations = nativeAnnotations;
    });
  }

  @computed
  public get list() {
    return [
      ...(this.nativeAnnotations || []).filter(({ annotationType }) => annotationType === AnnotationType.HIGHLIGHT),
      ...(this.annotations.result.data || []),
    ];
  }

  @computed
  public get status() {
    if (this.annotations.result.isLoading || !this.nativeAnnotations) {
      return 'loading';
    }

    return 'ok';
  }

  @computed
  public get hasNative() {
    return Boolean(this.nativeAnnotations && this.nativeAnnotations.length > 0);
  }

  public static isNative(value: AnnotationVO | NativeAnnotation): value is NativeAnnotation {
    return 'annotationType' in value;
  }
}
