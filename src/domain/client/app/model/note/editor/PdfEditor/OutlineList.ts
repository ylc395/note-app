import { action, computed, makeAutoObservable, observable, when } from 'mobx';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { RefProxy } from 'pdfjs-dist/types/src/display/api';
import assert from 'assert';
import { z } from 'zod';
import { createQuery } from 'mobx-tanstack-query/preset';

import type AnnotationManager from './AnnotationManager';
import PersistedMap from '#domain/client/shared/model/abstract/PersistedMap';

export interface OutlineItem {
  title: string;
  children: OutlineItem[];
  parent?: OutlineItem;
  key: string;
  page: number | null;
  dest: unknown[] | null | string; // 传给 pdfjs 的跳转函数用的，具体类型不明，我们也不用管
}

export default class OutlineList {
  constructor(private readonly annotation: AnnotationManager) {
    this.state = new PersistedMap(
      `${annotation.noteId}-outlineList`,
      z.object({
        expanded: z.string().array(),
        panelVisible: z.boolean().optional(),
        scroll: z.object({ x: z.number(), y: z.number() }).optional(),
      }),
      { expanded: [] },
    );

    this._items = createQuery(this.createItems.bind(this), {
      abortSignal: this.destroyController.signal,
      queryKey: ['pdfOutline', annotation.noteId],
      options: () => ({ enabled: Boolean(this.doc) }),
    });
  }

  @observable.ref private accessor doc: PDFDocumentProxy | undefined;

  private readonly destroyController = new AbortController();

  private readonly _items;

  @computed
  public get items() {
    return this._items.result.data?.items;
  }

  @computed
  public get keyToOutlineItemsMap() {
    return this._items.result.data?.keyToOutlineItemsMap;
  }

  @computed
  public get pageToOutlineItemsMap() {
    return this._items.result.data?.pageToOutlineItemsMap;
  }

  public readonly state;

  @action
  public init(doc: PDFDocumentProxy) {
    if (!this.doc) {
      this.doc = doc;
    }

    return when(() => Boolean(this.items));
  }

  private async createItems() {
    const doc = this.doc;
    assert(doc);
    const outline = (await doc.getOutline()) || [];
    const pageToOutlineItemsMap = new Map<number, OutlineItem>();
    const keyToOutlineItemsMap = new Map<OutlineItem['key'], OutlineItem>();

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

      keyToOutlineItemsMap.set(item.key, item);

      if (page) {
        pageToOutlineItemsMap.set(page, item);
      }

      return makeAutoObservable(item, { parent: false }); // 特意标注一下 parent 不要弄成响应式的，不然会无限递归
    };

    const items = outline?.map((item, i) => toOutlineItem(item, [i])) || [];

    return {
      items,
      keyToOutlineItemsMap,
      pageToOutlineItemsMap,
    };
  }

  public getPageRange(key: OutlineItem['key']) {
    const outlineItem = this.keyToOutlineItemsMap?.get(key);
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
    if (!this.annotation.items.result.data) {
      return 0;
    }

    const range = this.getPageRange(key);

    if (range) {
      this.annotation.getAnnotationCount(range[0], range[1]);
    }

    return 0;
  }

  public destroy() {
    this.destroyController.abort();
  }
}
