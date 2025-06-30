import { action, observable } from 'mobx';
import { type PDFDocumentProxy } from 'pdfjs-dist';
import { createQuery } from 'mobx-tanstack-query/preset';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { z } from 'zod';
import type Mark from 'mark.js';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { NoteVO } from '#domain/shared/model/note';
import {
  type AnnotationVO,
  type PDFSvgSelector,
  type PDFTextPositionSelector,
  getPage,
} from '#domain/client/app/model/annotation';
import PersistedMap from '#domain/client/shared/model/abstract/PersistedMap';

dayjs.extend(customParseFormat);

export interface Position {
  startPage: number;
  startOffset: number;
  endPage: number;
  endOffset: number;
  toStart?: boolean;
}

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

  public async create({ selector, body }: { selector: PDFTextPositionSelector | PDFSvgSelector; body?: string }) {
    await this.remote.annotation.create.mutate({
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
        (s.type === 'PDFSvgSelector' && s.page >= startPage && s.page < endPage) ||
        (s.type === 'PDFTextPositionSelector' && (s.position.startPage >= startPage || s.position.endPage <= endPage))
      );
    }).length;
  }

  private static sort(annotation1: AnnotationVO, annotation2: AnnotationVO) {
    return getPage(annotation1) - getPage(annotation2);
  }

  public static positionToRange(position: Position, currentPage: number) {
    let range: Mark.Range | undefined;

    if (position.startPage === position.endPage) {
      range = {
        start: position.startOffset,
        length: position.endOffset - position.startOffset,
      };
    } else if (position.startPage === currentPage) {
      range = {
        start: position.startOffset,
        length: Number.MAX_SAFE_INTEGER, // mark.js 不接受 Infinity，用 MAX_SAFE_INTEGER 代替
      };
    } else if (position.endPage === currentPage) {
      range = {
        start: 0,
        length: position.endOffset,
      };
    } else {
      range = { start: 0, length: Number.MAX_SAFE_INTEGER };
    }

    return range;
  }
}
