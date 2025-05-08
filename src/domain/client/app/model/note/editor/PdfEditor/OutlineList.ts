import { action, observable, runInAction } from 'mobx';
import type { RefProxy } from 'pdfjs-dist/types/src/display/api';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface OutlineItem {
  title: string;
  children: OutlineItem[];
  parent?: OutlineItem;
  key: string;
  dest: unknown[] | null | string; // 传给 pdfjs 的跳转函数用的，具体类型不明，我们也不用管
}

export default class OutlineList {
  @observable.ref public accessor items: OutlineItem[] | undefined;

  private readonly outlineItemsMap = new Map<number, OutlineItem>();

  @observable public accessor focusedPath: OutlineItem['key'][] | undefined;

  @action.bound
  public focus(page: number) {
    if (this.outlineItemsMap.size === 0) {
      return;
    }

    for (let i = page; i >= 0; i--) {
      let item = this.outlineItemsMap.get(i);

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
        dest,
      };

      for (const child of item.children) {
        child.parent = item;
      }

      if (page) {
        this.outlineItemsMap.set(page, item);
      }

      return item;
    };

    const items = outline?.map((item, i) => toOutlineItem(item, [i])) || [];

    runInAction(() => {
      this.items = items;
    });
  }
}
