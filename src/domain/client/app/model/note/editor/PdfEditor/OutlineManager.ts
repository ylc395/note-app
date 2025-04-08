import { action, observable, runInAction } from 'mobx';
import type { RefProxy } from 'pdfjs-dist/types/src/display/api';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface OutlineItem {
  title: string;
  children: OutlineItem[];
  key: string;
  dest: unknown[] | null | string; // 传给 pdfjs 的跳转函数用的，具体类型不明，我们也不用管
}

export default class OutlineManager {
  @observable.ref public accessor items: OutlineItem[] | undefined;

  private readonly outlineItemsMap = new Map<number, OutlineItem>();

  @observable public accessor focusedItemKey: OutlineItem['key'] | undefined;

  @action.bound
  public focus(page: number) {
    if (this.outlineItemsMap.size === 0) {
      return;
    }

    for (let i = page; i >= 0; i--) {
      const item = this.outlineItemsMap.get(i);

      if (item) {
        this.focusedItemKey = item.key;
        return;
      }
    }

    this.focusedItemKey = undefined;
  }

  public async init(doc: PDFDocumentProxy) {
    if (this.items) {
      return;
    }

    const outline = (await doc.getOutline()) || [];

    type RawOutlineItem = { title: string; items: RawOutlineItem[]; dest: string | unknown[] | null };

    const toOutlineItem = ({ items, dest, title }: RawOutlineItem, keys: number[]): OutlineItem => {
      const page = Array.isArray(dest) && dest[0] ? doc.cachedPageNumber(dest[0] as RefProxy) : null;
      const item = {
        children: items.map((item, i) => toOutlineItem(item, [...keys, i])),
        title,
        key: keys.join('-'),
        dest,
      };

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
