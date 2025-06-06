import { action, observable, runInAction } from 'mobx';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { RefProxy } from 'pdfjs-dist/types/src/display/api';

import type AnnotationManager from './AnnotationManager';
import assert from 'assert';
import PersistedMap from '#domain/client/shared/model/abstract/PersistedObject';
import { z } from 'zod';

export interface OutlineItem {
  title: string;
  children: OutlineItem[];
  parent?: OutlineItem;
  key: string;
  page: number | null;
  dest: unknown[] | null | string; // 传给 pdfjs 的跳转函数用的，具体类型不明，我们也不用管
}

export default class OutlineList {
  constructor(noteId: string, private readonly annotation: AnnotationManager) {
    this.state = new PersistedMap(
      `${noteId}-outlineList`,
      z.object({
        expanded: z.string().array(),
        type: z.union([z.literal('text'), z.literal('image'), z.literal(null)]).optional(),
        scroll: z.object({ x: z.number(), y: z.number() }).optional(),
      }),
      { expanded: [] },
    );
  }

  @observable.ref public accessor items: OutlineItem[] | undefined;

  public readonly state;

  private readonly pageToOutlineItemsMap = new Map<number, OutlineItem>();

  private readonly keyToOutlineItemsMap = new Map<OutlineItem['key'], OutlineItem>();

  @observable public accessor focusedPath: OutlineItem['key'][] | undefined;

  @action.bound
  public focus(page: number) {
    if (this.pageToOutlineItemsMap.size === 0) {
      return;
    }

    for (let i = page; i >= 0; i--) {
      let item = this.pageToOutlineItemsMap.get(i);

      if (item) {
        const path: OutlineItem['key'][] = [];

        while (item) {
          path.unshift(item.key);
          item = item.parent;
        }

        this.focusedPath = path;
        return;
      }
    }

    this.focusedPath = undefined;
  }

  public async init(doc: PDFDocumentProxy) {
    if (this.items) {
      return;
    }

    const outline = (await doc.getOutline()) || [];

    type RawOutlineItem = { title: string; items: RawOutlineItem[]; dest: string | unknown[] | null };

    const toOutlineItem = ({ items, dest, title }: RawOutlineItem, keys: number[]): OutlineItem => {
      const page = Array.isArray(dest) && dest[0] ? doc.cachedPageNumber(dest[0] as RefProxy) : null;
      const item: OutlineItem = {
        children: items.map((item, i) => toOutlineItem(item, [...keys, i])),
        title,
        key: keys.join('-'),
        page,
        dest,
      };

      for (const child of item.children) {
        child.parent = item;
      }

      this.keyToOutlineItemsMap.set(item.key, item);

      if (page) {
        this.pageToOutlineItemsMap.set(page, item);
      }

      return item;
    };

    const items = outline?.map((item, i) => toOutlineItem(item, [i])) || [];

    runInAction(() => {
      this.items = items;
    });
  }

  public getPageRange(key: OutlineItem['key']) {
    const outlineItem = this.keyToOutlineItemsMap.get(key);

    assert(outlineItem && this.items);

    if (!outlineItem.page) {
      return null;
    }

    const siblings = outlineItem.parent?.children || this.items;
    const parentSiblings = outlineItem.parent?.parent?.children || this.items;
    const startPage = outlineItem.page;
    const endPage = (
      siblings[siblings.indexOf(outlineItem) + 1] ||
      (outlineItem.parent && parentSiblings?.[parentSiblings.indexOf(outlineItem.parent) + 1])
    )?.page;

    if (startPage && endPage) {
      return [startPage, endPage] as const;
    }

    return null;
  }

  public getAnnotationCount(key: OutlineItem['key']) {
    if (!this.annotation.list) {
      return 0;
    }

    const range = this.getPageRange(key);

    if (range) {
      this.annotation.getAnnotationCount(range[0], range[1]);
    }

    return 0;
  }
}
