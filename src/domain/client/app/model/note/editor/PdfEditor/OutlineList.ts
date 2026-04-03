import { action, computed, makeAutoObservable, observable, toJS } from 'mobx';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { RefProxy } from 'pdfjs-dist/types/src/display/api';
import assert from 'assert';
import { z } from 'zod';
import { createQuery } from 'mobx-tanstack-query/preset';
import { last } from 'lodash-es';

import type AnnotationManager from './AnnotationManager';
import type { OutlineItem } from '#web/infra/PDFViewer';
import type { NoteVO } from '#domain/shared/model/note';

export type { OutlineItem } from '#web/infra/PDFViewer';

export default class OutlineList {
  constructor(noteId: NoteVO['id'], private readonly annotation: AnnotationManager) {
    this._items = createQuery(this.createItems.bind(this), {
      abortSignal: this.destroyController.signal,
      queryKey: ['pdfOutline', noteId],
      enabled: false, // 无法开启默认加载，因为加载 outline 信息必须等到 pdf view 完成初始化（这个似乎是 pdf.js 的设计缺陷）
    });
  }

  @observable.ref private accessor doc: PDFDocumentProxy | undefined;

  private readonly destroyController = new AbortController();

  private readonly _items;

  @observable public accessor focusedPath: OutlineItem['key'][] | undefined;

  @computed public get focusedKey() {
    if (!this.focusedPath || !this.uiState.expanded) {
      return;
    }

    for (const key of this.focusedPath) {
      const item = this.keyToOutlineItemsMap?.get(key);

      if (item?.parent && this.uiState.expanded.has(item.parent.key)) {
        return key;
      }
    }

    return last(this.focusedPath);
  }

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

  @observable public accessor uiState: z.infer<typeof OutlineList.schema> = {};

  @action
  public init(v?: OutlineList['uiState']) {
    if (v) {
      this.uiState = v;
    }
  }

  public load() {
    return this._items.refetch();
  }

  @action
  public setDoc(doc: PDFDocumentProxy) {
    if (!this.doc) {
      this.doc = doc;
    }
  }

  private async createItems() {
    const doc = this.doc;
    assert(doc);

    const outline = (await doc.getOutline()) || [];
    const pageToOutlineItemsMap = new Map<number, OutlineItem>();
    const keyToOutlineItemsMap = new Map<OutlineItem['key'], OutlineItem>();

    type RawOutlineItem = { title: string; items: RawOutlineItem[]; dest: string | unknown[] | null };

    const toOutlineItem = ({ items, dest, title }: RawOutlineItem, keys: number[]): OutlineItem => {
      let page: number | null = null;

      if (Array.isArray(dest)) {
        if (typeof dest[0] === 'object') {
          page = doc.cachedPageNumber(dest[0] as RefProxy);
        } else if (Number.isInteger(dest[0])) {
          page = (dest[0] as number) + 1;
        }
      }

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

  public toJSON() {
    return {
      ...toJS(this.uiState),
      expanded: this.uiState.expanded && Array.from(this.uiState.expanded),
    };
  }

  public destroy() {
    this.destroyController.abort();
  }

  @action.bound
  public toggleExpand({ key, value }: { key: string; value: boolean }) {
    if (!this.uiState.expanded) {
      this.uiState.expanded = new Set();
    }

    if (value) {
      this.uiState.expanded.add(key);
    } else {
      this.uiState.expanded.delete(key);
    }
  }
  public expandToFocus() {
    if (!this.focusedPath || this.focusedPath.length === 0) {
      return;
    }

    for (const key of this.focusedPath) {
      this.toggleExpand({ value: true, key });
    }

    return this.focusedPath[0];
  }
  @action
  public focus(page: number) {
    if (!this.pageToOutlineItemsMap || this.pageToOutlineItemsMap.size === 0) {
      return;
    }

    for (let i = page; i >= 0; i--) {
      let item = this.pageToOutlineItemsMap.get(i);

      if (item) {
        const path: OutlineItem['key'][] = [];

        while (item) {
          path.push(item.key);
          item = item.parent;
        }

        this.focusedPath = path;
        return;
      }
    }

    this.focusedPath = undefined;
  }

  public static readonly schema = z.object({
    expanded: z
      .string()
      .array()
      .transform((v) => new Set(v))
      .optional()
      .catch(undefined),
    isEnabled: z.boolean().optional().catch(undefined),
    width: z.number().optional().catch(undefined),
    scroll: z.object({ x: z.number(), y: z.number() }).optional().catch(undefined),
    isFloating: z.boolean().optional().catch(undefined),
    floatingPos: z
      .object({
        x: z.number(),
        y: z.number(),
      })
      .optional()
      .catch(undefined),
    floatingSize: z
      .object({
        width: z.number(),
        height: z.number(),
      })
      .optional()
      .catch(undefined),
  });
}
