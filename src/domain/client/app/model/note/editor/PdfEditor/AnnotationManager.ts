import { computed, observable, runInAction } from 'mobx';
import { type PDFDocumentProxy, AnnotationType } from 'pdfjs-dist';
import { createQuery } from 'mobx-tanstack-query/preset';
import { z } from 'zod';
import type { Selector } from '@apache-annotator/selector';
import { compact } from 'lodash-es';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { NoteVO } from '#domain/shared/model/note';
import type { FragmentSelector } from '#domain/shared/model/annotation';

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
  creationDate: string; // 大概长这样D:20151230152231+01'00'
  modificationDate: string; // 同上
}

export interface PDFAnnotation {
  isNative: boolean;
  page: number;
  content: string;
  createdAt: number;
  updatedAt: number;
  rect: [number, number, number, number];
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
      nativeAnnotations.push(...(await page.getAnnotations()).map((value) => ({ ...value, page: i })));
    }

    runInAction(() => {
      this.nativeAnnotations = nativeAnnotations;
    });
  }

  @computed
  public get list(): PDFAnnotation[] {
    return [
      ...(this.nativeAnnotations || [])
        .filter(({ annotationType }) => annotationType === AnnotationType.HIGHLIGHT)
        .map((v) => {
          const getTime = (time: string) =>
            dayjs(`${time.slice(2, -7)}+${time.slice(-6, -4)}00`, 'YYYYMMDDHHmmssZZ').valueOf();

          return {
            isNative: true,
            page: v.page,
            content: v.contentsObj?.str || '',
            createdAt: getTime(v.creationDate),
            updatedAt: getTime(v.modificationDate),
            rect: v.rect,
          };
        }),

      ...compact(
        (this.annotations.result.data || []).map((v) => {
          const selector = v.selectors[0] ? AnnotationManager.parseSelector(v.selectors[0]) : null;

          if (!selector) {
            return null;
          }

          return {
            isNative: false,
            page: selector.page,
            content: v.body,
            createdAt: v.createdAt,
            updatedAt: v.updatedAt,
            rect: selector.viewrect,
          };
        }),
      ),
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

  public create({ selector, body }: { selector: Selector; body?: string }) {
    return this.remote.annotation.create.mutate({
      targetId: this.noteId,
      selectors: [selector],
      body,
    });
  }

  public static parseSelector(selector: Selector) {
    if (!('type' in selector && selector.type !== 'FragmentSelector')) {
      return null;
    }

    const obj = Object.fromEntries(new URLSearchParams((selector as FragmentSelector).value));
    // see https://datatracker.ietf.org/doc/html/rfc8118#section-3
    const schema = z.object({
      page: z.number(),
      viewrect: z.tuple([z.number(), z.number(), z.number(), z.number()]),
    });

    const result = schema.safeParse(obj);

    if (result.success) {
      return result.data;
    }

    return null;
  }
}
