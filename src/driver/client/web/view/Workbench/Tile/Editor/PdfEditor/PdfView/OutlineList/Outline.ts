import { action, autorun, computed, observable, reaction, when } from 'mobx';
import assert from 'assert';
import { last } from 'lodash-es';

import type { OutlineItem } from '#domain/client/app/model/note/editor/PdfEditor/OutlineList';

import type PDFEditorViewer from '../PDFEditorViewer';

export default class Outline {
  constructor(public readonly pdfViewer: PDFEditorViewer) {
    this.outlineList = pdfViewer.editor.outline;

    when(
      () => Boolean(this.pdfViewer.editor.outline.uiState),
      () => this.initUIState(),
      { signal: this.destroyController.signal },
    );

    if (this.pdfViewer.viewer.pagesPromise) {
      this.pdfViewer.viewer.pagesPromise.then(this.init.bind(this));
    } else {
      this.pdfViewer.viewer.eventBus.on('pagesloaded', this.init.bind(this));
    }
  }

  private initUIState() {
    const expanded = this.pdfViewer.editor.outline.uiState?.expanded;
    this.expandedKeys = new Set(expanded);

    autorun(
      () => {
        if (this.expandedKeys) {
          this.pdfViewer.editor.outline.uiState!.expanded = Array.from(this.expandedKeys);
        }
      },
      { signal: this.destroyController.signal },
    );
  }

  private init() {
    const doc = this.pdfViewer.editor.doc;
    assert(doc);

    this.outlineList.setDoc(doc);

    reaction(
      () => this.pdfViewer.viewer.currentPage,
      (page) => {
        if (this.jumpByItem) {
          this.jumpByItem = false;
          return;
        }

        if (typeof page === 'number') {
          this.focus(page);
        }
      },
      { signal: this.destroyController.signal, fireImmediately: true },
    );
  }

  private readonly destroyController = new AbortController();

  @observable public accessor expandedKeys: Set<string> | undefined;

  private readonly outlineList;

  private jumpByItem = false;

  @action
  public jumpTo(dest: OutlineItem) {
    this.jumpByItem = true;
    this.pdfViewer.viewer.jumpTo(dest);

    // 这里需要手动维护下 focusedPath。自动维护的 focusedPath 总是去找同一页的最后一个 outline
    const focusedPath: OutlineItem['key'][] = [];
    let current: OutlineItem | undefined = dest;

    while (current) {
      focusedPath.push(current.key);
      current = current.parent;
    }

    this.focusedPath = focusedPath;
  }

  @action.bound
  public toggleExpand({ key, value }: { key: string; value: boolean }) {
    assert(this.expandedKeys);

    if (value) {
      this.expandedKeys.add(key);
    } else {
      this.expandedKeys.delete(key);
    }
  }

  @observable private accessor focusedPath: OutlineItem['key'][] | undefined;

  @computed public get focusedKey() {
    if (!this.focusedPath || !this.expandedKeys) {
      return;
    }

    for (const key of this.focusedPath) {
      const item = this.outlineList.keyToOutlineItemsMap?.get(key);

      if (item?.parent && this.expandedKeys.has(item.parent.key)) {
        return key;
      }
    }

    return last(this.focusedPath);
  }

  @action
  private focus(page: number) {
    if (!this.outlineList.pageToOutlineItemsMap || this.outlineList.pageToOutlineItemsMap.size === 0) {
      return;
    }

    for (let i = page; i >= 0; i--) {
      let item = this.outlineList.pageToOutlineItemsMap.get(i);

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

  public expandToFocus() {
    if (!this.focusedPath || this.focusedPath.length === 0) {
      return;
    }

    for (const key of this.focusedPath) {
      this.toggleExpand({ value: true, key });
    }

    return this.focusedPath[0];
  }

  public destroy() {
    this.destroyController.abort();
  }
}
