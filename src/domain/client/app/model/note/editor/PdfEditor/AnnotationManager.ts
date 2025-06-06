import { computed, observable, runInAction } from 'mobx';
import { type PDFDocumentProxy, AnnotationType } from 'pdfjs-dist';
import { createQuery } from 'mobx-tanstack-query/preset';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { NoteVO } from '#domain/shared/model/note';
import type { AnnotationVO, PDFRectSelector, PDFTextPositionSelector } from '#domain/shared/model/annotation';
import PersistedMap from '#domain/client/shared/model/abstract/PersistedObject';
import { z } from 'zod';

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

export default class AnnotationManager {
  constructor(private readonly noteId: NoteVO['id']) {
    this.state = new PersistedMap(
      `${noteId}-annotationManager`,
      z.object({
        panel: z.boolean().optional(),
        native: z.boolean().optional(),
      }),
      {},
    );
  }

  public readonly state;

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
        selector: {
          type: 'PDFRectSelector' as const,
          page: v.page,
          left: v.rect[0],
          top: v.rect[1],
          width: v.rect[2],
          height: v.rect[3],
        },
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
    ].sort(AnnotationManager.sort);
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
    selector: PDFTextPositionSelector | PDFRectSelector;
    body?: string;
    color: string;
  }) {
    await this.remote.annotation.create.mutate({
      color,
      targetId: this.noteId,
      selector,
      body,
    });

    await this.annotations.invalidate();
  }

  public getAnnotationCount(startPage: number, endPage: number) {
    if (!this.list) {
      return 0;
    }

    return this.list.filter(({ selector: s }) => {
      return (
        (s.type === 'PDFRectSelector' && s.page >= startPage && s.page < endPage) ||
        (s.type === 'PDFTextPositionSelector' && (s.position.startPage >= startPage || s.position.endPage <= endPage))
      );
    }).length;
  }

  private static sort(annotation1: AnnotationVO, annotation2: AnnotationVO) {
    const page1 =
      annotation1.selector.type === 'PDFRectSelector'
        ? annotation1.selector.page
        : annotation1.selector.type === 'PDFTextPositionSelector'
        ? annotation1.selector.position.startPage
        : 0;

    const page2 =
      annotation2.selector.type === 'PDFRectSelector'
        ? annotation2.selector.page
        : annotation2.selector.type === 'PDFTextPositionSelector'
        ? annotation2.selector.position.startPage
        : 0;

    return page1 - page2;
  }
}
