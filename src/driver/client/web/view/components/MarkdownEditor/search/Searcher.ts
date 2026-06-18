import type { Ctx } from '@milkdown/kit/ctx';
import { editorCtx, EditorStatus, editorViewCtx } from '@milkdown/kit/core';
import { TextSelection } from '@milkdown/kit/prose/state';

import {
  SearchQuery,
  setSearchState,
  findNext,
  findPrev,
  replaceNext,
  replaceAll as searchReplaceAll,
  getSearchState,
  getMatchHighlights,
} from 'prosemirror-search';
import assert from 'assert';
import { observable } from 'mobx';

export interface Options {
  currentMatchIndex?: number;
  replaceExpanded?: boolean;
  search?: string;
  replace?: string;
  caseSensitive?: boolean;
  literal?: boolean;
  regexp?: boolean;
  wholeWord?: boolean;
  defaultOpen?: boolean;
}

export class Searcher {
  constructor(private ctx: Ctx, public options?: Options) {}

  public init() {
    if (this.options?.defaultOpen) {
      this.search(this.options);

      if (typeof this.options.currentMatchIndex === 'number') {
        this.jumpTo(this.options.currentMatchIndex);
      }
    }

    this.isReady = true;
  }

  @observable
  public accessor isReady = false;

  private get view() {
    return this.ctx.get(editorViewCtx);
  }

  public search(options: Options, range?: { from: number; to: number }) {
    assert(this.ctx.get(editorCtx).status === EditorStatus.Created);

    this.options = options;

    if (options.search === undefined) {
      return null;
    }

    const view = this.view;
    const tr = setSearchState(view.state.tr, new SearchQuery(options as Options & { search: string }), range ?? null);
    view.dispatch(tr);

    return this.getInfo();
  }

  public next() {
    const view = this.view;
    findNext(view.state, view.dispatch);
    return this.getInfo();
  }

  public prev() {
    const view = this.view;
    findPrev(view.state, view.dispatch);
    return this.getInfo();
  }

  public replace() {
    const view = this.view;
    replaceNext(view.state, view.dispatch);
    return this.getInfo();
  }

  public replaceAll() {
    const view = this.view;
    searchReplaceAll(view.state, view.dispatch);
    return this.getInfo();
  }

  /**
   * 跳转到指定索引的匹配项（从 1 开始）。
   * 需要先调用 search() 建立搜索结果。
   *
   * 这里看似只修改 selection 而不涉及搜索状态，实际上搜索状态就是依赖 selection 的
   */
  private jumpTo(index: number) {
    const view = this.view;
    const state = view.state;
    const searchState = getSearchState(state);
    if (!searchState || !searchState.query.valid) return this.getInfo();

    const decorations = getMatchHighlights(state);
    const matches = decorations.find(0, state.doc.content.size);
    const total = matches.length;

    if (total === 0 || index < 1 || index > total) {
      return this.getInfo();
    }

    const target = matches[index - 1];
    if (!target) return this.getInfo();
    const tr = state.tr.setSelection(TextSelection.create(state.doc, target.from, target.to)).scrollIntoView();
    view.dispatch(tr);

    return this.getInfo();
  }

  public clear() {
    const view = this.view;
    const tr = setSearchState(view.state.tr, new SearchQuery({ search: '' }));
    view.dispatch(tr);
  }

  /**
   * 获取当前搜索的匹配信息（总数 + 当前索引，从 1 开始）
   */
  private getInfo() {
    const view = this.view;
    const search = getSearchState(view.state);
    if (!search || !search.query.valid) return null;

    const decorations = getMatchHighlights(view.state);
    const matches = decorations.find(0, view.state.doc.content.size);
    const total = matches.length;

    if (total === 0) return { total: 0, current: 0 };

    const sel = view.state.selection;
    const idx = matches.findIndex((d) => d.from === sel.from && d.to === sel.to);

    return { total, current: idx === -1 ? 0 : idx + 1 };
  }
}
