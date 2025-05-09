import { computed, observable, runInAction } from 'mobx';
import { type PDFDocumentProxy, AnnotationType } from 'pdfjs-dist';
import { createQuery } from 'mobx-tanstack-query/preset';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { NoteVO } from '#domain/shared/model/note';
import type { AnnotationVO, PDFRectSelector, PDFTextFragmentSelector } from '#domain/shared/model/annotation';

dayjs.extend(customParseFormat);

interface NativeAnnotation {
  page: number;
  annotationType: number;
  id: string;
  rect: [number, number, number, number];
  popupRef?: string;
  contentsObj?: {
    str: string;
  };
  creationDate: string | null; // 大概长这样D:20151230152231+01'00'
  modificationDate: string; // 同上
}

export interface AnnotationItem extends AnnotationVO {
  isNative: boolean;
}

export default class AnnotationList {
  constructor(private readonly noteId: NoteVO['id']) {}

  private readonly remote = container.resolve(rpcToken);

  private readonly annotations = createQuery(() => this.remote.annotation.queryByEntityId.query(this.noteId), {
    queryKey: () => ['annotations', { noteId: this.noteId }],
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
      nativeAnnotations.push(...(await page.getAnnotations()).map((value) => ({ ...value, page: i })));
    }

    runInAction(() => {
      this.nativeAnnotations = nativeAnnotations;
    });
  }

  @computed
  public get list(): AnnotationItem[] | undefined {
    if (!this.nativeAnnotations || !this.annotations.result.data) {
      return undefined;
    }

    const toAnnotation = (v: NativeAnnotation) => {
      const getTime = (time: string) =>
        dayjs(`${time.slice(2, -7)}+${time.slice(-6, -4)}00`, 'YYYYMMDDHHmmssZZ').valueOf();

      return {
        isNative: true,
        targetId: this.noteId,
        selectors: [
          {
            type: 'PDFRectSelector' as const,
            page: v.page,
            left: v.rect[0],
            top: v.rect[1],
            width: v.rect[2],
            height: v.rect[3],
          },
        ],
        color: '',
        id: `pdf-native-${v.id}`,
        body: v.contentsObj?.str || '',
        createdAt: getTime(v.creationDate || v.modificationDate),
        updatedAt: getTime(v.modificationDate),
      };
    };

    return [
      ...this.nativeAnnotations
        .filter(({ annotationType }) => annotationType === AnnotationType.HIGHLIGHT)
        .map(toAnnotation),
      ...this.annotations.result.data.map((annotation) => ({ ...annotation, isNative: false })),
    ];
  }

  @computed
  public get hasNative() {
    return Boolean(this.nativeAnnotations && this.nativeAnnotations.length > 0);
  }

  public async create({
    selector,
    body,
    color,
  }: {
    selector: PDFTextFragmentSelector | PDFRectSelector;
    body?: string;
    color: string;
  }) {
    await this.remote.annotation.create.mutate({
      color,
      targetId: this.noteId,
      selectors: [selector],
      body,
    });

    await this.annotations.invalidate();
  }

  public getAnnotationCount(startPage: number, endPage: number) {
    if (!this.list) {
      return 0;
    }

    return this.list.reduce((count, annotation) => {
      if (
        annotation.selectors.some(
          (s) =>
            (s.type === 'PDFRectSelector' && s.page >= startPage && s.page < endPage) ||
            (s.type === 'PDFTextFragmentSelector' && (s.startPage >= startPage || s.endPage <= endPage)),
        )
      ) {
        return count + 1;
      }

      return count;
    }, 0);
  }
}
