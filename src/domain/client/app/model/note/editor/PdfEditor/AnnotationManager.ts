import { action, observable } from 'mobx';
import { type PDFDocumentProxy } from 'pdfjs-dist';
import { createQuery } from 'mobx-tanstack-query/preset';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { NoteVO } from '#domain/shared/model/note';
import type { AnnotationVO, PDFRectSelector, PDFTextPositionSelector } from '#domain/shared/model/annotation';
import PersistedMap from '#domain/client/shared/model/abstract/PersistedMap';
import { z } from 'zod';

dayjs.extend(customParseFormat);

export default class AnnotationManager {
  constructor(private readonly noteId: NoteVO['id']) {
    this.state = new PersistedMap(
      `${noteId}-annotationManager`,
      z.object({
        panelVisible: z.boolean().optional(),
        native: z.boolean().optional(),
      }),
      {},
    );
  }

  public readonly state;

  @observable.ref private accessor doc: PDFDocumentProxy | undefined;

  public readonly openStatusMap: Record<string, boolean> = {};

  private readonly remote = container.resolve(rpcToken);

  public readonly items = createQuery(() => this.remote.annotation.queryByEntityId.query(this.noteId), {
    select: (data) => data.toSorted(AnnotationManager.sort),
    queryKey: () => ['annotations', { noteId: this.noteId }],
  });

  @action
  public init(doc: PDFDocumentProxy) {
    this.doc = doc;
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

    await this.items.invalidate();
  }

  public getAnnotationCount(startPage: number, endPage: number) {
    if (!this.items.result.data) {
      return 0;
    }

    return this.items.result.data.filter(({ selector: s }) => {
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
