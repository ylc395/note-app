import { createQuery } from 'mobx-tanstack-query/preset';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import type Mark from 'mark.js';
import { action, computed, observable, toJS } from 'mobx';
import z from 'zod';
import { pickBy, uniqBy } from 'lodash-es';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { NoteVO } from '#domain/shared/model/note';
import {
  type AnnotationVO,
  type PDFSvgSelector,
  type PDFTextPositionSelector,
  getPageRange,
} from '#domain/client/app/model/annotation';

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
    this.items = createQuery(() => this.remote.annotation.queryByEntityId.query(this.noteId), {
      select: (data) => data.toSorted(AnnotationManager.sort),
      queryKey: ['annotations', { noteId }],
      abortSignal: this.destroyController.signal,
      options: () => ({ enabled: this.uiState.isEnabled }),
    });
  }

  private readonly destroyController = new AbortController();

  public readonly items;

  public readonly openStatusMap: Record<string, boolean> = {};

  private readonly remote = container.resolve(rpcToken);

  public async create({ selector, body }: { selector: PDFTextPositionSelector | PDFSvgSelector; body?: string }) {
    await this.remote.annotation.create.mutate({
      parentId: this.noteId,
      selector,
      body,
    });

    await this.items.invalidate();
  }

  public async update(
    id: AnnotationVO['id'],
    patch: { selector: PDFTextPositionSelector | PDFSvgSelector; body?: string },
  ) {
    await this.remote.annotation.updateOne.mutate([id, patch]);
    await this.items.invalidate();
  }

  public getAnnotationCount(startPage: number, endPage: number) {
    const annotations = pickBy(this.pages, (annotations, page) => {
      return Number(page) >= startPage && Number(page) <= endPage;
    });

    return uniqBy(Object.values(annotations).flat(), ({ id }) => id).length;
  }

  @computed
  public get pages() {
    const result: Record<number, AnnotationVO[]> = {};

    for (const annotation of this.items.result.data || []) {
      const pages = getPageRange(annotation);

      for (const page of pages) {
        if (!result[page]) {
          result[page] = [];
        }
        result[page]!.push(annotation);
      }
    }

    return result;
  }

  @observable
  public accessor uiState: z.infer<typeof AnnotationManager.schema> = {};

  public toJSON() {
    return toJS(this.uiState);
  }

  @action
  public init(value?: AnnotationManager['uiState']) {
    if (value) {
      this.uiState = value;
    }
  }

  @action
  public destroy() {
    this.destroyController.abort();
  }

  private static sort(annotation1: AnnotationVO, annotation2: AnnotationVO) {
    return getPageRange(annotation1)[0]! - getPageRange(annotation2)[0]!;
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

  public static readonly schema = z.object({
    isEnabled: z.boolean().optional().catch(undefined),
    width: z.number().optional().catch(undefined),
    scroll: z.object({ x: z.number(), y: z.number() }).optional().catch(undefined),
    isFloating: z.boolean().optional().catch(undefined),
    floatingPos: z.object({ x: z.number(), y: z.number() }).nullish().catch(undefined),
    floatingSize: z
      .object({
        width: z.number(),
        height: z.number(),
      })
      .optional()
      .catch(undefined),
  });
}
